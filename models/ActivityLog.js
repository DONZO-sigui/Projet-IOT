/**
 * Modèle ActivityLog
 * Enregistre les actions des utilisateurs et événements système
 * 
 * @requires pg
 */
const pool = require('../config/database');

class ActivityLog {
    /**
     * Créer la table activity_logs si elle n'existe pas
     */
    static async createTable() {
        const sql = `
      CREATE TABLE IF NOT EXISTS activity_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(50),
        entity_id INTEGER,
        details TEXT,
        ip_address VARCHAR(45),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `;

        try {
            await pool.query(sql);
            console.log('✅ Table activity_logs créée ou déjà existante');
        } catch (err) {
            console.error('❌ Erreur création table activity_logs:', err.message);
        }
    }

    /**
     * Créer une entrée de log
     * @param {number} userId - ID de l'utilisateur (peut être null pour système)
     * @param {string} action - Action effectuée (ex: 'LOGIN', 'CREATE_BOAT', 'UPDATE_RATE')
     * @param {string} entityType - Type d'entité concernée (ex: 'user', 'boat', 'alert')
     * @param {number} entityId - ID de l'entité
     * @param {string} details - Détails supplémentaires (JSON stringifié ou texte)
     * @param {string} ipAddress - Adresse IP de l'utilisateur
     */
    static async log(userId, action, entityType = null, entityId = null, details = null, ipAddress = null) {
        const sql = `
      INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, ip_address)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

        try {
            const result = await pool.query(sql, [userId, action, entityType, entityId, details, ipAddress]);
            return result.rows[0];
        } catch (err) {
            console.error('Erreur logging:', err.message);
            // On ne throw pas l'erreur pour ne pas bloquer l'action principale si le log échoue
            return null;
        }
    }

    /**
     * Récupérer les derniers logs
     * @param {number} limit - Nombre de logs max
     * @returns {Promise<Array>} Liste des logs avec infos utilisateur
     */
    static async getRecent(limit = 100, userId = null) {
        let sql = `
      SELECT l.*, u.username, u.email, u.role
      FROM activity_logs l
      LEFT JOIN users u ON l.user_id = u.id
    `;
        const params = [limit];

        if (userId) {
            sql += ` WHERE l.user_id = $2`;
            params.push(userId);
        }

        sql += ` ORDER BY l.created_at DESC LIMIT $1`;

        try {
            const result = await pool.query(sql, params);
            return result.rows;
        } catch (err) {
            throw err;
        }
    }

    /**
     * Récupérer les logs par type d'entité
     */
    static async getByEntity(entityType, entityId, limit = 50) {
        const sql = `
      SELECT l.*, u.username
      FROM activity_logs l
      LEFT JOIN users u ON l.user_id = u.id
      WHERE l.entity_type = $1 AND l.entity_id = $2
      ORDER BY l.created_at DESC
      LIMIT $3
    `;
        try {
            const result = await pool.query(sql, [entityType, entityId, limit]);
            return result.rows;
        } catch (err) {
            throw err;
        }
    }
}

module.exports = ActivityLog;
