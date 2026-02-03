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
        // TODO: Implémenter User.findAll() dans le modèle User
        // Pour l'instant, retourner un tableau vide
        res.json({ success: true, users: [] });
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

        if (!['admin', 'pecheur', 'observateur'].includes(role)) {
            return res.status(400).json({
                success: false,
                error: 'Rôle invalide'
            });
        }

        // TODO: Implémenter User.updateRole() dans le modèle User
        res.json({ success: true, message: 'Rôle mis à jour' });
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

        // TODO: Implémenter User.updateStatus() dans le modèle User
        res.json({ success: true, message: 'Statut mis à jour' });
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

        // TODO: Implémenter User.delete() dans le modèle User
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
        // TODO: Implémenter les statistiques
        res.json({
            success: true,
            stats: {
                total: 0,
                admins: 0,
                pecheurs: 0,
                observateurs: 0,
                active: 0
            }
        });
    } catch (error) {
        console.error('Erreur récupération statistiques:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = exports;
