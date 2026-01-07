let map = null;      // La carte (créée une seule fois)
let marker = null;   // Le marqueur (créé une seule fois)
let circle = null;   // Le cercle de zone (optionnel, créé une fois)

// Fonction IA pour prédire la qualité de l'eau
function predictQuality(ph, temp, turbidite, lat) {
  let score = 0;

  // Seuils basés sur ton projet
  if (ph >= 6.5 && ph <= 8.5) score += 2;
  if (temp >= 25 && temp <= 30) score += 2;
  if (turbidite < 30) score += 2;

  // Bonus si tu es dans ton domaine de pêche principal
  if (Math.abs(lat - 9.52) < 0.2 && Math.abs(-13.68 - (-13.68)) < 0.2) score += 1;

  if (score >= 6) {
    return "🌊 <strong>Excellente qualité</strong><br>Pêche optimale et sûre !";
  } else if (score >= 4) {
    return "👍 <strong>Bonne qualité</strong><br>Conditions favorables pour la pêche";
  } else if (score >= 2) {
    return "⚠️ <strong>Qualité moyenne</strong><br>Surveiller attentivement";
  } else {
    return "🚨 <strong>Mauvaise qualité</strong><br>Éviter la pêche - Risque de pollution";
  }
}

// Initialisation de la carte (seulement au chargement de la page)
document.addEventListener('DOMContentLoaded', () => {
  map = L.map('map').setView([9.52, -13.68], 12);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  // Marqueur unique
  marker = L.marker([9.52, -13.68]).addTo(map)
    .bindPopup('<b>Domaine de pêche principal</b><br>Proj_iot surveillance')
    .openPopup();

  // Cercle de zone de pêche (5 km)
  circle = L.circle([9.52, -13.68], {
    color: 'blue',
    fillColor: '#3388ff',
    fillOpacity: 0.2,
    radius: 5000
  }).addTo(map).bindPopup('Zone surveillée (5 km)');

  // Prédiction par défaut au chargement
  updatePrediction(7.2, 27.5, 22, 9.52);
});

// Fonction appelée à chaque clic sur le bouton
function runPrediction() {
  // Récupérer les valeurs (avec valeurs par défaut si vide)
  const ph = parseFloat(document.getElementById('ph').value) || 7.0;
  const temp = parseFloat(document.getElementById('temp').value) || 27.0;
  const turbidite = parseFloat(document.getElementById('turbidite').value) || 25;
  const lat = parseFloat(document.getElementById('lat').value) || 9.52;
  const lng = -13.68; // Tu peux ajouter un champ longitude si tu veux

  // Mettre à jour la prédiction
  const prediction = predictQuality(ph, temp, turbidite, lat);
  document.getElementById('prediction').innerHTML = prediction;

  // Mettre à jour la position sur la carte
  const newLatLng = [lat, lng];
  marker.setLatLng(newLatLng);
  circle.setLatLng(newLatLng);
  map.setView(newLatLng, 12);

  // Mettre à jour le popup du marqueur
  marker.bindPopup(`<b>Position analysée</b><br>
    Lat: ${lat}<br>
    Qualité : ${prediction.split('<br>')[0]}
  `).openPopup();
}