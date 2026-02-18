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

  /**
   * Récupérer tous les utilisateurs
   * @returns {Promise<Array>} Liste de tous les utilisateurs (sans mots de passe)
   */
  static async findAll() {
    const query = 'SELECT id, username, email, role, active AS "isActive", created_at, updated_at FROM users ORDER BY created_at DESC';
    const result = await pool.query(query);
    return result.rows;
  }

  /**
   * Obtenir les statistiques des utilisateurs
   * @returns {Promise<Object>} Statistiques (total, par rôle, actifs)
   */
  static async getStats() {
    const query = `
      SELECT 
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE role = 'admin') AS admins,
        COUNT(*) FILTER (WHERE role = 'pecheur') AS pecheurs,
        COUNT(*) FILTER (WHERE role = 'observateur') AS observateurs,
        COUNT(*) FILTER (WHERE role = 'technicien') AS techniciens,
        COUNT(*) FILTER (WHERE active = true) AS active
      FROM users
    `;
    const result = await pool.query(query);
    return result.rows[0];
  }

  /**
   * Mettre à jour le rôle d'un utilisateur
   * @param {number} id - ID de l'utilisateur
   * @param {string} role - Nouveau rôle
   * @returns {Promise<Object>} L'utilisateur mis à jour
   */
  static async updateRole(id, role) {
    const query = `
      UPDATE users 
      SET role = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2 
      RETURNING id, username, email, role, active, updated_at
    `;
    const result = await pool.query(query, [role, id]);
    return result.rows[0];
  }

  /**
   * Mettre à jour le statut actif d'un utilisateur
   * @param {number} id - ID de l'utilisateur
   * @param {boolean} isActive - Nouveau statut
   * @returns {Promise<Object>} L'utilisateur mis à jour
   */
  static async updateStatus(id, isActive) {
    const query = `
      UPDATE users 
      SET active = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2 
      RETURNING id, username, email, role, active, updated_at
    `;
    const result = await pool.query(query, [isActive, id]);
    return result.rows[0];
  }

  /**
   * Mettre à jour les informations de profil (email, username)
   * @param {number} id - ID de l'utilisateur
   * @param {string} username - Nouveau nom d'utilisateur
   * @param {string} email - Nouvel email
   * @returns {Promise<Object>} L'utilisateur mis à jour
   */
  static async updateProfile(id, username, email) {
    const query = `
      UPDATE users 
      SET username = $1, email = $2, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $3 
      RETURNING id, username, email, role, active, updated_at
    `;
    const result = await pool.query(query, [username, email, id]);
    return result.rows[0];
  }

  /**
   * Mettre à jour le mot de passe d'un utilisateur
   * @param {number} id - ID de l'utilisateur
   * @param {string} newPassword - Nouveau mot de passe en clair
   * @returns {Promise<boolean>} True si succès
   */
  static async updatePassword(id, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const query = `
      UPDATE users 
      SET password = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2
    `;
    const result = await pool.query(query, [hashedPassword, id]);
    return result.rowCount > 0;
  }

  /**
   * Supprimer un utilisateur
   * @param {number} id - ID de l'utilisateur à supprimer
   * @returns {Promise<boolean>} True si supprimé avec succès
   */
  static async delete(id) {
    const query = 'DELETE FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rowCount > 0;
  }
}

module.exports = User;