const Zone = require('../models/Zone');
const ActivityLog = require('../models/ActivityLog');

/**
 * Page de gestion des zones
 */
exports.zonesPage = async (req, res) => {
    try {
        res.locals.currentPath = '/admin/zones';
        res.render('admin/zones', {
            title: 'Proj_iot - Zones de Pêche',
            user: req.user
        });
    } catch (error) {
        console.error('Erreur affichage page zones:', error);
        res.status(500).send('Erreur serveur');
    }
};

/**
 * Récupérer toutes les zones
 */
exports.getAllZones = async (req, res) => {
    try {
        const zones = await Zone.findAll();
        res.json({ success: true, zones });
    } catch (error) {
        console.error('Erreur récupération zones:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Récupérer une zone par ID
 */
exports.getZoneById = async (req, res) => {
    try {
        const { id } = req.params;
        const zone = await Zone.findById(id);

        if (!zone) {
            return res.status(404).json({ success: false, error: 'Zone non trouvée' });
        }

        res.json({ success: true, zone });
    } catch (error) {
        console.error('Erreur récupération zone:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Créer une nouvelle zone
 */
exports.createZone = async (req, res) => {
    try {
        const { name, type, coordinates, description, color } = req.body;

        if (!name || !type || !coordinates) {
            return res.status(400).json({
                success: false,
                error: 'Nom, type et coordonnées requis'
            });
        }

        const createdBy = req.user ? req.user.id : null;
        const zone = await Zone.create(name, type, coordinates, description, color, createdBy);

        // Log activity
        await ActivityLog.log(req.user.id, 'CREATE_ZONE', 'zone', zone.id, `Création zone ${name}`);

        res.json({ success: true, zone });
    } catch (error) {
        console.error('Erreur création zone:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Mettre à jour une zone
 */
exports.updateZone = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;

        const result = await Zone.update(id, data);

        if (result.changes === 0) {
            return res.status(404).json({ success: false, error: 'Zone non trouvée' });
        }

        res.json({ success: true, message: 'Zone mise à jour' });

        // Log activity
        await ActivityLog.log(req.user.id, 'UPDATE_ZONE', 'zone', id, `Mise à jour zone #${id}`);
    } catch (error) {
        console.error('Erreur mise à jour zone:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Supprimer une zone
 */
exports.deleteZone = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await Zone.delete(id);

        if (result.changes === 0) {
            return res.status(404).json({ success: false, error: 'Zone non trouvée' });
        }

        res.json({ success: true, message: 'Zone supprimée' });

        // Log activity
        await ActivityLog.log(req.user.id, 'DELETE_ZONE', 'zone', id, `Suppression zone #${id}`);
    } catch (error) {
        console.error('Erreur suppression zone:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Récupérer les statistiques des zones
 */
exports.getZoneStats = async (req, res) => {
    try {
        const stats = await Zone.countByType();
        res.json({ success: true, stats });
    } catch (error) {
        console.error('Erreur récupération statistiques zones:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = exports;
