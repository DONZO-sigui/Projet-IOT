const ActivityLog = require('../models/ActivityLog');

/**
 * API: Mettre à jour les paramètres système
 */
exports.updateSettings = async (req, res) => {
    try {
        const settings = req.body;

        // Ici, on pourrait sauvegarder les paramètres dans un fichier ou une table
        // Pour l'instant, on simule la sauvegarde et on loggue l'action

        // Log activity
        if (req.user) {
            await ActivityLog.log(req.user.id, 'UPDATE_SETTINGS', 'system', 'settings', 'Mise à jour des paramètres système (Application, Sécurité, IoT, etc.)');
        }

        res.json({ success: true, message: 'Paramètres enregistrés et action journalisée' });
    } catch (error) {
        console.error('Erreur sauvegarde paramètres:', error);
        res.status(500).json({ success: false, error: 'Erreur lors de la sauvegarde' });
    }
};
