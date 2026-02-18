const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function consolidateTokens() {
    try {
        // On réutilise le token du Device 1 (Sonde pH) pour le Temp (2) et GPS (4)
        // Token ID 1 = 'goENMon3DP6FnwsVvlUX'
        const sharedToken = 'goENMon3DP6FnwsVvlUX';

        // Mise à jour ID 2 (Temp) et ID 4 (GPS) avec ce token
        await pool.query('UPDATE devices SET thingsboard_token = $1 WHERE id IN (2, 4)', [sharedToken]);

        console.log("✅ Consolidation terminée.");
        console.log("Les devices 2 (Temp) et 4 (GPS) envoient maintenant leurs données sur le même canal que le device 1.");
        console.log("Sur ThingsBoard, regardez le device 'Bateau-01-sonde-ph', il recevra tout !");

    } catch (err) {
        console.error('Erreur SQL', err);
    } finally {
        await pool.end();
    }
}

consolidateTokens();
