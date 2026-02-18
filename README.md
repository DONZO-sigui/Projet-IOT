# 🎣 IoT Pêche - Système de Gestion Intelligente des Zones de Pêche

Ce projet est une plateforme web IoT complète destinée à la surveillance et la gestion durable des activités de pêche. Il permet le suivi en temps réel des bateaux, la surveillance de la qualité de l'eau, et la gestion des zones réglementées (zones protégées, autorisées, etc.).

---

## 🚀 Fonctionnalités Principales

### 1. Tableau de Bord (Dashboard)
- **Vue d'ensemble complète** : Statistiques en temps réel sur la flotte, les utilisateurs et les capteurs.
- **Cartographie interactive** : Position GPS des bateaux en temps réel sur une carte (OpenStreetMap / Leaflet).
- **Graphiques d'analyse** : Suivi de la qualité de l'eau (pH, Température, Turbidité) et distribution des zones.
- **Alertes en direct** : Système de notification pour les violations de zones (entrée/sortie interdite) ou anomalies capteurs.
- **Historique** : Journal d'activité détaillé des actions utilisateurs et événements système.

### 2. Gestion des Zones de Pêche
- Création et modification de zones géographiques (polygones, cercles) directement sur la carte.
- Classification des zones : Pêche Autorisée (Vert), Interdite (Rouge), Protégée (Bleu).
- Détection automatique des bateaux entrant/sortant des zones.

### 3. Gestion de la Flotte et IoT
- Enregistrement des bateaux et attribution aux pêcheurs.
- Gestion des dispositifs IoT (Capteurs GPS, Sondeurs, Qualité d'eau).
- Simulation de données de télémétrie (intégration ThingsBoard possible).

### 4. Administration et Sécurité
- Gestion des utilisateurs avec rôles (Administrateur, Pêcheur, Technicien, Observateur).
- Authentification sécurisée (JWT + Cookies).
- Protection des routes et des API.

---

## 🛠️ Technologies Utilisées

### Backend (Serveur)
- **Node.js** : Environnement d'exécution JavaScript.
- **Express.js** : Framework web rapide et minimaliste.
- **PostgreSQL** : Base de données relationnelle robuste (avec module `pg`).
- **JWT (JsonWebToken)** : Pour l'authentification sécurisée.
- **Bcrypt.js** : Hachage des mots de passe.

### Frontend (Interface)
- **EJS (Embedded JavaScript)** : Moteur de template pour le rendu côté serveur.
- **Bootstrap 5** : Framework CSS pour un design responsive et moderne.
- **Leaflet.js** : Bibliothèque de cartographie interactive.
- **Chart.js** : Bibliothèque de visualisation de données (graphiques).

### Outils de Développement
- **Nodemon** : Redémarrage automatique du serveur pendant le développement.
- **Dotenv** : Gestion des variables d'environnement.

---

## 📥 Installation et Configuration

### Prérequis
- **Node.js** (v14 ou supérieur) installé sur votre machine.
- **PostgreSQL** installé et en cours d'exécution.

### Étapes d'installation

1. **Cloner le projet** (ou extraire l'archive) :
   ```bash
   git clone <url-du-repo>
   cd Projet-IOT
   ```

2. **Installer les dépendances** :
   ```bash
   npm install
   ```

3. **Configuration de la Base de Données** :
   - Créez une base de données PostgreSQL nommée `peche_iot` (ou autre).
   - Le projet créera automatiquement les tables au premier démarrage.

4. **Configuration des Variables d'Environnement** :
   - Créez un fichier `.env` à la racine du projet.
   - Ajoutez les configurations suivantes (adaptez selon votre système) :
     ```env
     PORT=3000
     DB_USER=postgres
     DB_HOST=localhost
     DB_NAME=peche_iot
     DB_PASSWORD=votre_mot_de_passe
     DB_PORT=5432
     JWT_SECRET=votre_cle_secrete_super_securisee
     ```

---

## ▶️ Lancement de l'Application

Pour démarrer le serveur en mode développement (avec rechargement automatique) :

```bash
npm run dev
```

L'application sera accessible à l'adresse : **http://localhost:3000**

Comptes (si base vide) :
- Inscrivez-vous via la page `/auth/register`.
- Le premier utilisateur peut nécessiter une modification manuelle en base pour devenir `admin` si le système d'inscription ne le permet pas par défaut (rôle par défaut : `pecheur`).

---

## 📂 Structure du Projet

- `/controllers` : Logique métier (traitement des requêtes).
- `/models` : Interaction avec la base de données (Requêtes SQL).
- `/routes` : Définition des endpoints API et des pages.
- `/views` : Templates EJS (Pages HTML dynamiques).
- `/public` : Fichiers statiques (CSS, IMAGES, JS Client).
- `/middleware` : Fonctions intermédiaires (Authentification, Logs).
- `server.js` : Point d'entrée de l'application.

---


---

## 🏗️ Architecture du Projet

Le projet suit une architecture **MVC (Modèle-Vue-Contrôleur)** :

- **Modèle (Model)** : Gestion des données et interactions SQL (`/models`).
- **Vue (View)** : Rendu de l'interface utilisateur via EJS (`/views`).
- **Contrôleur (Controller)** : Logique métier et traitement des requêtes (`/controllers`).

### Flux de Données
1. **Capteurs IoT** -> (Simulés/ThingsBoard) -> **API Node.js** -> **Base de Données**.
2. **Utilisateur** -> **Interface Web** -> **API Node.js** -> **Base de Données**.

---

## 🔌 API Endpoints Principaux

| Méthode | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/auth/login` | Connexion utilisateur |
| `GET` | `/admin/dashboard` | Affichage du tableau de bord |
| `GET` | `/api/boats` | Liste des bateaux (JSON) |
| `GET` | `/api/zones` | Liste des zones de pêche |
| `GET` | `/api/dashboard/stats` | Statistiques globales |
| `GET` | `/api/alerts/active` | Alertes non résolues |

---

## 👥 Auteurs

Projet réalisé par les étudiants de **Licence 3 - Semestre 1 (IoT)** :
- [Votre Nom]
- [Nom du Binôme]

---

## 📄 Licence

Ce projet est sous licence **ISC**. Vous êtes libre de l'utiliser et de le modifier dans le cadre universitaire.
