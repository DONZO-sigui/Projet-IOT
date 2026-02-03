# 🌊 Proj_iot - Système de Surveillance Maritime IoT

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)
![License](https://img.shields.io/badge/license-MIT-orange.svg)

Plateforme IoT de surveillance maritime en temps réel avec dashboard administratif, visualisation de données et intelligence artificielle pour l'analyse de la qualité de l'eau.

---

## 📸 Aperçu

### Dashboard Admin
![Dashboard](public/images/dashboard-preview.png)
*Dashboard glassmorphism avec graphiques temps réel, carte GPS et module IA*

### Page d'Accueil
![Home](public/images/home-preview.png)
*Interface publique présentant le projet et les devices IoT*

---

## ✨ Fonctionnalités

### 🎯 Surveillance en Temps Réel
- **Température & Humidité**: Monitoring environnemental via capteurs DHT22
- **Qualité de l'Eau**: Analyse pH et turbidité avec prédictions IA
- **Géolocalisation GPS**: Tracking des devices sur carte interactive Leaflet
- **Alertes SOS**: Système d'urgence avec notifications instantanées

### 📊 Visualisation de Données
- **Graphiques Interactifs**: Chart.js pour historiques et tendances
- **Cartes Dynamiques**: Leaflet.js avec marqueurs temps réel
- **Dashboard Glassmorphism**: Design moderne et élégant
- **Météo Marine**: Intégration prévisions météorologiques

### 🤖 Intelligence Artificielle
- **TensorFlow.js**: Prédiction qualité de l'eau
- **Analyse Prédictive**: Détection anomalies et tendances
- **Recommandations**: Suggestions basées sur les données

### 🔐 Sécurité
- **Authentification Admin**: Système de login sécurisé
- **Sessions Express**: Gestion des utilisateurs connectés
- **Routes Protégées**: Middleware de vérification d'accès
- **Récupération Mot de Passe**: Système de reset (simulé)

---

## 🛠️ Technologies Utilisées

### Backend
- **Node.js** (v18+) - Runtime JavaScript
- **Express** (v5.2.1) - Framework web
- **EJS** (v3.1.10) - Moteur de templates
- **Express-Session** (v1.18.2) - Gestion sessions

### Frontend
- **Chart.js** (v4.5.1) - Graphiques interactifs
- **Leaflet.js** (v1.9.4) - Cartes interactives
- **TensorFlow.js** (v4.22.0) - Machine Learning
- **CSS Vanilla** - Design glassmorphism personnalisé

### Hardware IoT
- **ESP32** - Microcontrôleur WiFi
- **DHT22** - Capteur température/humidité
- **Module GPS** - Géolocalisation
- **Capteurs pH/Turbidité** - Qualité de l'eau
- **Bouton SOS** - Alerte d'urgence

---

## 🚀 Installation et Démarrage

### Prérequis
- Node.js >= 18.0.0
- npm >= 9.0.0
- Git

### Installation

```bash
# Cloner le repository
git clone https://github.com/DONZO-sigui/Projet-IOT.git
cd Projet-IOT

# Installer les dépendances
npm install

# Créer le fichier .env (optionnel)
cp .env.example .env

# Démarrer en mode développement
npm run dev

# Ou démarrer en mode production
npm start
```

### Accès à l'Application

- **Site Web**: http://localhost:3000
- **Dashboard Admin**: http://localhost:3000/admin/login
  - Username: `admin`
  - Password: `donzosd`

---

## 📁 Structure du Projet

```
Projet-IOT/
├── 📁 public/                    # Fichiers statiques
│   ├── css/
│   │   └── style.css            # Styles glassmorphism
│   ├── js/
│   │   └── main.js              # Scripts frontend
│   ├── images/                  # Images et icônes
│   └── documents/               # Documents PDF
│
├── 📁 routes/                    # Routes Express
│   ├── index.js                 # Route page d'accueil
│   ├── admin.js                 # Routes admin protégées
│   └── rapport.js               # Génération rapports
│
├── 📁 views/                     # Templates EJS
│   ├── index.ejs                # Page d'accueil
│   ├── partials/
│   │   └── navbar.ejs           # Navigation
│   └── admin/
│       ├── login.ejs            # Connexion
│       ├── forgot-password.ejs  # Récupération MDP
│       └── ia-qualite.ejs       # Dashboard principal
│
├── 📄 server.js                  # Point d'entrée
├── 📄 package.json               # Dépendances
├── 📄 ARCHITECTURE.md            # Documentation architecture
└── 📄 README.md                  # Ce fichier
```

---

## 🔧 Configuration des Devices IoT

### Code Arduino/ESP32 (Exemple)

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <DHT.h>

// Configuration WiFi
const char* ssid = "VotreWiFi";
const char* password = "VotreMotDePasse";
const char* serverUrl = "http://votre-serveur:3000/api/sensor-data";

// Configuration DHT22
#define DHTPIN 4
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  dht.begin();
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connecté!");
}

