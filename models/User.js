/**
 * Modèle User
 * Gère les utilisateurs, l'authentification et les rôles
 * 
 * @requires pg
 * @requires bcryptjs
 */
const pool = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  /**
   * Créer la table users si elle n'existe pas
   * Définit les contraintes et types de colonnes (PostgreSQL)
   */
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'pecheur' CHECK (role IN ('admin', 'pecheur', 'technicien', 'observateur')),
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    try {
      await pool.query(query);
      console.log('✅ Table users créée/vérifiée');
    } catch (err) {
      console.error('❌ Erreur création table users:', err);
    }
  }

  /**
   * Créer un nouvel utilisateur
   * @param {string} username - Nom d'utilisateur
   * @param {string} email - Email
   * @param {string} password - Mot de passe (sera haché)
   * @param {string} role - Rôle (admin, pecheur, technicien, observateur)
   * @returns {Promise<Object>} L'utilisateur créé (sans mot de passe)
   */
  static async create(username, email, password, role = 'pecheur') {
    const hashedPassword = await bcrypt.hash(password, 10);

    const query = `
      INSERT INTO users (username, email, password, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, username, email, role, created_at;
    `;

    try {
      const result = await pool.query(query, [username, email, hashedPassword, role]);
      return result.rows[0];
    } catch (err) {
      if (err.code === '23505') {
        throw new Error('Cet utilisateur ou email existe déjà');
      }
      throw err;
    }
  }

  /**
   * Chercher un utilisateur par son nom d'utilisateur
   * @param {string} username - Nom d'utilisateur
   * @returns {Promise<Object>} L'utilisateur trouvé
   */
  static async findByUsername(username) {
    const query = 'SELECT * FROM users WHERE username = $1 AND active = true';
    const result = await pool.query(query, [username]);
    return result.rows[0];
  }

  /**
   * Chercher un utilisateur par son ID
   * @param {number} id - ID de l'utilisateur
   * @returns {Promise<Object>} L'utilisateur trouvé (sans mot de passe)
   */
  static async findById(id) {
    const query = 'SELECT id, username, email, role, active, created_at FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  /**
   * Vérifier le mot de passe d'un utilisateur
   * @param {string} plainPassword - Mot de passe en clair à vérifier
   * @param {string} hashedPassword - Hash stocké en base
   * @returns {Promise<boolean>} True si correspondance
   */
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
}

module.exports = User;