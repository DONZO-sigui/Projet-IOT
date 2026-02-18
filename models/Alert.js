/**
 * Modèle Alert
 * Gère les alertes de dérive et violations de zones
 * 
 * @requires pg
 */
const pool = require('../config/database');

class Alert {
    /**
     * Créer la table alerts si elle n'existe pas
     */
    static async createTable() {
        const sql = `
      CREATE TABLE IF NOT EXISTS alerts (
        id SERIAL PRIMARY KEY,
        boat_id INTEGER NOT NULL,
        zone_id INTEGER,
        type VARCHAR(50) NOT NULL DEFAULT 'zone_violation',
        severity VARCHAR(20) NOT NULL DEFAULT 'warning',
        message TEXT NOT NULL,
        latitude REAL,
        longitude REAL,
        acknowledged BOOLEAN DEFAULT FALSE,
        acknowledged_by INTEGER,
        acknowledged_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (boat_id) REFERENCES boats(id) ON DELETE CASCADE,
        FOREIGN KEY (zone_id) REFERENCES zones(id) ON DELETE SET NULL,
        FOREIGN KEY (acknowledged_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `;

        try {
            await pool.query(sql);
            console.log('✅ Table alerts créée ou déjà existante');

            // Créer un index pour améliorer les performances
            const indexSql = `
        CREATE INDEX IF NOT EXISTS idx_alerts_boat_created 
        ON alerts(boat_id, created_at DESC)
      `;
            await pool.query(indexSql);

            const indexAckSql = `
        CREATE INDEX IF NOT EXISTS idx_alerts_acknowledged 
        ON alerts(acknowledged, created_at DESC)
      `;
            await pool.query(indexAckSql);
        } catch (err) {
            console.error('❌ Erreur création table alerts:', err.message);
        }
    }

    /**
     * Créer une nouvelle alerte
     * @param {number} boatId - ID du bateau
     * @param {number} zoneId - ID de la zone (nullable)
     * @param {string} type - Type d'alerte
     * @param {string} severity - Niveau de sévérité (info, warning, critical)
     * @param {string} message - Message descriptif
     * @param {number} latitude - Latitude (optionnel)
     * @param {number} longitude - Longitude (optionnel)
     * @returns {Promise<Object>} L'alerte créée
     */
    static async create(boatId, zoneId, type, severity, message, latitude = null, longitude = null) {
        const sql = `
      INSERT INTO alerts (boat_id, zone_id, type, severity, message, latitude, longitude)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

        try {
            const result = await pool.query(sql, [boatId, zoneId, type, severity, message, latitude, longitude]);
            return result.rows[0];
        } catch (err) {
            throw err;
        }
    }

    /**
     * Récupérer toutes les alertes avec informations bateau et zone
     * @param {Object} filters - Filtres optionnels
     * @returns {Promise<Array>} Liste des alertes
     */
    static async findAll(filters = {}) {
        let sql = `
      SELECT 
        a.*,
        b.name as boat_name,
        b.registration_number,
        z.name as zone_name,
        z.type as zone_type,
        u.username as acknowledged_by_name
      FROM alerts a
      LEFT JOIN boats b ON a.boat_id = b.id
      LEFT JOIN zones z ON a.zone_id = z.id
      LEFT JOIN users u ON a.acknowledged_by = u.id
      WHERE 1=1
    `;

        const values = [];
        let counter = 1;

        // Filtrer par bateau
        if (filters.boatId) {
            sql += ` AND a.boat_id = $${counter++}`;
            values.push(filters.boatId);
        }

        // Filtrer par statut acquitté
        if (filters.acknowledged !== undefined) {
            sql += ` AND a.acknowledged = $${counter++}`;
            values.push(filters.acknowledged);
        }

        // Filtrer par sévérité
        if (filters.severity) {
            sql += ` AND a.severity = $${counter++}`;
            values.push(filters.severity);
        }

        // Filtrer par type
        if (filters.type) {
            sql += ` AND a.type = $${counter++}`;
            values.push(filters.type);
        }

        sql += ` ORDER BY a.created_at DESC`;

        // Limiter le nombre de résultats
        if (filters.limit) {
            sql += ` LIMIT $${counter++}`;
            values.push(filters.limit);
        }

        try {
            const result = await pool.query(sql, values);
            return result.rows;
        } catch (err) {
            throw err;
        }
    }

    /**
     * Récupérer les alertes actives (non acquittées)
     * @param {number} limit - Nombre max d'alertes
     * @returns {Promise<Array>} Liste des alertes actives
     */
    static async findActive(limit = 50) {
        return this.findAll({ acknowledged: false, limit });
    }

    /**
     * Récupérer une alerte par ID
     * @param {number} id - ID de l'alerte
     * @returns {Promise<Object>} L'alerte trouvée
     */
    static async findById(id) {
        const sql = `
      SELECT 
        a.*,
        b.name as boat_name,
        b.registration_number,
        z.name as zone_name,
        z.type as zone_type,
        u.username as acknowledged_by_name
      FROM alerts a
      LEFT JOIN boats b ON a.boat_id = b.id
      LEFT JOIN zones z ON a.zone_id = z.id
      LEFT JOIN users u ON a.acknowledged_by = u.id
      WHERE a.id = $1
    `;

        try {
            const result = await pool.query(sql, [id]);
            return result.rows[0];
        } catch (err) {
            throw err;
        }
    }

    /**
     * Marquer une alerte comme acquittée
     * @param {number} id - ID de l'alerte
     * @param {number} userId - ID de l'utilisateur qui acquitte
     * @returns {Promise<Object>} Résultat
     */
    static async acknowledge(id, userId) {
        const sql = `
      UPDATE alerts 
      SET acknowledged = TRUE, 
          acknowledged_by = $1, 
          acknowledged_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;

        try {
            const result = await pool.query(sql, [userId, id]);
            return result.rows[0];
        } catch (err) {
            throw err;
        }
    }