void loop() {
  float temp = dht.readTemperature();
  float humidity = dht.readHumidity();
  
  if (!isnan(temp) && !isnan(humidity)) {
    sendDataToServer(temp, humidity);
  }
  
  delay(10000); // Envoi toutes les 10 secondes
}

void sendDataToServer(float temp, float humidity) {
  HTTPClient http;
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");
  
  String jsonData = "{\"temperature\":" + String(temp) + 
                    ",\"humidity\":" + String(humidity) + "}";
  
  int httpCode = http.POST(jsonData);
  Serial.println("Données envoyées: " + jsonData);
  
  http.end();
}
```

---

## 📊 API Endpoints

### Routes Publiques

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/` | Page d'accueil |
| GET | `/admin/login` | Page de connexion |
| POST | `/admin/login` | Authentification |
| GET | `/admin/forgot-password` | Récupération mot de passe |

### Routes Protégées (Admin)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/admin/ia-qualite` | Dashboard principal |
| GET | `/admin/logout` | Déconnexion |
| GET | `/rapport` | Génération rapport PDF |

### API Données IoT (Future)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/sensor-data` | Recevoir données capteurs |
| GET | `/api/latest-data` | Récupérer dernières données |
| GET | `/api/history/:deviceId` | Historique d'un device |

---

## 🎨 Design System

### Palette de Couleurs (Glassmorphism)

```css
/* Couleurs principales */
--primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
--glass-bg: rgba(255, 255, 255, 0.1);
--glass-border: rgba(255, 255, 255, 0.2);

/* Couleurs de statut */
--success: #10b981;
--warning: #f59e0b;
--danger: #ef4444;
--info: #3b82f6;
```

### Effets Glassmorphism

```css
.glass-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}
```

---

## 🧪 Tests et Validation

### Tester l'Application

```bash
# Démarrer le serveur
npm run dev

# Ouvrir dans le navigateur
http://localhost:3000

# Tester l'authentification
# Aller sur /admin/login
# Username: admin
# Password: donzosd
```

### Simuler des Données IoT

```bash
# Utiliser curl pour envoyer des données de test
curl -X POST http://localhost:3000/api/sensor-data \
  -H "Content-Type: application/json" \
  -d '{"temperature": 25.5, "humidity": 60, "quality": 85}'
```

---

## 📈 Évolutions Futures

### Phase 2 - Court Terme
- [ ] Intégration MongoDB pour persistance des données
- [ ] API REST complète avec documentation Swagger
- [ ] WebSocket pour mises à jour temps réel
- [ ] Export données en CSV/Excel

### Phase 3 - Moyen Terme
- [ ] Application mobile React Native
- [ ] Notifications push pour alertes
- [ ] Système multi-utilisateurs avec rôles
- [ ] Tableau de bord personnalisable

### Phase 4 - Long Terme
- [ ] Machine Learning avancé (prédictions météo)
- [ ] Intégration LoRa pour longue portée
- [ ] Déploiement cloud (AWS/Azure)
- [ ] API publique pour développeurs tiers

---

## 🤝 Contribution

Les contributions sont les bienvenues ! Pour contribuer :

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

---

## 📄 License

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

---

## 👥 Auteurs

- **DONZO Sigui** - *Développement initial* - [DONZO-sigui](https://github.com/DONZO-sigui)

---

## 📞 Support

Pour toute question ou problème :
- 📧 Email: contact@proj-iot.com
- 🐛 Issues: [GitHub Issues](https://github.com/DONZO-sigui/Projet-IOT/issues)
- 📖 Documentation: [ARCHITECTURE.md](./ARCHITECTURE.md)

---

## 🙏 Remerciements

- Chart.js pour les graphiques magnifiques
- Leaflet.js pour les cartes interactives
- TensorFlow.js pour l'IA côté client
- La communauté ESP32 pour les ressources hardware

---

<div align="center">

**Fait avec ❤️ pour la surveillance maritime**

[⬆ Retour en haut](#-proj_iot---système-de-surveillance-maritime-iot)

</div>
