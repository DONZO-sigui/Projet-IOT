/**
 * SimulationService.js
 * Simule le mouvement des bateaux en temps réel
 * Utile pour les démonstrations et les tests
 */
const Boat = require('../models/Boat');
const GpsPosition = require('../models/GpsPosition');

class SimulationService {
    constructor() {
        this.interval = null;
        this.intervalTime = 30000; // 30 secondes
    }

    /**
     * Démarrer le simulateur
     */
    start() {
        console.log('🚀 Démarrage du simulateur de mouvement des bateaux (intervalle: 30s)');
        // On attend 5 secondes avant de lancer le premier cycle pour laisser le temps au serveur de démarrer
        setTimeout(() => {
            this.simulateMovement();
            this.interval = setInterval(() => this.simulateMovement(), this.intervalTime);
        }, 5000);
    }

    /**
     * Arrêter le simulateur
     */
    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            console.log('🛑 Simulateur de mouvement arrêté');
        }
    }

    /**
     * Logique de simulation pour chaque bateau actif
     */
    async simulateMovement() {
        try {
            // Récupérer tous les bateaux
            const boats = await Boat.findAll();
            // On ne simule que les bateaux "actifs"
            const activeBoats = boats.filter(b => b.status === 'active');

            if (activeBoats.length === 0) {
                console.log('ℹ️ Simulation : Aucun bateau actif trouvé pour le mouvement.');
                return;
            }

            for (const boat of activeBoats) {
                // Récupérer la dernière position connue
                const lastPos = await GpsPosition.getLatestByBoat(boat.id);

                if (lastPos) {
                    // Si le bateau est à l'arrêt (vitesse < 1), on lui donne une vitesse de base
                    let currentSpeed = lastPos.speed || 10;
                    let currentHeading = lastPos.heading || Math.floor(Math.random() * 360);

                    // 1. Calculer le déplacement (Distance = Vitesse * Temps)
                    // Vitesse en km/h, Temps en secondes (30s)
                    const distanceKm = (currentSpeed / 3600) * 30;

                    // 2. Conversion du déplacement en coordonnées GPS (approximation)
                    // 1 degré lat ≈ 111 km
                    // 1 degré lon ≈ 111 km * cos(lat)
                    const deltaLat = (distanceKm / 111) * Math.cos(currentHeading * Math.PI / 180);
                    const deltaLon = (distanceKm / (111 * Math.cos(lastPos.latitude * Math.PI / 180))) * Math.sin(currentHeading * Math.PI / 180);

                    const newLat = lastPos.latitude + deltaLat;
                    const newLon = lastPos.longitude + deltaLon;

                    // 3. Appliquer des variations aléatoires pour plus de réalisme
                    // Vitesse : +/- 2 km/h
                    let nextSpeed = currentSpeed + (Math.random() - 0.5) * 4;
                    if (nextSpeed < 2) nextSpeed = 2; // Vitesse mini
                    if (nextSpeed > 45) nextSpeed = 45; // Vitesse maxi (bateau rapide)

                    // Cap : +/- 5 degrés
                    let nextHeading = currentHeading + (Math.random() - 0.5) * 10;
                    if (nextHeading < 0) nextHeading += 360;
                    if (nextHeading >= 360) nextHeading -= 360;

                    // 4. Enregistrer la nouvelle position
                    await GpsPosition.create(
                        boat.id,
                        parseFloat(newLat.toFixed(6)),
                        parseFloat(newLon.toFixed(6)),
                        parseFloat(nextSpeed.toFixed(1)),
                        Math.floor(nextHeading),
                        lastPos.altitude || 0
                    );

                    // console.log(`🚢 Simulation [${boat.name}]: [${newLat.toFixed(4)}, ${newLon.toFixed(4)}] Speed: ${nextSpeed.toFixed(1)}km/h Heading: ${Math.floor(nextHeading)}°`);
                }
            }
        } catch (error) {
            console.error('❌ Erreur lors de la simulation de mouvement:', error);
        }
    }
}

module.exports = new SimulationService();
