/**
 * Service de Monitoring des Zones
 * Détecte les violations de zones et génère des alertes automatiques
 * 
 * @requires models/Zone
 * @requires models/Alert
 * @requires models/Boat
 */
const Zone = require('../models/Zone');
const Alert = require('../models/Alert');
const Boat = require('../models/Boat');

class ZoneMonitoringService {
    /**
     * Vérifier si une position de bateau viole une zone
     * @param {number} boatId - ID du bateau
     * @param {number} latitude - Latitude
     * @param {number} longitude - Longitude
     * @returns {Promise<Array>} Liste des alertes générées
     */
    static async checkBoatPosition(boatId, latitude, longitude) {
        try {
            const alerts = [];

            // Récupérer toutes les zones
            const zones = await Zone.findAll();

            // Récupérer les informations du bateau
            const boat = await Boat.findById(boatId);
            if (!boat) {
                console.warn(`Bateau ${boatId} non trouvé`);
                return alerts;
            }

            // Vérifier chaque zone interdite ou protégée
            for (const zone of zones) {
                // Ignorer les zones de pêche autorisée
                if (zone.type === 'fishing') continue;

                // Vérifier si le bateau est dans cette zone
                const isInZone = Zone.isPointInZone([latitude, longitude], zone.coordinates);

                if (isInZone) {
                    console.log(`⚠️ Bateau ${boatId} détecté dans zone ${zone.name} (${zone.type})`);

                    // Vérifier si une alerte similaire existe déjà (dans les 10 dernières minutes)
                    const recentAlerts = await Alert.findAll({
                        boatId: boatId,
                        acknowledged: false,
                        limit: 10
                    });

                    const hasSimilarAlert = recentAlerts.some(alert => {
                        if (alert.zone_id !== zone.id) return false;
                        const alertTime = new Date(alert.created_at);
                        const now = new Date();
                        const diffMinutes = (now - alertTime) / 1000 / 60;
                        return diffMinutes < 10; // Alerte dans les 10 dernières minutes
                    });

                    if (hasSimilarAlert) {
                        console.log(`ℹ️ Alerte similaire détectée pour bateau ${boatId} dans zone ${zone.name}`);
                    }

                    // FORCE ALERT CREATION FOR DEBUG
                    if (true) {
                        const severity = zone.type === 'prohibited' ? 'critical' : 'warning';
                        const message = this.generateAlertMessage(boat, zone);

                        const alert = await Alert.create(
                            boatId,
                            zone.id,
                            'zone_violation',
                            severity,
                            message,
                            latitude,
                            longitude
                        );

                        alerts.push(alert);
                        console.log(`🚨 Alerte générée: Bateau ${boat.name} dans zone ${zone.name}`);
                    }
                }
            }

            return alerts;
        } catch (error) {
            console.error('Erreur lors de la vérification de position:', error);
            throw error;
        }
    }

    /**
     * Générer un message d'alerte personnalisé
     * @param {Object} boat - Informations du bateau
     * @param {Object} zone - Informations de la zone
     * @returns {string} Message d'alerte
     */
    static generateAlertMessage(boat, zone) {
        const zoneTypeMessages = {
            'prohibited': `⛔ ZONE INTERDITE: Le bateau "${boat.name}" (${boat.registration_number}) a pénétré dans la zone interdite "${zone.name}". Intervention requise.`,
            'protected': `⚠️ ZONE PROTÉGÉE: Le bateau "${boat.name}" (${boat.registration_number}) se trouve dans la zone protégée "${zone.name}". Surveillance recommandée.`,
            'restricted': `⚠️ ZONE RESTREINTE: Le bateau "${boat.name}" (${boat.registration_number}) est entré dans la zone restreinte "${zone.name}".`
        };

        return zoneTypeMessages[zone.type] || `Bateau "${boat.name}" détecté dans zone "${zone.name}"`;
    }

    /**
     * Surveiller tous les bateaux actifs
     * Vérifie les dernières positions de tous les bateaux
     * @returns {Promise<Array>} Liste de toutes les alertes générées
     */
    static async monitorAllBoats() {
        try {
            const GpsPosition = require('../models/GpsPosition');
            const allAlerts = [];

            // Récupérer les dernières positions de tous les bateaux
            const positions = await GpsPosition.getLatestForAllBoats();

            // Vérifier chaque position
            for (const position of positions) {
                if (position.boat_id && position.latitude && position.longitude) {
                    const alerts = await this.checkBoatPosition(
                        position.boat_id,
                        position.latitude,
                        position.longitude
                    );
                    allAlerts.push(...alerts);
                }
            }

            if (allAlerts.length > 0) {
                console.log(`✅ Monitoring terminé: ${allAlerts.length} nouvelle(s) alerte(s) générée(s)`);
            }

            return allAlerts;
        } catch (error) {
            console.error('Erreur lors du monitoring global:', error);
            throw error;
        }
    }

    /**
     * Vérifier si un bateau est sorti d'une zone autorisée
     * (Alerte de dérive)
     * @param {number} boatId - ID du bateau
     * @param {number} latitude - Latitude
     * @param {number} longitude - Longitude
     * @returns {Promise<Alert|null>} Alerte générée ou null
     */
    static async checkDriftFromAuthorizedZone(boatId, latitude, longitude) {
        try {
            // Récupérer toutes les zones de pêche autorisées
            const authorizedZones = await Zone.findByType('fishing');

            // Vérifier si le bateau est dans au moins une zone autorisée
            const isInAuthorizedZone = authorizedZones.some(zone => {
                return Zone.isPointInZone([latitude, longitude], zone.coordinates);
            });

            // Si le bateau n'est dans aucune zone autorisée
            if (!isInAuthorizedZone && authorizedZones.length > 0) {
                const boat = await Boat.findById(boatId);
                if (!boat) return null;

                // Vérifier si une alerte de dérive récente existe déjà
                const recentAlerts = await Alert.findAll({
                    boatId: boatId,
                    type: 'drift_warning',
                    acknowledged: false,
                    limit: 5
                });

                const hasRecentDriftAlert = recentAlerts.some(alert => {
                    const alertTime = new Date(alert.created_at);
                    const now = new Date();
                    const diffMinutes = (now - alertTime) / 1000 / 60;
                    return diffMinutes < 30; // Alerte dans les 30 dernières minutes
                });

                if (!hasRecentDriftAlert) {
                    const message = `⚠️ DÉRIVE: Le bateau "${boat.name}" (${boat.registration_number}) se trouve en dehors des zones de pêche autorisées.`;

                    const alert = await Alert.create(
                        boatId,
                        null, // Pas de zone spécifique
                        'drift_warning',
                        'warning',
                        message,
                        latitude,
                        longitude
                    );

                    console.log(`🌊 Alerte de dérive générée pour ${boat.name}`);
                    return alert;
                }
            }

            return null;
        } catch (error) {
            console.error('Erreur lors de la vérification de dérive:', error);
            throw error;
        }
    }

    /**
     * Nettoyer les anciennes alertes acquittées
     * @param {number} days - Nombre de jours à conserver
     * @returns {Promise<Object>} Résultat du nettoyage
     */
    static async cleanupOldAlerts(days = 30) {
        try {
            const result = await Alert.deleteOldAcknowledged(days);
            console.log(`🧹 Nettoyage: ${result.deleted} anciennes alertes supprimées`);
            return result;
        } catch (error) {
            console.error('Erreur lors du nettoyage des alertes:', error);
            throw error;
        }
    }
}

module.exports = ZoneMonitoringService;
