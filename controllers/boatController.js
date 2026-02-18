const Boat = require('../models/Boat');
const GpsPosition = require('../models/GpsPosition');
const ActivityLog = require('../models/ActivityLog');

/**
 * Page de suivi GPS
 */
exports.trackingPage = async (req, res) => {
    try {
        res.locals.currentPath = '/admin/gps-tracking';

        // Récupérer la liste des pêcheurs pour le formulaire d'ajout
        const User = require('../models/User');
        const users = await User.findAll();

        // Filtrer uniquement les pêcheurs
        const pecheurs = users.filter(u => u.role === 'pecheur');

        res.render('admin/gps-tracking', {
            title: 'Proj_iot - Suivi GPS',
            user: req.user,
            pecheurs // Passer la liste des pêcheurs à la vue
        });
    } catch (error) {
        console.error('Erreur affichage page GPS:', error);
        res.status(500).send('Erreur serveur');
    }
};

/**
 * Récupérer tous les bateaux
 * Filtre par propriétaire si l'utilisateur n'est pas admin
 */
exports.getAllBoats = async (req, res) => {
    try {
        let boats;

        // Si admin ou technicien, accès à tous les bateaux
        // Sinon (pêcheur), accès uniquement à ses bateaux
        if (req.user && (req.user.role === 'admin' || req.user.role === 'technicien')) {
            boats = await Boat.findAll();
        } else if (req.user) {
            boats = await Boat.findByOwner(req.user.id);
        } else {
            // Cas non authentifié (ne devrait pas arriver avec middleware mais sécurité supplémentaire)
            boats = [];
        }

        // Récupérer la dernière position de chaque bateau
        const boatsWithPositions = await Promise.all(
            boats.map(async (boat) => {
                const lastPosition = await GpsPosition.getLatestByBoat(boat.id);
                return {
                    ...boat,
                    lastPosition
                };
            })
        );

        res.json({ success: true, boats: boatsWithPositions });
    } catch (error) {
        console.error('Erreur récupération bateaux:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Récupérer les détails d'un bateau
 */
exports.getBoatDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const boat = await Boat.findById(id);

        if (!boat) {
            return res.status(404).json({ success: false, error: 'Bateau non trouvé' });
        }

        const lastPosition = await GpsPosition.getLatestByBoat(id);

        res.json({
            success: true,
            boat: {
                ...boat,
                lastPosition
            }
        });
    } catch (error) {
        console.error('Erreur récupération bateau:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Créer un nouveau bateau
 */
exports.createBoat = async (req, res) => {
    try {
        const { name, registrationNumber, ownerId, deviceId } = req.body;

        if (!name || !registrationNumber) {
            return res.status(400).json({
                success: false,
                error: 'Nom et numéro d\'immatriculation requis'
            });
        }

        // Vérifier que le propriétaire existe et est un pêcheur
        if (!ownerId) {
            return res.status(400).json({
                success: false,
                error: 'Vous devez sélectionner un propriétaire pour le bateau'
            });
        }

        const User = require('../models/User');
        const owner = await User.findById(ownerId);

        if (!owner) {
            return res.status(400).json({
                success: false,
                error: 'Le pêcheur sélectionné n\'existe pas'
            });
        }

        if (owner.role !== 'pecheur') {
            return res.status(400).json({
                success: false,
                error: 'Le propriétaire doit avoir le rôle "pêcheur"'
            });
        }

        const boat = await Boat.create(name, registrationNumber, ownerId, deviceId);

        // NOUVEAU: Enregistrer la position initiale si fournie
        const { latitude, longitude } = req.body;
        if (latitude && longitude) {
            await GpsPosition.create(
                boat.id,
                parseFloat(latitude),
                parseFloat(longitude),
                0, // speed
                0, // heading
                0  // altitude
            );
            console.log(`📍 Position initiale enregistrée pour le bateau ${boat.id}: [${latitude}, ${longitude}]`);
        }

        // Log activity
        await ActivityLog.log(req.user.id, 'CREATE_BOAT', 'boat', boat.id, `Création bateau ${name}`);

        res.json({
            success: true,
            boat,
            message: `Bateau "${name}" créé et assigné à ${owner.username}`
        });
    } catch (error) {
        console.error('Erreur création bateau:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Erreur lors de la création du bateau'
        });
    }
};

/**
 * Mettre à jour un bateau
 */
exports.updateBoat = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;

        const result = await Boat.update(id, data);

        if (result.changes === 0) {
            return res.status(404).json({ success: false, error: 'Bateau non trouvé' });
        }

        res.json({ success: true, message: 'Bateau mis à jour' });

        // Log activity
        await ActivityLog.log(req.user.id, 'UPDATE_BOAT', 'boat', id, `Mise à jour bateau #${id}`);
    } catch (error) {
        console.error('Erreur mise à jour bateau:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Supprimer un bateau
 */
exports.deleteBoat = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await Boat.delete(id);

        if (result.changes === 0) {
            return res.status(404).json({ success: false, error: 'Bateau non trouvé' });
        }

        res.json({ success: true, message: 'Bateau supprimé' });

        // Log activity
        await ActivityLog.log(req.user.id, 'DELETE_BOAT', 'boat', id, `Suppression bateau #${id}`);
    } catch (error) {
        console.error('Erreur suppression bateau:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Récupérer les positions GPS d'un bateau
 */
exports.getBoatPositions = async (req, res) => {
    try {
        const { id } = req.params;
        const { limit = 50 } = req.query;

        const positions = await GpsPosition.getRecentPositions(id, parseInt(limit));
        res.json({ success: true, positions });
    } catch (error) {
        console.error('Erreur récupération positions:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Enregistrer une nouvelle position GPS (pour les dispositifs IoT)
 */
exports.recordPosition = async (req, res) => {
    try {
        const { boatId, latitude, longitude, speed, heading, altitude } = req.body;
        console.log(`📡 Réception position pour bateau ${boatId}: [${latitude}, ${longitude}]`);

        if (!boatId || !latitude || !longitude) {
            return res.status(400).json({
                success: false,
                error: 'boatId, latitude et longitude requis'
            });
        }

        const position = await GpsPosition.create(
            boatId,
            latitude,
            longitude,
            speed,
            heading,
            altitude
        );

        // 🚨 NOUVEAU: Vérifier automatiquement les violations de zones
        try {
            const ZoneMonitoringService = require('../services/zoneMonitoringService');

            // Vérifier les violations de zones interdites/protégées
            const violationAlerts = await ZoneMonitoringService.checkBoatPosition(
                boatId,
                latitude,
                longitude
            );

            // Vérifier la dérive hors zones autorisées
            const driftAlert = await ZoneMonitoringService.checkDriftFromAuthorizedZone(
                boatId,
                latitude,
                longitude
            );

            const alerts = [...violationAlerts];
            if (driftAlert) alerts.push(driftAlert);

            console.log(`🚨 ${alerts.length} alerte(s) générée(s) pour bateau ${boatId}`);

            // Retourner la position avec les alertes générées
            res.json({
                success: true,
                position,
                alerts: alerts.length > 0 ? alerts : undefined
            });
        } catch (monitoringError) {
            // Si le monitoring échoue, on retourne quand même la position
            console.error('Erreur monitoring zones:', monitoringError);
            res.json({
                success: true,
                position,
                monitoringError: 'Erreur lors de la vérification des zones'
            });
        }
    } catch (error) {
        console.error('Erreur enregistrement position:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = exports;
