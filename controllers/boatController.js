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

        // Sécurité : Un pêcheur ne peut voir que ses propres bateaux
        if (req.user && req.user.role === 'pecheur' && boat.owner_id !== req.user.id) {
            return res.status(403).json({ success: false, error: 'Accès refusé : ce bateau ne vous appartient pas' });
        }

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

        let finalOwnerId = ownerId;
        let finalStatus = 'active';

        // Si l'utilisateur est un pêcheur, il ne peut enregistrer que pour lui-même et en 'pending'
        if (req.user.role === 'pecheur') {
            finalOwnerId = req.user.id;
            finalStatus = 'pending';
        } else if (!ownerId) {
            return res.status(400).json({
                success: false,
                error: 'Vous devez sélectionner un propriétaire pour le bateau'
            });
        }

        const User = require('../models/User');
        const owner = await User.findById(finalOwnerId);

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

        const boat = await Boat.create(name, registrationNumber, finalOwnerId, deviceId, finalStatus);

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
            message: req.user.role === 'pecheur'
                ? `Demande d'enregistrement du bateau "${name}" envoyée avec succès. En attente de validation par un administrateur.`
                : `Bateau "${name}" créé et assigné à ${owner.username}`
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
        // Sécurité : Un pêcheur ne peut modifier que ses propres bateaux
        const boat = await Boat.findById(id);
        if (!boat) {
            return res.status(404).json({ success: false, error: 'Bateau non trouvé' });
        }

        if (req.user && req.user.role === 'pecheur' && boat.owner_id !== req.user.id) {
            return res.status(403).json({ success: false, error: 'Accès refusé : vous ne pouvez pas modifier ce bateau' });
        }

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
        // Sécurité : Un pêcheur ne peut supprimer que ses propres bateaux
        const boat = await Boat.findById(id);
        if (!boat) {
            return res.status(404).json({ success: false, error: 'Bateau non trouvé' });
        }

        if (req.user && req.user.role === 'pecheur' && boat.owner_id !== req.user.id) {
            return res.status(403).json({ success: false, error: 'Accès refusé : vous ne pouvez pas supprimer ce bateau' });
        }

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

        // Sécurité : Un pêcheur ne peut voir les positions que de ses propres bateaux
        const boat = await Boat.findById(id);
        if (!boat) {
            return res.status(404).json({ success: false, error: 'Bateau non trouvé' });
        }

        if (req.user && req.user.role === 'pecheur' && boat.owner_id !== req.user.id) {
            return res.status(403).json({ success: false, error: 'Accès refusé' });
        }

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
        let { boatId, deviceId, latitude, longitude, speed, heading, altitude } = req.body;

        // Si on a deviceId mais pas boatId, on cherche le bateau
        if (!boatId && deviceId) {
            const boat = await Boat.findByDeviceId(deviceId);
            if (boat) {
                boatId = boat.id;
            } else {
                return res.status(404).json({ success: false, error: 'Bateau non trouvé pour ce deviceId' });
            }
        }

        if (!boatId || !latitude || !longitude) {
            return res.status(400).json({
                success: false,
                error: 'boatId (ou deviceId), latitude et longitude requis'
            });
        }

        // Vérifier si le bateau existe et est actif
        const boat = await Boat.findById(boatId);
        if (!boat) {
            return res.status(404).json({ success: false, error: 'Bateau non trouvé' });
        }

        if (boat.status !== 'active' && boat.status !== 'maintenance') {
            return res.status(403).json({
                success: false,
                error: `Le bateau est en statut "${boat.status}". Acquisition GPS refusée.`
            });
        }

        console.log(`📡 Réception position pour bateau ${boat.name} (${boatId}): [${latitude}, ${longitude}]`);

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

/**
 * Approuver un bateau (Admin uniquement)
 */
exports.approveBoat = async (req, res) => {
    try {
        const { id } = req.params;
        const boat = await Boat.findById(id);

        if (!boat) {
            return res.status(404).json({ success: false, error: 'Bateau non trouvé' });
        }

        await Boat.update(id, { status: 'active' });

        // Log activity
        await ActivityLog.log(req.user.id, 'APPROVE_BOAT', 'boat', id, `Approbation du bateau ${boat.name}`);

        res.json({ success: true, message: `Le bateau "${boat.name}" a été approuvé avec succès.` });
    } catch (error) {
        console.error('Erreur approbation bateau:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Rejeter/Supprimer un bateau (Admin uniquement)
 */
exports.rejectBoat = async (req, res) => {
    try {
        const { id } = req.params;
        const boat = await Boat.findById(id);

        if (!boat) {
            return res.status(404).json({ success: false, error: 'Bateau non trouvé' });
        }

        // On peut soit supprimer, soit marquer comme rejeté. 
        // Ici on le supprime pour ne pas encombrer, car c'est un rejet d'inscription.
        await Boat.delete(id);

        // Log activity
        await ActivityLog.log(req.user.id, 'REJECT_BOAT', 'boat', id, `Rejet et suppression du bateau ${boat.name}`);

        res.json({ success: true, message: `La demande pour le bateau "${boat.name}" a été rejetée et supprimée.` });
    } catch (error) {
        console.error('Erreur rejet bateau:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Mettre à jour manuellement la position d'un bateau (Admin uniquement)
 */
exports.updateBoatPosition = async (req, res) => {
    try {
        const { id } = req.params;
        const { latitude, longitude, speed, heading } = req.body;

        if (!latitude || !longitude) {
            return res.status(400).json({ success: false, error: 'Latitude et longitude requises' });
        }

        const boat = await Boat.findById(id);
        if (!boat) {
            return res.status(404).json({ success: false, error: 'Bateau non trouvé' });
        }

        // Créer une nouvelle position GPS
        const position = await GpsPosition.create(
            id,
            parseFloat(latitude),
            parseFloat(longitude),
            parseFloat(speed) || 0, // speed
            parseFloat(heading) || 0, // heading
            0  // altitude
        );

        // Log activity
        await ActivityLog.log(req.user.id, 'MANUAL_POSITION_UPDATE', 'boat', id, `Mise à jour manuelle de la position du bateau ${boat.name} : [${latitude}, ${longitude}]`);

        res.json({
            success: true,
            message: `La position du bateau "${boat.name}" a été mise à jour manuellement.`,
            position
        });
    } catch (error) {
        console.error('Erreur mise à jour manuelle position:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = exports;
