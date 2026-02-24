const pool = require('../config/database');

/**
 * Modèle Device - Gestion des dispositifs IoT virtuels
 */
class Device {
  /**
   * Créer la table devices si elle n'existe pas
   */
  static async createTable() {
    const query = `
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
      )
    `;
    await pool.query(query);
  }

  /**
   * Créer un nouveau device
   */
  static async create(deviceData) {
    const {
      boat_id,
      device_name,
      device_type,
      thingsboard_device_id,
      thingsboard_token,
      config = {}
    } = deviceData;

    const query = `
      INSERT INTO devices (boat_id, device_name, device_type, thingsboard_device_id, thingsboard_token, config)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const result = await pool.query(query, [
      boat_id,
      device_name,
      device_type,
      thingsboard_device_id,
      thingsboard_token,
      JSON.stringify(config)
    ]);

    return result.rows[0];
  }

  /**
   * Récupérer tous les devices
   */
  static async findAll() {
    const query = `
      SELECT 
        d.*,
        b.name AS boat_name,
        b.owner_id AS boat_owner_id
      FROM devices d
      LEFT JOIN boats b ON d.boat_id = b.id
      WHERE d.active = true
      ORDER BY d.created_at DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  /**
   * Récupérer les devices d'un bateau
   */
  static async findByBoat(boatId) {
    const query = `
      SELECT * FROM devices
      WHERE boat_id = $1 AND active = true
      ORDER BY device_type, device_name
    `;
    const result = await pool.query(query, [boatId]);
    return result.rows;
  }

  /**
   * Récupérer un device par ID
   */
  static async findById(id) {
    const query = `
      SELECT 
        d.*,
        b.name AS boat_name,
        b.owner_id AS boat_owner_id
      FROM devices d
      LEFT JOIN boats b ON d.boat_id = b.id
      WHERE d.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  /**
   * Récupérer un device par ThingsBoard ID
   */
  static async findByThingsboardId(tbDeviceId) {
    const query = 'SELECT * FROM devices WHERE thingsboard_device_id = $1';
    const result = await pool.query(query, [tbDeviceId]);
    return result.rows[0];
  }

  /**
   * Mettre à jour le statut d'un device
   */
  static async updateStatus(id, status) {
    const query = `
      UPDATE devices
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [status, id]);
    return result.rows[0];
  }

  /**
   * Mettre à jour la batterie et le signal
   */
  static async updateMetrics(id, battery_level, signal_strength) {
    const query = `
      UPDATE devices
      SET 
        battery_level = $1,
        signal_strength = $2,
        last_telemetry = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `;
    const result = await pool.query(query, [battery_level, signal_strength, id]);
    return result.rows[0];
  }

  /**
   * Mettre à jour la configuration d'un device
   */
  static async updateConfig(id, config) {
    const query = `
      UPDATE devices
      SET config = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [JSON.stringify(config), id]);
    return result.rows[0];
  }

  /**
   * Mettre à jour un device (générique)
   */
  static async update(id, data) {
    const fields = [];
    const values = [];
    let counter = 1;

    const allowedFields = ['boat_id', 'device_name', 'device_type', 'thingsboard_device_id', 'thingsboard_token', 'status', 'battery_level', 'signal_strength', 'active'];

    for (const key of allowedFields) {
      if (data[key] !== undefined) {
        fields.push(`${key} = $${counter++}`);
        values.push(data[key]);
      }
    }

    if (fields.length === 0) return null;

    values.push(id);
    const query = `
      UPDATE devices
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${counter}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Supprimer un device (soft delete)
   */
  static async delete(id) {
    const query = `
      UPDATE devices
      SET active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rowCount > 0;
  }

  /**
   * Obtenir les statistiques des devices
   */
  static async getStats() {
    const query = `
      SELECT 
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'online') AS online,
        COUNT(*) FILTER (WHERE status = 'offline') AS offline,
        COUNT(*) FILTER (WHERE status = 'error') AS error,
        COUNT(*) FILTER (WHERE device_type = 'sensor_ph') AS sensors_ph,
        COUNT(*) FILTER (WHERE device_type = 'sensor_temp') AS sensors_temp,
        COUNT(*) FILTER (WHERE device_type = 'sensor_turbidity') AS sensors_turbidity,
        COUNT(*) FILTER (WHERE device_type = 'gps') AS gps_devices,
        AVG(battery_level) AS avg_battery
      FROM devices
      WHERE active = true
    `;
    const result = await pool.query(query);
    return result.rows[0];
  }

  /**
   * Enregistrer une mesure de télémétrie
   */
  static async saveTelemetry(deviceId, metricName, metricValue, unit = null) {
    const query = `
      INSERT INTO device_telemetry (device_id, metric_name, metric_value, unit)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const result = await pool.query(query, [deviceId, metricName, metricValue, unit]);
    return result.rows[0];
  }

  /**
   * Récupérer l'historique de télémétrie
   */
  static async getTelemetryHistory(deviceId, metricName, limit = 100) {
    const query = `
      SELECT * FROM device_telemetry
      WHERE device_id = $1 AND metric_name = $2
      ORDER BY timestamp DESC
      LIMIT $3
    `;
    const result = await pool.query(query, [deviceId, metricName, limit]);
    return result.rows;
  }

  /**
   * Créer une alarme
   */
  static async createAlarm(alarmData) {
    const {
      device_id,
      alarm_type,
      severity,
      message,
      metric_value,
      threshold_value
    } = alarmData;

    const query = `
      INSERT INTO device_alarms (device_id, alarm_type, severity, message, metric_value, threshold_value)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const result = await pool.query(query, [
      device_id,
      alarm_type,
      severity,
      message,
      metric_value,
      threshold_value
    ]);

    return result.rows[0];
  }

  /**
   * Récupérer les alarmes actives
   */
  static async getActiveAlarms(deviceId = null) {
    let query = `
      SELECT 
        a.*,
        d.device_name,
        d.device_type,
        b.name AS boat_name
      FROM device_alarms a
      JOIN devices d ON a.device_id = d.id
      LEFT JOIN boats b ON d.boat_id = b.id
      WHERE a.status = 'active'
    `;

    const params = [];
    if (deviceId) {
      query += ' AND a.device_id = $1';
      params.push(deviceId);
    }

    query += ' ORDER BY a.created_at DESC';

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Acquitter une alarme
   */
  static async acknowledgeAlarm(alarmId, userId) {
    const query = `
      UPDATE device_alarms
      SET 
        status = 'acknowledged',
        acknowledged_at = CURRENT_TIMESTAMP,
        acknowledged_by = $1
      WHERE id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [userId, alarmId]);
    return result.rows[0];
  }

  /**
   * Effacer une alarme
   */
  static async clearAlarm(alarmId) {
    const query = `
      UPDATE device_alarms
      SET 
        status = 'cleared',
        cleared_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const result = await pool.query(query, [alarmId]);
    return result.rows[0];
  }
}

module.exports = Device;
