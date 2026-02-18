const Device = require('../models/Device');

/**
 * Service de génération de données IoT réalistes
 * Simule le comportement de vrais capteurs avec variations naturelles
 */
class VirtualDeviceService {
    constructor() {
        // État interne pour générer des données cohérentes
        this.deviceStates = new Map();
        this.startTime = Date.now();
    }

    /**
     * Initialiser l'état d'un device
     */
    initDeviceState(deviceId, deviceType) {
        if (!this.deviceStates.has(deviceId)) {
            this.deviceStates.set(deviceId, {
                lastUpdate: Date.now(),
                battery: 95 + Math.random() * 5, // 95-100%
                signal: -50 - Math.random() * 20, // -50 à -70 dBm
                // Valeurs de base pour chaque type de capteur
                baseValues: this.getBaseValues(deviceType),
                // Tendances (dérive lente)
                trends: {
                    ph: (Math.random() - 0.5) * 0.001, // Dérive de ±0.001 par mesure
                    temp: (Math.random() - 0.5) * 0.01,
                    turbidity: (Math.random() - 0.5) * 0.05
                }
            });
        }
        return this.deviceStates.get(deviceId);
    }

    /**
     * Obtenir les valeurs de base selon le type de device
     */
    getBaseValues(deviceType) {
        const bases = {
            sensor_ph: { value: 7.2, min: 6.5, max: 8.5 },
            sensor_temp: { value: 26, min: 15, max: 35 },
            sensor_turbidity: { value: 12, min: 0, max: 30 },
            gps: { lat: 9.5092, lng: -13.7122 }, // Conakry, Guinée
            gateway: { uptime: 0 }
        };
        return bases[deviceType] || {};
    }

    /**
     * Générer une valeur de pH réaliste
     */
    generatePH(state) {
        const base = state.baseValues.value;
        const trend = state.trends.ph;

        // Variation naturelle + tendance + cycle journalier
        const hourOfDay = new Date().getHours();
        const dailyCycle = Math.sin((hourOfDay / 24) * 2 * Math.PI) * 0.1;

        let value = base + trend + dailyCycle + (Math.random() - 0.5) * 0.2;

        // Mise à jour de la tendance
        state.trends.ph += (Math.random() - 0.5) * 0.0005;
        state.baseValues.value = value;

        // Limiter dans les bornes réalistes
        value = Math.max(6.0, Math.min(9.0, value));

        return parseFloat(value.toFixed(2));
    }

    /**
     * Générer une température réaliste
     */
    generateTemperature(state) {
        const base = state.baseValues.value;
        const trend = state.trends.temp;

        // Cycle journalier (plus chaud l'après-midi)
        const hourOfDay = new Date().getHours();
        const dailyCycle = Math.sin(((hourOfDay - 6) / 24) * 2 * Math.PI) * 3;

        let value = base + trend + dailyCycle + (Math.random() - 0.5) * 0.5;

        // Mise à jour de la tendance
        state.trends.temp += (Math.random() - 0.5) * 0.01;
        state.baseValues.value = value;

        // Limiter dans les bornes réalistes
        value = Math.max(18, Math.min(32, value));

        return parseFloat(value.toFixed(1));
    }

    /**
     * Générer une turbidité réaliste
     */
    generateTurbidity(state) {
        const base = state.baseValues.value;
        const trend = state.trends.turbidity;

        // Pics aléatoires (simule passage de poissons, algues, etc.)
        const spike = Math.random() > 0.9 ? Math.random() * 5 : 0;

        let value = base + trend + spike + (Math.random() - 0.5) * 1;

        // Mise à jour de la tendance
        state.trends.turbidity += (Math.random() - 0.5) * 0.02;
        state.baseValues.value = Math.max(8, Math.min(15, value - spike));

        // Limiter dans les bornes réalistes
        value = Math.max(0, Math.min(50, value));

        return parseFloat(value.toFixed(1));
    }

    /**
     * Générer une position GPS réaliste (mouvement lent)
     */
    generateGPS(state) {
        const base = state.baseValues;

        // Déplacement lent (bateau à l'ancre ou en dérive)
        const drift = 0.0001; // ~11 mètres
        base.lat += (Math.random() - 0.5) * drift;
        base.lng += (Math.random() - 0.5) * drift;

        return {
            latitude: parseFloat(base.lat.toFixed(6)),
            longitude: parseFloat(base.lng.toFixed(6)),
            accuracy: 5 + Math.random() * 5, // 5-10 mètres
            speed: Math.random() * 2, // 0-2 km/h (dérive)
            heading: Math.random() * 360
        };
    }

    /**
     * Mettre à jour la batterie (décroît lentement)
     */
    updateBattery(state) {
        // Décroissance de ~0.1% par heure
        const hoursSinceStart = (Date.now() - this.startTime) / (1000 * 60 * 60);
        state.battery = Math.max(20, 100 - hoursSinceStart * 0.1);

        // Variation aléatoire mineure
        return Math.floor(state.battery + (Math.random() - 0.5) * 2);
    }

    /**
     * Mettre à jour le signal (varie légèrement)
     */
    updateSignal(state) {
        state.signal += (Math.random() - 0.5) * 5;
        state.signal = Math.max(-100, Math.min(-40, state.signal));
        return Math.floor(state.signal);
    }

