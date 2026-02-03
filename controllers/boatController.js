const Boat = require('../models/Boat');
const GpsPosition = require('../models/GpsPosition');

/**
 * Page de suivi GPS
 */
exports.trackingPage = async (req, res) => {
    try {
        res.locals.currentPath = '/admin/gps-tracking';
        res.render('admin/gps-tracking', {
            title: 'Proj_iot - Suivi GPS',
            user: req.user
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

        const boat = await Boat.create(name, registrationNumber, ownerId, deviceId);
        res.json({ success: true, boat });
    } catch (error) {
        console.error('Erreur création bateau:', error);
        res.status(500).json({ success: false, error: error.message });
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

        res.json({ success: true, position });
    } catch (error) {
        console.error('Erreur enregistrement position:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = exports;
