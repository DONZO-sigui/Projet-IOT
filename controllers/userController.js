const User = require('../models/User');

/**
 * Page de gestion des utilisateurs
 */
exports.usersPage = async (req, res) => {
    try {
        res.locals.currentPath = '/admin/utilisateurs';
        res.render('admin/utilisateurs', {
            title: 'Proj_iot - Gestion Utilisateurs',
            user: req.user
        });
    } catch (error) {
        console.error('Erreur affichage page utilisateurs:', error);
        res.status(500).send('Erreur serveur');
    }
};

/**
 * Récupérer tous les utilisateurs (admin uniquement)
 */
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll();
        res.json({ success: true, users });
    } catch (error) {
        console.error('Erreur récupération utilisateurs:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Récupérer les détails d'un utilisateur
 */
exports.getUserDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({ success: false, error: 'Utilisateur non trouvé' });
        }

        // Ne pas renvoyer le mot de passe
        delete user.password;

        res.json({ success: true, user });
    } catch (error) {
        console.error('Erreur récupération utilisateur:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Mettre à jour le rôle d'un utilisateur
 */
exports.updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!['admin', 'pecheur', 'observateur', 'technicien'].includes(role)) {
            return res.status(400).json({
                success: false,
                error: 'Rôle invalide'
            });
        }

        const updatedUser = await User.updateRole(id, role);

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                error: 'Utilisateur non trouvé'
            });
        }

        res.json({ success: true, message: 'Rôle mis à jour', user: updatedUser });
    } catch (error) {
        console.error('Erreur mise à jour rôle:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Activer/Désactiver un utilisateur
 */
exports.toggleUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;

        const updatedUser = await User.updateStatus(id, isActive);

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                error: 'Utilisateur non trouvé'
            });
        }

        res.json({ success: true, message: 'Statut mis à jour', user: updatedUser });
    } catch (error) {
        console.error('Erreur mise à jour statut:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Supprimer un utilisateur
 */
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        // Empêcher la suppression de son propre compte
        if (req.user && req.user.id === parseInt(id)) {
            return res.status(400).json({
                success: false,
                error: 'Vous ne pouvez pas supprimer votre propre compte'
            });
        }

        const deleted = await User.delete(id);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                error: 'Utilisateur non trouvé'
            });
        }

        res.json({ success: true, message: 'Utilisateur supprimé' });
    } catch (error) {
        console.error('Erreur suppression utilisateur:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Récupérer les statistiques utilisateur
 */
exports.getUserStats = async (req, res) => {
    try {
        const stats = await User.getStats();

        // Convertir les valeurs en nombres
        const formattedStats = {
            total: parseInt(stats.total) || 0,
            admins: parseInt(stats.admins) || 0,
            pecheurs: parseInt(stats.pecheurs) || 0,
            observateurs: parseInt(stats.observateurs) || 0,
            techniciens: parseInt(stats.techniciens) || 0,
            active: parseInt(stats.active) || 0
        };

        res.json({ success: true, stats: formattedStats });
    } catch (error) {
        console.error('Erreur récupération statistiques:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = exports;