    /**
     * Générer la télémétrie complète pour un device
     */
    async generateTelemetry(deviceId) {
        const device = await Device.findById(deviceId);
        if (!device) throw new Error('Device not found');

        const state = this.initDeviceState(deviceId, device.device_type);
        const timestamp = Date.now();

        let telemetry = {
            ts: timestamp,
            battery: this.updateBattery(state),
            signal: this.updateSignal(state)
        };

        // Ajouter les données spécifiques au type de capteur
        switch (device.device_type) {
            case 'sensor_ph':
                telemetry.ph = this.generatePH(state);
                break;

            case 'sensor_temp':
                telemetry.temperature = this.generateTemperature(state);
                break;

            case 'sensor_turbidity':
                telemetry.turbidity = this.generateTurbidity(state);
                break;

            case 'gps':
                telemetry.gps = this.generateGPS(state);
                break;

            case 'gateway':
                telemetry.uptime = Math.floor((Date.now() - this.startTime) / 1000);
                telemetry.devices_connected = 3 + Math.floor(Math.random() * 3);
                break;
        }

        // Mettre à jour les métriques du device en base
        await Device.updateMetrics(deviceId, telemetry.battery, telemetry.signal);

        // Sauvegarder la télémétrie en base
        await this.saveTelemetryToDatabase(deviceId, telemetry, device.device_type);

        // Vérifier les seuils et créer des alarmes si nécessaire
        await this.checkThresholds(device, telemetry);

        // [NOUVEAU] Envoyer à ThingsBoard si un token existe
        if (device.thingsboard_token) {
            // Éviter la dépendance circulaire en important dynamiquement ou en passant le service
            // Ici on va faire un require lazy pour éviter le problème
            const thingsboardService = require('./thingsboardService');
            await thingsboardService.pushTelemetry(deviceId, device.thingsboard_token, telemetry);
        }

        return telemetry;
    }

    /**
     * Sauvegarder la télémétrie en base de données
     */
    async saveTelemetryToDatabase(deviceId, telemetry, deviceType) {
        const metrics = {
            sensor_ph: [{ name: 'ph', value: telemetry.ph, unit: 'pH' }],
            sensor_temp: [{ name: 'temperature', value: telemetry.temperature, unit: '°C' }],
            sensor_turbidity: [{ name: 'turbidity', value: telemetry.turbidity, unit: 'NTU' }],
            gps: [
                { name: 'latitude', value: telemetry.gps?.latitude, unit: '°' },
                { name: 'longitude', value: telemetry.gps?.longitude, unit: '°' }
            ],
            gateway: [{ name: 'uptime', value: telemetry.uptime, unit: 's' }]
        };

        const deviceMetrics = metrics[deviceType] || [];

        for (const metric of deviceMetrics) {
            if (metric.value !== undefined) {
                await Device.saveTelemetry(deviceId, metric.name, metric.value, metric.unit);
            }
        }

        // Toujours sauvegarder batterie et signal
        await Device.saveTelemetry(deviceId, 'battery', telemetry.battery, '%');
        await Device.saveTelemetry(deviceId, 'signal', telemetry.signal, 'dBm');
    }

    /**
     * Vérifier les seuils et créer des alarmes
     */
    async checkThresholds(device, telemetry) {
        const config = device.config || {};

        // Vérifier pH
        if (telemetry.ph !== undefined) {
            const minPH = config.min_threshold || 6.5;
            const maxPH = config.max_threshold || 8.5;

            if (telemetry.ph < minPH) {
                await this.createAlarmIfNotExists(device.id, 'ph_low', 'critical',
                    `pH trop bas: ${telemetry.ph}`, telemetry.ph, minPH);
            } else if (telemetry.ph > maxPH) {
                await this.createAlarmIfNotExists(device.id, 'ph_high', 'critical',
                    `pH trop élevé: ${telemetry.ph}`, telemetry.ph, maxPH);
            }
        }

        // Vérifier température
        if (telemetry.temperature !== undefined) {
            const maxTemp = config.max_threshold || 35;

            if (telemetry.temperature > maxTemp) {
                await this.createAlarmIfNotExists(device.id, 'temp_high', 'warning',
                    `Température élevée: ${telemetry.temperature}°C`, telemetry.temperature, maxTemp);
            }
        }

        // Vérifier batterie
        if (telemetry.battery < 20) {
            await this.createAlarmIfNotExists(device.id, 'battery_low', 'warning',
                `Batterie faible: ${telemetry.battery}%`, telemetry.battery, 20);
        }

        // Vérifier signal
        if (telemetry.signal < -90) {
            await this.createAlarmIfNotExists(device.id, 'signal_weak', 'info',
                `Signal faible: ${telemetry.signal} dBm`, telemetry.signal, -90);
        }
    }

    /**
     * Créer une alarme si elle n'existe pas déjà
     */
    async createAlarmIfNotExists(deviceId, alarmType, severity, message, metricValue, thresholdValue) {
        const activeAlarms = await Device.getActiveAlarms(deviceId);
        const exists = activeAlarms.some(a => a.alarm_type === alarmType);

        if (!exists) {
            await Device.createAlarm({
                device_id: deviceId,
                alarm_type: alarmType,
                severity,
                message,
                metric_value: metricValue,
                threshold_value: thresholdValue
            });
        }
    }

    /**
     * Générer la télémétrie pour tous les devices actifs
     */
    async generateAllTelemetry() {
        const devices = await Device.findAll();
        const results = [];

        for (const device of devices) {
            if (device.status === 'online') {
                try {
                    const telemetry = await this.generateTelemetry(device.id);
                    results.push({ deviceId: device.id, telemetry });
                } catch (error) {
                    console.error(`Erreur génération télémétrie device ${device.id}:`, error);
                }
            }
        }

        return results;
    }
}

module.exports = new VirtualDeviceService();
