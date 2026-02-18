const axios = require('axios');
const Device = require('../models/Device');
const virtualDeviceService = require('./virtualDeviceService');

/**
 * Service ThingsBoard avec support des devices virtuels
 * Utilise des données réalistes générées par virtualDeviceService
 */
class ThingsboardService {
    constructor() {
        this.token = null;
        this.baseUrl = process.env.THINGSBOARD_URL || 'https://thingsboard.cloud';
        this.useVirtualDevices = true; // Mode virtuel par défaut
    }

    /**
     * Envoyer la télémétrie à ThingsBoard
     */
    async pushTelemetry(deviceId, token, telemetryData) {
        if (!token || token === 'VIRTUAL_TOKEN') {
            console.log(`[TB] Pas de token pour device ${deviceId}, envoi ignoré.`);
            return;
        }

        try {
            const url = `${this.baseUrl}/api/v1/${token}/telemetry`;
            await axios.post(url, telemetryData);
            console.log(`[TB] Données envoyées pour device ${deviceId} via ${url}`);
        } catch (error) {
            console.error(`[TB] Erreur envoi télémétrie device ${deviceId}:`, error.message);
        }
    }

    /**
     * Récupérer la télémétrie d'un device (virtuel ou réel)
     * @param {string} deviceId - ID du device (peut être l'ID DB ou ThingsBoard ID)
     * @returns {Promise<Object>} Données télémétriques
     */
    async getDeviceTelemetry(deviceId) {
        if (this.useVirtualDevices) {
            // Mode virtuel : générer des données réalistes
            try {
                // Essayer de trouver le device par ID numérique
                let device = await Device.findById(parseInt(deviceId));

                // Si pas trouvé, essayer par ThingsBoard ID
                if (!device) {
                    device = await Device.findByThingsboardId(deviceId);
                }

                if (!device) {
                    throw new Error('Device not found');
                }

                // Générer la télémétrie
                const telemetry = await virtualDeviceService.generateTelemetry(device.id);

                return telemetry;
            } catch (error) {
                console.error('Erreur génération télémétrie virtuelle:', error);
                // Fallback sur données simulées basiques
                return this.getSimulatedTelemetry();
            }
        } else {
            // Mode réel : appeler l'API ThingsBoard
            // const response = await axios.get(`${this.baseUrl}/plugins/telemetry/DEVICE/${deviceId}/values/timeseries`);
            // return response.data;
            throw new Error('Mode réel non implémenté - axios requis');
        }
    }

    /**
     * Données simulées basiques (fallback)
     */
    getSimulatedTelemetry() {
        return {
            ts: Date.now(),
            temperature: {
                ts: Date.now(),
                value: (25 + Math.random() * 2).toFixed(1)
            },
            ph: {
                ts: Date.now(),
                value: (7.2 + Math.random() * 0.4 - 0.2).toFixed(2)
            },
            turbidity: {
                ts: Date.now(),
                value: (10 + Math.random() * 5).toFixed(0)
            },
            battery: {
                ts: Date.now(),
                value: (85 + Math.random() * 10).toFixed(0)
            }
        };
    }

    /**
     * Récupérer les alarmes actives
     */
    async getAlarms(deviceId = null) {
        try {
            const alarms = await Device.getActiveAlarms(deviceId);

            // Formater pour correspondre au format ThingsBoard
            return alarms.map(alarm => ({
                id: alarm.id,
                createdTime: new Date(alarm.created_at).getTime(),
                type: alarm.alarm_type,
                severity: alarm.severity.toUpperCase(),
                status: alarm.status.toUpperCase(),
                details: {
                    message: alarm.message,
                    metric_value: alarm.metric_value,
                    threshold_value: alarm.threshold_value,
                    device_name: alarm.device_name,
                    boat_name: alarm.boat_name
                }
            }));
        } catch (error) {
            console.error('Erreur récupération alarmes:', error);
            return [];
        }
    }

    /**
     * Récupérer un résumé global pour le dashboard
     */
    async getDashboardSummary() {
        try {
            const stats = await Device.getStats();
            const alarms = await this.getAlarms();

            // Calculer les moyennes des métriques
            const devices = await Device.findAll();
            let totalPH = 0, totalTemp = 0, countPH = 0, countTemp = 0;

            for (const device of devices) {
                if (device.status === 'online') {
                    const telemetry = await this.getDeviceTelemetry(device.id);

                    if (telemetry.ph !== undefined) {
                        totalPH += parseFloat(telemetry.ph);
                        countPH++;
                    }
                    if (telemetry.temperature !== undefined) {
                        totalTemp += parseFloat(telemetry.temperature);
                        countTemp++;
                    }
                }
            }

            return {
                total_devices: parseInt(stats.total) || 0,
                online_devices: parseInt(stats.online) || 0,
                offline_devices: parseInt(stats.offline) || 0,
                total_alerts: alarms.length,
                critical_alerts: alarms.filter(a => a.severity === 'CRITICAL').length,
                average_ph: countPH > 0 ? (totalPH / countPH).toFixed(2) : 7.2,
                average_temp: countTemp > 0 ? (totalTemp / countTemp).toFixed(1) : 26.0,
                average_battery: parseFloat(stats.avg_battery || 90).toFixed(0),
                system_status: alarms.some(a => a.severity === 'CRITICAL') ? 'CRITICAL' :
                    alarms.length > 0 ? 'WARNING' : 'NORMAL'
            };
        } catch (error) {
            console.error('Erreur dashboard summary:', error);
            return {
                total_devices: 0,
                online_devices: 0,
                total_alerts: 0,
                average_ph: 7.2,
                average_temp: 26.0,
                system_status: 'UNKNOWN'
            };
        }
    }

    /**
     * Récupérer les tokens d'accès des devices
     */
    async getDeviceAccessToken(deviceId) {
        const device = await Device.findById(deviceId);
        return device?.thingsboard_token || 'VIRTUAL_TOKEN';
    }

    /**
     * Acquitter une alarme
     */
    async acknowledgeAlarm(alarmId, userId) {
        return await Device.acknowledgeAlarm(alarmId, userId);
    }

    /**
     * Effacer une alarme
     */
    async clearAlarm(alarmId) {
        return await Device.clearAlarm(alarmId);
    }

    /**
     * Récupérer l'historique de télémétrie
     */
    async getTelemetryHistory(deviceId, metricName, limit = 100) {
        return await Device.getTelemetryHistory(deviceId, metricName, limit);
    }
}

module.exports = new ThingsboardService();

