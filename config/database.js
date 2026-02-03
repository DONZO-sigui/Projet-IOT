const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'D@lton252',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'IOTPECHE',
});

// Test connexion
pool.on('error', (err) => {
  console.error('Erreur connexion BD:', err);
});

module.exports = pool;