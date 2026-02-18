-- Script de création de la table devices
-- Lie les devices virtuels ThingsBoard aux bateaux

-- Créer la table devices
CREATE TABLE IF NOT EXISTS devices (
    id SERIAL PRIMARY KEY,
    boat_id INTEGER REFERENCES boats(id) ON DELETE CASCADE,
    device_name VARCHAR(255) NOT NULL,
    device_type VARCHAR(50) NOT NULL CHECK (device_type IN ('sensor_ph', 'sensor_temp', 'sensor_turbidity', 'gps', 'camera', 'gateway')),
    thingsboard_device_id VARCHAR(255) UNIQUE,
    thingsboard_token VARCHAR(255),
    status VARCHAR(20) DEFAULT 'online' CHECK (status IN ('online', 'offline', 'error', 'maintenance')),
    battery_level INTEGER DEFAULT 100 CHECK (battery_level >= 0 AND battery_level <= 100),
    signal_strength INTEGER DEFAULT -60 CHECK (signal_strength >= -120 AND signal_strength <= 0),
    last_telemetry TIMESTAMP,
    config JSONB DEFAULT '{}',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_devices_boat_id ON devices(boat_id);
CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);
CREATE INDEX IF NOT EXISTS idx_devices_type ON devices(device_type);
CREATE INDEX IF NOT EXISTS idx_devices_active ON devices(active);

-- Table pour l'historique de télémétrie
CREATE TABLE IF NOT EXISTS device_telemetry (
    id SERIAL PRIMARY KEY,
    device_id INTEGER REFERENCES devices(id) ON DELETE CASCADE,
    metric_name VARCHAR(50) NOT NULL,
    metric_value DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(20),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour optimiser les requêtes d'historique
CREATE INDEX IF NOT EXISTS idx_telemetry_device_id ON device_telemetry(device_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_timestamp ON device_telemetry(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_metric ON device_telemetry(metric_name);

-- Table pour les alarmes
CREATE TABLE IF NOT EXISTS device_alarms (
    id SERIAL PRIMARY KEY,
    device_id INTEGER REFERENCES devices(id) ON DELETE CASCADE,
    alarm_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
    message TEXT NOT NULL,
    metric_value DECIMAL(10, 2),
    threshold_value DECIMAL(10, 2),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'cleared')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    acknowledged_at TIMESTAMP,
    acknowledged_by INTEGER REFERENCES users(id),
    cleared_at TIMESTAMP
);

-- Index pour les alarmes
CREATE INDEX IF NOT EXISTS idx_alarms_device_id ON device_alarms(device_id);
CREATE INDEX IF NOT EXISTS idx_alarms_status ON device_alarms(status);
CREATE INDEX IF NOT EXISTS idx_alarms_severity ON device_alarms(severity);

-- Insérer des devices virtuels de démonstration
-- Device 1: Capteur pH pour le bateau 1
INSERT INTO devices (boat_id, device_name, device_type, thingsboard_device_id, thingsboard_token, config)
VALUES (
    1,
    'Capteur pH - Bateau 1',
    'sensor_ph',
    'VIRTUAL_PH_001',
    'TOKEN_PH_001',
    '{"min_threshold": 6.5, "max_threshold": 8.5, "interval": 10}'::jsonb
) ON CONFLICT DO NOTHING;

-- Device 2: Capteur Température pour le bateau 1
INSERT INTO devices (boat_id, device_name, device_type, thingsboard_device_id, thingsboard_token, config)
VALUES (
    1,
    'Capteur Température - Bateau 1',
    'sensor_temp',
    'VIRTUAL_TEMP_001',
    'TOKEN_TEMP_001',
    '{"min_threshold": 15, "max_threshold": 35, "interval": 10}'::jsonb
) ON CONFLICT DO NOTHING;

-- Device 3: Capteur Turbidité pour le bateau 1
INSERT INTO devices (boat_id, device_name, device_type, thingsboard_device_id, thingsboard_token, config)
VALUES (
    1,
    'Capteur Turbidité - Bateau 1',
    'sensor_turbidity',
    'VIRTUAL_TURB_001',
    'TOKEN_TURB_001',
    '{"max_threshold": 20, "interval": 10}'::jsonb
) ON CONFLICT DO NOTHING;

-- Device 4: GPS Tracker pour le bateau 1
INSERT INTO devices (boat_id, device_name, device_type, thingsboard_device_id, thingsboard_token, config)
VALUES (
    1,
    'GPS Tracker - Bateau 1',
    'gps',
    'VIRTUAL_GPS_001',
    'TOKEN_GPS_001',
    '{"interval": 5, "accuracy": 10}'::jsonb
) ON CONFLICT DO NOTHING;

-- Device 5: Gateway IoT pour le bateau 1
INSERT INTO devices (boat_id, device_name, device_type, thingsboard_device_id, thingsboard_token, config)
VALUES (
    1,
    'Gateway IoT - Bateau 1',
    'gateway',
    'VIRTUAL_GATEWAY_001',
    'TOKEN_GATEWAY_001',
    '{"protocol": "mqtt", "port": 1883}'::jsonb
) ON CONFLICT DO NOTHING;

-- Vérifier les devices créés
SELECT 
    d.id,
    d.device_name,
    d.device_type,
    d.status,
    b.name AS boat_name
FROM devices d
LEFT JOIN boats b ON d.boat_id = b.id
ORDER BY d.id;
