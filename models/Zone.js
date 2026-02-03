/**
 * Modèle Zone
 * Gère les zones de pêche (autorisées, interdites, etc.)
 * 
 * @requires pg
 */
const pool = require('../config/database');

class Zone {
    /**
     * Créer la table zones si elle n'existe pas
     */
    static async createTable() {
        const sql = `
      CREATE TABLE IF NOT EXISTS zones (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        type VARCHAR(20) DEFAULT 'fishing',
        coordinates TEXT NOT NULL,
        description TEXT,
        color VARCHAR(7) DEFAULT '#0000FF',
        created_by INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `;

        try {
            await pool.query(sql);
            console.log('✅ Table zones créée ou déjà existante');
        } catch (err) {
            console.error('❌ Erreur création table zones:', err.message);
        }
    }

    /**
     * Créer une nouvelle zone
     * @param {string} name - Nom de la zone
     * @param {string} type - Type (fishing, prohibited, protected...)
     * @param {Object|string} coordinates - Coordonnées JSON
     * @param {string} description - Description facultative
     * @param {string} color - Code couleur HEX
     * @param {number} createdBy - ID de l'utilisateur créateur
     * @returns {Promise<Object>} La zone créée
     */
    static async create(name, type, coordinates, description, color, createdBy) {
        const sql = `
      INSERT INTO zones (name, type, coordinates, description, color, created_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

        // Convertir les coordonnées en JSON si c'est un objet
        const coordsJson = typeof coordinates === 'string'
            ? coordinates
            : JSON.stringify(coordinates);

        try {
            const result = await pool.query(sql, [name, type, coordsJson, description, color, createdBy]);
            const zone = result.rows[0];
            // Parser les coordonnées pour le retour
            if (zone && zone.coordinates) {
                zone.coordinates = JSON.parse(zone.coordinates);
            }
            return zone;
        } catch (err) {
            throw err;
        }
    }

    /**
     * Récupérer toutes les zones
     * @returns {Promise<Array>} Liste des zones
     */
    static async findAll() {
        const sql = `
      SELECT z.*, u.username as created_by_name
      FROM zones z
      LEFT JOIN users u ON z.created_by = u.id
      ORDER BY z.created_at DESC
    `;

        try {
            const result = await pool.query(sql);
            return result.rows.map(zone => ({
                ...zone,
                coordinates: JSON.parse(zone.coordinates)
            }));
        } catch (err) {
            throw err;
        }
    }

    /**
     * Trouver une zone par ID
     * @param {number} id - ID de la zone
     * @returns {Promise<Object>} La zone trouvée
     */
    static async findById(id) {
        const sql = `
      SELECT z.*, u.username as created_by_name
      FROM zones z
      LEFT JOIN users u ON z.created_by = u.id
      WHERE z.id = $1
    `;

        try {
            const result = await pool.query(sql, [id]);
            const zone = result.rows[0];

            if (zone) {
                zone.coordinates = JSON.parse(zone.coordinates);
                return zone;
            }
            return null;
        } catch (err) {
            throw err;
        }
    }

    /**
     * Mettre à jour une zone
     * @param {number} id - ID de la zone
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
        if (data.type) {
            fields.push(`type = $${counter++}`);
            values.push(data.type);
        }
        if (data.coordinates) {
            fields.push(`coordinates = $${counter++}`);
            const coordsJson = typeof data.coordinates === 'string'
                ? data.coordinates
                : JSON.stringify(data.coordinates);
            values.push(coordsJson);
        }
        if (data.description !== undefined) {
            fields.push(`description = $${counter++}`);
            values.push(data.description);
        }
        if (data.color) {
            fields.push(`color = $${counter++}`);
            values.push(data.color);
        }

        fields.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(id);

        const sql = `UPDATE zones SET ${fields.join(', ')} WHERE id = $${counter}`;

        try {
            const result = await pool.query(sql, values);
            return { changes: result.rowCount };
        } catch (err) {
            throw err;
        }
    }

    /**
     * Supprimer une zone
     * @param {number} id - ID de la zone
     * @returns {Promise<Object>} Résultat
     */
    static async delete(id) {
        const sql = `DELETE FROM zones WHERE id = $1`;

        try {
            const result = await pool.query(sql, [id]);
            return { changes: result.rowCount };
        } catch (err) {
            throw err;
        }
    }

    /**
     * Vérifier si un point est dans une zone (algorithme ray-casting)
     * Note: Purement JS, pas de SQL ici
     * @param {Array} point - [lat, lng]
     * @param {Array} zoneCoordinates - Tableau de polygones
     * @returns {boolean} True si dedans
     */
    static isPointInZone(point, zoneCoordinates) {
        // Si c'est un cercle (objet avec center et radius)
        if (zoneCoordinates.center && zoneCoordinates.radius) {
            // Calculer distance
            const [lat, lng] = point;
            const [centerLat, centerLng] = zoneCoordinates.center;

            const R = 6371e3; // Rayon Terre
            const φ1 = lat * Math.PI / 180;
            const φ2 = centerLat * Math.PI / 180;
            const Δφ = (centerLat - lat) * Math.PI / 180;
            const Δλ = (centerLng - lng) * Math.PI / 180;

            const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distance = R * c;

            return distance <= zoneCoordinates.radius;
        }

        // Si c'est un polygone (tableau de points)
        const [lat, lng] = point;
        let inside = false;

        for (let i = 0, j = zoneCoordinates.length - 1; i < zoneCoordinates.length; j = i++) {
            const [xi, yi] = zoneCoordinates[i];
            const [xj, yj] = zoneCoordinates[j];

            const intersect = ((yi > lng) !== (yj > lng))
                && (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi);

            if (intersect) inside = !inside;
        }

        return inside;
    }

    /**
     * Récupérer les zones par type
     * @param {string} type - Type de zone
     * @returns {Promise<Array>} Liste des zones
     */
    static async findByType(type) {
        const sql = `SELECT * FROM zones WHERE type = $1 ORDER BY created_at DESC`;

        try {
            const result = await pool.query(sql, [type]);
            return result.rows.map(zone => ({
                ...zone,
                coordinates: JSON.parse(zone.coordinates)
            }));
        } catch (err) {
            throw err;
        }
    }

    /**
     * Compter les zones par type
     * @returns {Promise<Array>} Liste {type, count}
     */
    static async countByType() {
        const sql = `
      SELECT type, COUNT(*) as count
      FROM zones
      GROUP BY type
    `;

        try {
            const result = await pool.query(sql);
            return result.rows;
        } catch (err) {
            throw err;
        }
    }
}

module.exports = Zone;
