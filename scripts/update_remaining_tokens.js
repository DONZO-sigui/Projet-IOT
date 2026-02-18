const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function updateTokens() {
    try {
        // 1. Turbidité (ID 3)
        const tokenTurbidity = 'EhX58Fek6jfqGWzqhG2b';
        await pool.query('UPDATE devices SET thingsboard_token = $1 WHERE id = 3', [tokenTurbidity]);
        console.log("✅ Turbidité (ID 3) mis à jour.");

        // 2. Gateway (ID 5)
        const tokenGateway = 'eJqPj3o7tU0QkUUWLUxb';
        await pool.query('UPDATE devices SET thingsboard_token = $1 WHERE id = 5', [tokenGateway]);
        console.log("✅ Gateway (ID 5) mis à jour.");

    } catch (err) {
        console.error('Erreur SQL', err);
    } finally {
        const res = await pool.query('SELECT id, device_name, thingsboard_token FROM devices WHERE id IN (3, 5)');
        console.table(res.rows);
        await pool.end();
    }
}

updateTokens();
