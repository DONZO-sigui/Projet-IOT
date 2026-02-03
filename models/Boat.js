/**
 * Modèle Boat
 * Gère les données des bateaux de pêche
 * 
 * @requires pg
 */
const pool = require('../config/database');

class Boat {
    /**
     * Créer la table boats si elle n'existe pas
     * Utilise SERIAL pour l'ID auto-incrémenté (PostgreSQL)
     */
    static async createTable() {
        const sql = `
      CREATE TABLE IF NOT EXISTS boats (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        registration_number VARCHAR(50) UNIQUE,
        owner_id INTEGER,
        device_id VARCHAR(100),
        status VARCHAR(20) DEFAULT 'active',
        max_distance_from_port INTEGER DEFAULT 50000,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `;

        try {
            await pool.query(sql);
            console.log('✅ Table boats créée ou déjà existante');
        } catch (err) {
            console.error('❌ Erreur création table boats:', err.message);
        }
    }

    /**
     * Créer un nouveau bateau
     * @param {string} name - Nom du bateau
     * @param {string} registrationNumber - Numéro d'immatriculation
     * @param {number} ownerId - ID du propriétaire (User)
     * @param {string} deviceId - ID du dispositif IoT (ESP32)
     * @returns {Promise<Object>} Le bateau créé
     */
    static async create(name, registrationNumber, ownerId, deviceId) {
        const sql = `
      INSERT INTO boats (name, registration_number, owner_id, device_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

        try {
            const result = await pool.query(sql, [name, registrationNumber, ownerId, deviceId]);
            return result.rows[0];
        } catch (err) {
            throw err;
        }
    }

    /**
     * Trouver un bateau par ID avec les infos du propriétaire
     * @param {number} id - ID du bateau
     * @returns {Promise<Object>} Le bateau trouvé
     */
    static async findById(id) {
        const sql = `
      SELECT b.*, u.username as owner_name, u.email as owner_email
      FROM boats b
      LEFT JOIN users u ON b.owner_id = u.id
      WHERE b.id = $1
    `;

        try {
            const result = await pool.query(sql, [id]);
            return result.rows[0];
        } catch (err) {
            throw err;
        }
    }

    /**
     * Récupérer tous les bateaux triés par date de création
     * @returns {Promise<Array>} Liste des bateaux
     */
    static async findAll() {
        const sql = `
      SELECT b.*, u.username as owner_name
      FROM boats b
      LEFT JOIN users u ON b.owner_id = u.id
      ORDER BY b.created_at DESC
    `;

        try {
            const result = await pool.query(sql);
            return result.rows;
        } catch (err) {
            throw err;
        }
    }

    /**
     * Trouver les bateaux d'un propriétaire
     * @param {number} ownerId - ID du propriétaire
     * @returns {Promise<Array>} Liste des bateaux
     */
    static async findByOwner(ownerId) {
        const sql = `SELECT * FROM boats WHERE owner_id = $1`;

        try {
            const result = await pool.query(sql, [ownerId]);
            return result.rows;
        } catch (err) {
            throw err;
        }
    }

    /**
     * Mettre à jour le statut d'un bateau
     * @param {number} id - ID du bateau
     * @param {string} status - Nouveau statut ('active', 'inactive', 'maintenance')
     * @returns {Promise<Object>} Résultat de la requête
     */
    static async updateStatus(id, status) {
        const sql = `
      UPDATE boats 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `;

        try {
            const result = await pool.query(sql, [status, id]);
            return { changes: result.rowCount };
        } catch (err) {
            throw err;
        }
    }

    /**
     * Mettre à jour les informations d'un bateau
     * @param {number} id - ID du bateau
     * @param {Object} data - Données à mettre à jour
     * @returns {Promise<Object>} Résultat
     */
    static async update(id, data) {
        const fields = [];
        const values = [];
        let counter = 1;

        if (data.name) {
            fields.push(`name = $${counter++}`);
            values.push(data.name);
        }
        if (data.registration_number) {
            fields.push(`registration_number = $${counter++}`);
            values.push(data.registration_number);
        }
        if (data.owner_id !== undefined) {
            fields.push(`owner_id = $${counter++}`);
            values.push(data.owner_id);
        }
        if (data.device_id) {
            fields.push(`device_id = $${counter++}`);
            values.push(data.device_id);
        }
        if (data.status) {
            fields.push(`status = $${counter++}`);
            values.push(data.status);
        }
        if (data.max_distance_from_port) {
            fields.push(`max_distance_from_port = $${counter++}`);
            values.push(data.max_distance_from_port);
        }

        fields.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(id);

        const sql = `UPDATE boats SET ${fields.join(', ')} WHERE id = $${counter}`;

        try {
            const result = await pool.query(sql, values);
            return { changes: result.rowCount };
        } catch (err) {
            throw err;
        }
    }

    /**
     * Supprimer un bateau
     * @param {number} id - ID du bateau
     * @returns {Promise<Object>} Résultat
     */
    static async delete(id) {
        const sql = `DELETE FROM boats WHERE id = $1`;

        try {
            const result = await pool.query(sql, [id]);
            return { changes: result.rowCount };
        } catch (err) {
            throw err;
        }
    }

    /**
     * Compter le nombre de bateaux actifs
     * @returns {Promise<number>} Nombre de bateaux actifs
     */
    static async countActive() {
        const sql = `SELECT COUNT(*) as count FROM boats WHERE status = 'active'`;

        try {
            const result = await pool.query(sql);
            return parseInt(result.rows[0].count);
        } catch (err) {
            throw err;
        }
    }
}

module.exports = Boat;
