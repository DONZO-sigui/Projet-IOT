const Alert = require('../models/Alert');
const ZoneMonitoringService = require('../services/zoneMonitoringService');
const Boat = require('../models/Boat');
const ActivityLog = require('../models/ActivityLog');

/**
 * Récupérer toutes les alertes avec filtres
 */
exports.getAllAlerts = async (req, res) => {
    try {
        const filters = {
            boatId: req.query.boatId ? parseInt(req.query.boatId) : undefined,
            acknowledged: req.query.acknowledged !== undefined ? req.query.acknowledged === 'true' : undefined,
            severity: req.query.severity,
            type: req.query.type,
            limit: req.query.limit ? parseInt(req.query.limit) : 100
        };

        // Si l'utilisateur est un pêcheur, filtrer par ses bateaux
        if (req.user && req.user.role === 'pecheur') {
            const Boat = require('../models/Boat');
            const userBoats = await Boat.findByOwner(req.user.id);
            const boatIds = userBoats.map(b => b.id);

            // Récupérer toutes les alertes et filtrer
            const allAlerts = await Alert.findAll(filters);
            const alerts = allAlerts.filter(alert => boatIds.includes(alert.boat_id));
            return res.json({ success: true, alerts });
        }

        // Admin et technicien voient toutes les alertes
        const alerts = await Alert.findAll(filters);
        res.json({ success: true, alerts });
    } catch (error) {
        console.error('Erreur récupération alertes:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Récupérer les alertes actives (non acquittées)
 */
exports.getActiveAlerts = async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit) : 50;
        let alerts = await Alert.findActive(limit);

        // Filtrer par propriétaire si pêcheur
        if (req.user && req.user.role === 'pecheur') {
            const Boat = require('../models/Boat');
            const userBoats = await Boat.findByOwner(req.user.id);
            const boatIds = userBoats.map(b => b.id);
            alerts = alerts.filter(alert => boatIds.includes(alert.boat_id));
        }

        res.json({ success: true, alerts });
    } catch (error) {
        console.error('Erreur récupération alertes actives:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Récupérer les statistiques des alertes
 */
exports.getStats = async (req, res) => {
    try {
        let stats;
        if (req.user && req.user.role === 'pecheur') {
            stats = await Alert.getStatsByOwner(req.user.id);
        } else {
            stats = await Alert.getStats();
        }
        res.json({ success: true, stats });
    } catch (error) {
        console.error('Erreur récupération stats alertes:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Récupérer une alerte spécifique
 */
exports.getAlertById = async (req, res) => {
    try {
        const { id } = req.params;
        const alert = await Alert.findById(id);

        if (!alert) {
            return res.status(404).json({ success: false, error: 'Alerte non trouvée' });
        }

        // Vérifier les permissions pour les pêcheurs
        if (req.user && req.user.role === 'pecheur') {
            const Boat = require('../models/Boat');
            const boat = await Boat.findById(alert.boat_id);
            if (!boat || boat.owner_id !== req.user.id) {
                return res.status(403).json({ success: false, error: 'Accès refusé' });
            }
        }

        res.json({ success: true, alert });
    } catch (error) {
        console.error('Erreur récupération alerte:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Marquer une alerte comme acquittée
 */
exports.acknowledgeAlert = async (req, res) => {
    try {
        const { id } = req.params;
        const alert = await Alert.findById(id);

        if (!alert) {
            return res.status(404).json({ success: false, error: 'Alerte non trouvée' });
        }

        // Vérifier les permissions pour les pêcheurs
        if (req.user && req.user.role === 'pecheur') {
            const Boat = require('../models/Boat');
            const boat = await Boat.findById(alert.boat_id);
            if (!boat || boat.owner_id !== req.user.id) {
                return res.status(403).json({ success: false, error: 'Accès refusé' });
            }
        }

        const updatedAlert = await Alert.acknowledge(id, req.user.id);
        res.json({ success: true, alert: updatedAlert });
    } catch (error) {
        console.error('Erreur acquittement alerte:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Supprimer une alerte (admin uniquement)
 */
exports.deleteAlert = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await Alert.delete(id);

        if (result.deleted === 0) {
            return res.status(404).json({ success: false, error: 'Alerte non trouvée' });
        }

        res.json({ success: true, message: 'Alerte supprimée' });
    } catch (error) {
        console.error('Erreur suppression alerte:', error);
        res.status(500).json({ success: false, error: 'Erreur lors de la suppression de l\'alerte' });
    }
};

/**
 * Générer une alerte de simulation (pour démo)
 */
exports.generateMockAlert = async (req, res) => {
    try {
        // Données optionnelles passées dans le corps (ex: pour SOS manuel)
        const { type, severity, message, boatId } = req.body;

        let selectedBoat;
        if (boatId) {
            selectedBoat = await Boat.findById(boatId);
        } else {
            // Choisir un bateau de l'utilisateur si pêcheur, sinon un bateau au hasard
            let boats;
            if (req.user && req.user.role === 'pecheur') {
                boats = await Boat.findByOwner(req.user.id);
            } else {
                boats = await Boat.findAll();
            }

            if (!boats || boats.length === 0) {
                return res.status(400).json({ success: false, error: 'Aucun bateau disponible pour générer l\'alerte.' });
            }
            selectedBoat = boats[Math.floor(Math.random() * boats.length)];
        }

        if (!selectedBoat) {
            return res.status(404).json({ success: false, error: 'Bateau non trouvé' });
        }

        // Définir le scénario (utiliser le corps ou un défaut aléatoire)
        let alertType = type || 'zone_violation';
        let alertSeverity = severity || 'warning';
        let alertMessage = message || `Alerte automatique sur le bateau ${selectedBoat.name}`;

        if (!type && !severity && !message) {
            const scenarios = [
                { type: 'sos', severity: 'critical', message: '🆘 APPEL DE DÉTRESSE ! SOS signalé.' },
                { type: 'zone_violation', severity: 'warning', message: '🚫 Entrée dans une zone interdite (Zone Rouge).' },
                { type: 'speed', severity: 'warning', message: '⚡ Vitesse excessive détectée (> 45 nœuds).' },
                { type: 'battery', severity: 'info', message: '🔋 Batterie faible sur le capteur GPS.' },
                { type: 'sensor_loss', severity: 'info', message: '📡 Perte de signal temporaire du capteur.' }
            ];
            const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
            alertType = scenario.type;
            alertSeverity = scenario.severity;
            alertMessage = `${scenario.message} (Bateau: ${selectedBoat.name})`;
        }

        // Générer une position aléatoire autour de Conakry (pour le réalisme)
        const lat = 9.5 + (Math.random() * 0.1);
        const lng = -13.7 + (Math.random() * 0.1);

        // Créer l'alerte
        const alert = await Alert.create(
            selectedBoat.id,
            null, // zoneId
            alertType,
            alertSeverity,
            alertMessage,
            lat,
            lng
        );

        // Log l'activité
        if (req.user) {
            await ActivityLog.log(req.user.id, 'SIMULATE_ALERT', 'alert', alert.id, `Génération alerte: ${alertType}`);
        }

        res.json({ success: true, alert, message: 'Alerte générée avec succès !' });

    } catch (error) {
        console.error('Erreur génération alerte mock:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = exports;
