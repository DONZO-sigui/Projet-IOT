const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Erreur connexion:', err.message);
  } else {
    console.log('✅ Connexion PostgreSQL OK!');
    console.log('Heure serveur:', res.rows[0]);
  }
  pool.end();
});