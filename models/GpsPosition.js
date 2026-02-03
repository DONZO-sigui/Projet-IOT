/**
 * Modèle GpsPosition
 * Gère l'historique des positions GPS des bateaux
 * 
 * @requires pg
 */
const pool = require('../config/database');

class GpsPosition {
    /**
     * Créer la table gps_positions si elle n'existe pas
     */
    static async createTable() {
        const sql = `
      CREATE TABLE IF NOT EXISTS gps_positions (
        id SERIAL PRIMARY KEY,
        boat_id INTEGER NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        speed REAL DEFAULT 0,
        heading REAL DEFAULT 0,
        altitude REAL DEFAULT 0,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (boat_id) REFERENCES boats(id) ON DELETE CASCADE
      )
    `;

        try {
            await pool.query(sql);
            console.log('✅ Table gps_positions créée ou déjà existante');

            // Créer un index pour améliorer les performances
            // Note: PostgreSQL gère les index différemment, vérifions si l'index existe avant
            const indexSql = `
        CREATE INDEX IF NOT EXISTS idx_boat_timestamp 
        ON gps_positions(boat_id, timestamp DESC)
      `;
            await pool.query(indexSql);
        } catch (err) {
            console.error('❌ Erreur création table gps_positions:', err.message);
        }
    }

    /**
     * Enregistrer une nouvelle position GPS
     * @param {number} boatId - ID du bateau
     * @param {number} latitude - Latitude
     * @param {number} longitude - Longitude
     * @param {number} speed - Vitesse en km/h
     * @param {number} heading - Cap (0-360)
     * @param {number} altitude - Altitude en mètres
     * @returns {Promise<Object>} La position créée
     */
    static async create(boatId, latitude, longitude, speed = 0, heading = 0, altitude = 0) {
        const sql = `
      INSERT INTO gps_positions (boat_id, latitude, longitude, speed, heading, altitude)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

        try {
            const result = await pool.query(sql, [boatId, latitude, longitude, speed, heading, altitude]);
            return result.rows[0];
        } catch (err) {
            throw err;
        }
    }

    /**
     * Récupérer la dernière position d'un bateau
     * @param {number} boatId - ID du bateau
     * @returns {Promise<Object>} La dernière position connue
     */
    static async getLatestByBoat(boatId) {
        const sql = `
      SELECT * FROM gps_positions
      WHERE boat_id = $1
      ORDER BY timestamp DESC
      LIMIT 1
    `;

        try {
            const result = await pool.query(sql, [boatId]);
            return result.rows[0];
        } catch (err) {
            throw err;
        }
    }

    /**
     * Récupérer la trajectoire d'un bateau sur une période
     * @param {number} boatId - ID du bateau
     * @param {Date} startTime - Début de la période
     * @param {Date} endTime - Fin de la période
     * @returns {Promise<Array>} Liste des positions
     */
    static async getTrajectory(boatId, startTime, endTime) {
        const sql = `
      SELECT * FROM gps_positions
      WHERE boat_id = $1
      AND timestamp BETWEEN $2 AND $3
      ORDER BY timestamp ASC
    `;

        try {
            const result = await pool.query(sql, [boatId, startTime, endTime]);
            return result.rows;
        } catch (err) {
            throw err;
        }
    }

    /**
     * Récupérer les dernières positions de tous les bateaux
     * Utilise DISTINCT ON (PostgreSQL specific) pour optimiser
     * @returns {Promise<Array>} Liste des positions avec infos bateau
     */
    static async getLatestForAllBoats() {
        const sql = `
      SELECT DISTINCT ON (gp.boat_id) gp.*, b.name as boat_name, b.registration_number, b.status
      FROM gps_positions gp
      INNER JOIN boats b ON gp.boat_id = b.id
      ORDER BY gp.boat_id, gp.timestamp DESC
    `;

        try {
            const result = await pool.query(sql);
            return result.rows;
        } catch (err) {
            // Fallback si DISTINCT ON pose problème (méthode générique SQL)
            const fallbackSql = `
        SELECT gp.*, b.name as boat_name, b.registration_number, b.status
        FROM gps_positions gp
        INNER JOIN boats b ON gp.boat_id = b.id
        WHERE gp.id IN (
          SELECT MAX(id)
          FROM gps_positions
          GROUP BY boat_id
        )
        ORDER BY gp.timestamp DESC
      `;
            const fallbackResult = await pool.query(fallbackSql);
            return fallbackResult.rows;
        }
    }

    /**
     * Récupérer les N dernières positions d'un bateau
     * @param {number} boatId - ID du bateau
     * @param {number} limit - Nombre max de positions
     * @returns {Promise<Array>} Liste des positions
     */
    static async getRecentPositions(boatId, limit = 50) {
        const sql = `
      SELECT * FROM gps_positions
      WHERE boat_id = $1
      ORDER BY timestamp DESC
      LIMIT $2
    `;

        try {
            const result = await pool.query(sql, [boatId, limit]);
            return result.rows;
        } catch (err) {
            throw err;
        }
    }

    /**
     * Supprimer les anciennes positions (nettoyage)
     * @param {number} days - Âge max en jours
     * @returns {Promise<Object>} Résultat
     */
    static async deleteOlderThan(days = 30) {
        const sql = `
      DELETE FROM gps_positions
      WHERE timestamp < NOW() - INTERVAL '${days} days'
    `;

        try {
            const result = await pool.query(sql);
            return { deleted: result.rowCount };
        } catch (err) {
            throw err;
        }
    }

    /**
     * Calculer la distance entre deux points GPS (formule de Haversine)
     * @param {number} lat1 
     * @param {number} lon1 
     * @param {number} lat2 
     * @param {number} lon2 
     * @returns {number} Distance en mètres
     */
    static calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371e3; // Rayon de la Terre en mètres
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // Distance en mètres
    }
}

module.exports = GpsPosition;
