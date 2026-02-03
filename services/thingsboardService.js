/**
 * Mock Service pour ThingsBoard
 * Simule les interactions avec l'API ThingsBoard Cloud
 */

// const axios = require('axios'); // Module pas encore installé, simulation uniquement

class ThingsboardService {
    constructor() {
        this.token = null;
        this.baseUrl = process.env.THINGSBOARD_URL || 'https://demo.thingsboard.io/api';
    }

    /**
     * Simule la récupération des données de télémétrie d'un device
     * @param {string} deviceId 
     * @returns {Promise<Object>} Données télémétriques
     */
    async getDeviceTelemetry(deviceId) {
        // Dans une vraie implémentation, on ferait un appel API :
        // const response = await axios.get(`${this.baseUrl}/plugins/telemetry/DEVICE/${deviceId}/values/timeseries`);

        // Pour l'instant, on retourne des données simulées réalistes
        return {
            temperature: {
                ts: Date.now(),
                value: (25 + Math.random() * 2).toFixed(1) // 25°C - 27°C
            },
            ph: {
                ts: Date.now(),
                value: (7.2 + Math.random() * 0.4 - 0.2).toFixed(2) // 7.0 - 7.4
            },
            turbidity: {
                ts: Date.now(),
                value: (10 + Math.random() * 5).toFixed(0) // 10 - 15 NTU
            },
            battery: {
                ts: Date.now(),
                value: (85 + Math.random() * 10).toFixed(0) // 85% - 95%
            }
        };
    }

    /**
     * Simule la récupération des alarmes
     */
    async getAlarms(status = 'ACTIVE_UNACK') {
        // Simulation d'alarmes occasionnelles
        if (Math.random() > 0.7) {
            return [
                {
                    id: 'alarm-1',
                    createdTime: Date.now() - 1000 * 60 * 15, // il y a 15 min
                    type: 'TemperatureHigh',
                    severity: 'CRITICAL',
                    status: 'ACTIVE_UNACK',
                    details: { temperature: 29.5 }
                }
            ];
        }
        return [];
    }

    /**
     * Récupère les tokens d'accès des devices (simulé)
     */
    getDeviceAccessToken(deviceName) {
        const tokens = {
            'ESP32-001': 'A1_TEST_TOKEN_001',
            'ESP32-002': 'A1_TEST_TOKEN_002',
        };
        return tokens[deviceName] || 'UNKNOWN_TOKEN';
    }
}

module.exports = new ThingsboardService();
