const Device = require('../models/Device');
const virtualDeviceService = require('../services/virtualDeviceService');
const ActivityLog = require('../models/ActivityLog');

/**
 * Page de gestion des dispositifs IoT
 */
exports.devicesPage = async (req, res) => {
    try {
        res.locals.currentPath = '/admin/dispositifs';

        // Récupérer les devices et stats
        const devices = await Device.findAll();
        const stats = await Device.getStats();

        // Récupérer la liste des bateaux pour le formulaire d'ajout
        const Boat = require('../models/Boat');
        const boats = await Boat.findAll();

        // Récupérer la dernière télémétrie pour chaque device
        const devicesWithTelemetry = await Promise.all(devices.map(async (device) => {
            try {
                // Générer une donnée fraîche pour l'affichage
                const telemetry = await virtualDeviceService.generateTelemetry(device.id);
                return { ...device, telemetry };
            } catch (error) {
                return { ...device, telemetry: null };
            }
        }));

        res.render('admin/dispositifs', {
            title: 'Proj_iot - Dispositifs IoT',
            user: req.user,
            devices: devicesWithTelemetry,
            stats,
            boats // Passer la liste des bateaux à la vue
        });
    } catch (error) {
        console.error('Erreur page dispositifs:', error);
        res.status(500).send('Erreur serveur');
    }
};

/**
 * API: Récupérer tous les devices avec télémétrie temps réel
 */
exports.getAllDevices = async (req, res) => {
    try {
        // En mode virtuel, on peut régénérer la télémétrie à la demande
        const telemetryData = await virtualDeviceService.generateAllTelemetry();
        res.json({ success: true, data: telemetryData });
    } catch (error) {
        console.error('Erreur API devices:', error);
        res.status(500).json({ success: false, error: 'Erreur récupération données' });
    }
};

/**
 * API: Récupérer les détails d'un device
 */
exports.getDeviceDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const device = await Device.findById(id);

        if (!device) {
            return res.status(404).json({ success: false, error: 'Device non trouvé' });
        }

        const telemetry = await virtualDeviceService.generateTelemetry(id);
        const history = await Device.getTelemetryHistory(id, getPrimaryMetric(device.device_type));
        const alarms = await Device.getActiveAlarms(id);

        res.json({ success: true, device, telemetry, history, alarms });
    } catch (error) {
        console.error('Erreur API device details:', error);
        res.status(500).json({ success: false, error: 'Erreur récupération détails' });
    }
};

/**
 * API: Créer un device
 */
exports.createDevice = async (req, res) => {
    try {
        const { boat_id } = req.body;

        // Vérifier que le bateau existe et est lié à un propriétaire
        const Boat = require('../models/Boat');
        const boat = await Boat.findById(boat_id);

        if (!boat) {
            return res.status(400).json({
                success: false,
                error: 'Le bateau sélectionné n\'existe pas'
            });
        }

        if (!boat.owner_id) {
            return res.status(400).json({
                success: false,
                error: 'Le bateau sélectionné n\'est pas assigné à un pêcheur'
            });
        }

        // Créer le device
        const newDevice = await Device.create(req.body);

        // Initialiser l'état virtuel
        virtualDeviceService.initDeviceState(newDevice.id, newDevice.device_type);

        // Log activity
        if (req.user) {
            await ActivityLog.log(req.user.id, 'CREATE_DEVICE', 'device', newDevice.id, `Ajout dispositif ${newDevice.name} (${newDevice.device_type})`);
        }

        res.json({
            success: true,
            device: newDevice,
            message: `Device créé et associé au bateau "${boat.name}"`
        });
    } catch (error) {
        console.error('Erreur création device:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Erreur création device'
        });
    }
};

/**
 * API: Mettre à jour un device (générique)
 */
exports.updateDevice = async (req, res) => {
    try {
        const { id } = req.params;
        const device = await Device.update(id, req.body);

        if (!device) {
            return res.status(404).json({ success: false, error: 'Device non trouvé' });
        }

        // Log activity
        if (req.user) {
            await ActivityLog.log(req.user.id, 'UPDATE_DEVICE', 'device', id, `Mise à jour dispositif ${device.device_name}`);
        }

        res.json({ success: true, device, message: 'Configuration mise à jour' });
    } catch (error) {
        console.error('Erreur update device:', error);
        res.status(500).json({ success: false, error: 'Erreur mise à jour dispositif' });
    }
};

/**
 * API: Mettre à jour la configuration (partie JSONB)
 */
exports.updateConfig = async (req, res) => {
    try {
        const { id } = req.params;
        const { config } = req.body;
        const device = await Device.updateConfig(id, config);

        // Log activity
        if (req.user) {
            await ActivityLog.log(req.user.id, 'UPDATE_DEVICE_CONFIG', 'device', id, `Mise à jour config device ${id}`);
        }

        res.json({ success: true, device });
    } catch (error) {
        console.error('Erreur update config:', error);
        res.status(500).json({ success: false, error: 'Erreur mise à jour configuration' });
    }
};

/**
 * API: Actions sur device (redémarrage, calibration)
 */
exports.deviceAction = async (req, res) => {
    try {
        const { id } = req.params;
        const { action } = req.body;

        // Simuler une action
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (action === 'reboot') {
            await Device.updateStatus(id, 'maintenance');
            setTimeout(() => Device.updateStatus(id, 'online'), 5000);
        }

        // Log activity
        if (req.user) {
            await ActivityLog.log(req.user.id, 'DEVICE_ACTION', 'device', id, `Action ${action} sur device ${id}`);
        }

        res.json({ success: true, message: `Action ${action} effectuée` });
    } catch (error) {
        console.error('Erreur action device:', error);
        res.status(500).json({ success: false, error: 'Erreur exécution action' });
    }
};

// Helper: Obtenir la métrique principale pour historique
function getPrimaryMetric(type) {
    switch (type) {
        case 'sensor_ph': return 'ph';
        case 'sensor_temp': return 'temperature';
        case 'sensor_turbidity': return 'turbidity';
        case 'gps': return 'speed'; // Ou latitude
        case 'gateway': return 'devices_connected';
        default: return 'battery';
    }
}