    /**
     * Supprimer une alerte
     * @param {number} id - ID de l'alerte
     * @returns {Promise<Object>} Résultat
     */
    static async delete(id) {
        const sql = `DELETE FROM alerts WHERE id = $1`;

        try {
            const result = await pool.query(sql, [id]);
            return { deleted: result.rowCount };
        } catch (err) {
            throw err;
        }
    }

    /**
     * Compter les alertes par statut
     * @returns {Promise<Object>} Statistiques
     */
    static async getStats() {
        const sql = `
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE acknowledged = FALSE) as active,
        COUNT(*) FILTER (WHERE acknowledged = TRUE) as resolved,
        COUNT(*) FILTER (WHERE severity = 'critical' AND acknowledged = FALSE) as critical,
        COUNT(*) FILTER (WHERE severity = 'warning') as warning,
        COUNT(*) FILTER (WHERE severity = 'info') as info
      FROM alerts
    `;

        try {
            const result = await pool.query(sql);
            return result.rows[0];
        } catch (err) {
            throw err;
        }
    }

    /**
     * Compter les alertes par statut pour un propriétaire spécifique
     * @param {number} ownerId - ID du propriétaire
     * @returns {Promise<Object>} Statistiques
     */
    static async getStatsByOwner(ownerId) {
        const sql = `
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE a.acknowledged = FALSE) as active,
        COUNT(*) FILTER (WHERE a.acknowledged = TRUE) as resolved,
        COUNT(*) FILTER (WHERE a.severity = 'critical' AND a.acknowledged = FALSE) as critical,
        COUNT(*) FILTER (WHERE a.severity = 'warning') as warning,
        COUNT(*) FILTER (WHERE a.severity = 'info') as info
      FROM alerts a
      JOIN boats b ON a.boat_id = b.id
      WHERE b.owner_id = $1
    `;

        try {
            const result = await pool.query(sql, [ownerId]);
            return result.rows[0];
        } catch (err) {
            throw err;
        }
    }

    /**
     * Supprimer les anciennes alertes acquittées
     * @param {number} days - Âge max en jours
     * @returns {Promise<Object>} Résultat
     */
    static async deleteOldAcknowledged(days = 30) {
        const sql = `
      DELETE FROM alerts
      WHERE acknowledged = TRUE 
      AND acknowledged_at < NOW() - INTERVAL '${days} days'
    `;

        try {
            const result = await pool.query(sql);
            return { deleted: result.rowCount };
        } catch (err) {
            throw err;
        }
    }
}

module.exports = Alert;
