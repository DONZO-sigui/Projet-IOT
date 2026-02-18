const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');

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
 * Créer un utilisateur (API Admin)
 */
exports.createUser = async (req, res) => {
    try {
        const { username, email, password, role } = req.body;

        if (!username || !email || !password || !role) {
            return res.status(400).json({ success: false, error: 'Tous les champs sont requis' });
        }

        const user = await User.create(username, email, password, role);

        // Log activity
        if (req.user) {
            await ActivityLog.log(req.user.id, 'CREATE_USER', 'user', user.id, `Création utilisateur ${username} (Admin)`);
        }

        res.json({ success: true, user, message: 'Utilisateur créé avec succès' });

    } catch (error) {
        // Gestion des erreurs de duplicata (code 23505 souvent pour postgres)
        if (error.code === '23505') {
            return res.status(400).json({ success: false, error: 'Cet email ou nom d\'utilisateur est déjà utilisé' });
        }
        console.error('Erreur création utilisateur:', error);
        res.status(500).json({ success: false, error: error.message || 'Erreur lors de la création' });
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

/**
 * Page de profil utilisateur (pour tous les rôles)
 */
exports.profilePage = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.locals.currentPath = '/admin/profil';
        res.render('admin/profil', {
            title: 'Proj_iot - Mon Profil',
            user: user
        });
    } catch (error) {
        console.error('Erreur affichage page profil:', error);
        res.status(500).send('Erreur serveur');
    }
};

/**
 * Mettre à jour le profil (API)
 */
exports.updateUserProfile = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const userId = req.user.id;

        if (!username || !email) {
            return res.status(400).json({ success: false, error: 'Nom d\'utilisateur et email requis' });
        }

        // Mettre à jour les infos de base
        const updatedUser = await User.updateProfile(userId, username, email);

        // Mettre à jour le mot de passe si fourni
        if (password && password.trim() !== '') {
            await User.updatePassword(userId, password);
        }

        // Log activity
        await ActivityLog.log(userId, 'UPDATE_PROFILE', 'user', userId, `Mise à jour du profil par ${username}`);

        res.json({
            success: true,
            message: 'Profil mis à jour avec succès',
            user: updatedUser
        });

    } catch (error) {
        console.error('Erreur mise à jour profil:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = exports;
