const pool = require('../config/database');
const Alert = require('../models/Alert');

async function checkDatabase() {
    try {
        console.log('--- VÉRIFICATION BASE DE DONNÉES ---');

        // 1. Compter les alertes
        const count = await pool.query('SELECT COUNT(*) FROM alerts');
        console.log(`Nombre total d'alertes : ${count.rows[0].count}`);

        // 2. Voir les dernières alertes
        const rows = await pool.query('SELECT * FROM alerts ORDER BY created_at DESC LIMIT 5');
        console.log('Dernières alertes :');
        console.table(rows.rows);

        // 3. Vérifier les bateaux
        const boats = await pool.query('SELECT id, name, owner_id FROM boats');
        console.log(`Nombre de bateaux : ${boats.rowCount}`);
        if (boats.rowCount > 0) {
            console.table(boats.rows);
        } else {
            console.log("⚠️ AUCUN BATEAU ! Le test ne peut pas marcher.");
        }

        // 4. Vérifier les zones
        const zones = await pool.query('SELECT id, name, type FROM zones');
        console.log(`Nombre de zones : ${zones.rowCount}`);
        console.table(zones.rows);

        process.exit(0);
    } catch (err) {
        console.error('Erreur:', err);
        process.exit(1);
    }
}

checkDatabase();
