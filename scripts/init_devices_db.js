const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

async function runMigration() {
    try {
        const sqlPath = path.join(__dirname, 'create_devices.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Exécution du script SQL...');
        await pool.query(sql);
        console.log('✅ Tables devices créées et données initialisées avec succès !');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur lors de la migration:', error);
        process.exit(1);
    }
}

runMigration();
