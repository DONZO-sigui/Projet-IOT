# 🎯 Guide d'Installation Rapide - Projet IoT

Guide visuel étape par étape pour l'installation des devices IoT.

---

## 🚀 Installation Device ESP32-001 (Bateau)

### Étape 1: Préparation des Composants

```
┌─────────────────────────────────────────────────────────────────┐
│                    CHECKLIST MATÉRIEL                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ☐ ESP32 DevKit v1                                             │
│  ☐ DHT22 avec câble 3 fils (Rouge, Jaune, Noir)               │
│  ☐ GPS NEO-6M avec câble 4 fils                                │
│  ☐ Capteur pH avec câble 3 fils                                │
│  ☐ Capteur Turbidité avec câble 3 fils                         │
│  ☐ Bouton SOS étanche                                          │
│  ☐ LED verte 5mm + résistance 220Ω                            │
│  ☐ Batterie 12V 7Ah                                            │
│  ☐ Panneau solaire 20W                                         │
│  ☐ Contrôleur de charge MPPT                                   │
│  ☐ Régulateur 5V (LM2596)                                      │
│  ☐ Boîtier IP67                                                │
│  ☐ Presse-étoupes x6                                           │
│  ☐ Câbles, connecteurs, soudure                                │
│                                                                 │
│  OUTILS NÉCESSAIRES:                                            │
│  ☐ Fer à souder + étain                                        │
│  ☐ Multimètre                                                   │
│  ☐ Tournevis cruciforme                                        │
│  ☐ Pince coupante                                              │
│  ☐ Gaine thermorétractable                                     │
│  ☐ Silicone étanche                                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Étape 2: Câblage du DHT22

```
ÉTAPE 2.1 - Identifier les pins du DHT22
┌──────────────────────────────┐
│      DHT22 (Vue de face)     │
│                              │
│   ┌────────────────────┐    │
│   │  ╔══════════════╗  │    │
│   │  ║   DHT22      ║  │    │
│   │  ║   AM2302     ║  │    │
│   │  ╚══════════════╝  │    │
│   └────────────────────┘    │
│    │    │    │    │         │
│    1    2    3    4         │
│    │    │    │    │         │
│   VCC  DATA  NC  GND        │
│  (Rouge)(Jaune)   (Noir)    │
└──────────────────────────────┘

ÉTAPE 2.2 - Connexion à l'ESP32
1. Souder fil ROUGE (VCC) → ESP32 pin 3V3
2. Souder fil JAUNE (DATA) → ESP32 pin GPIO4
3. Souder fil NOIR (GND) → ESP32 pin GND
4. Ajouter résistance 10kΩ entre VCC et DATA (pull-up)

ÉTAPE 2.3 - Test
1. Programmer ESP32 avec code de test DHT22
2. Vérifier lecture température et humidité
3. Si NaN → vérifier résistance pull-up

✅ DHT22 installé et testé
```

### Étape 3: Câblage du GPS NEO-6M

```
ÉTAPE 3.1 - Identifier les pins du GPS
┌──────────────────────────────┐
│    GPS NEO-6M (Vue dessus)   │
│                              │
│   ┌────────────────────┐    │
│   │  [Antenne Céramique]│   │
│   │                     │    │
│   │   NEO-6M Module     │    │
│   │                     │    │
│   └─┬──┬──┬──┬─────────┘    │
│     │  │  │  │               │
│    VCC TX RX GND             │
│   (Rouge)(Vert)(Bleu)(Noir)  │
└──────────────────────────────┘

ÉTAPE 3.2 - Connexion UART à l'ESP32
1. VCC (Rouge) → ESP32 pin 3V3
2. TX (Vert) → ESP32 pin GPIO16 (RX)  ⚠️ ATTENTION: TX→RX
3. RX (Bleu) → ESP32 pin GPIO17 (TX)  ⚠️ ATTENTION: RX→TX
4. GND (Noir) → ESP32 pin GND

ÉTAPE 3.3 - Test
1. Positionner GPS avec vue dégagée du ciel
2. Attendre 2-5 minutes pour premier fix
3. Vérifier LED GPS clignote (signal acquis)
4. Lire coordonnées sur Serial Monitor

✅ GPS installé et testé
```

### Étape 4: Câblage des Capteurs Analogiques

```
ÉTAPE 4.1 - Capteur pH
┌──────────────────────────────┐
│   Module pH-4502C            │
│                              │
│   [Sonde pH]──────┐          │
│                   │          │
│   ┌───────────────▼────┐    │
│   │  Circuit Ampli     │    │
│   │  + Calibration     │    │
│   └──┬──┬──┬──────────┘    │
│      │  │  │                │
│     VCC OUT GND             │
│    (Rouge)(Bleu)(Noir)      │
└──────────────────────────────┘

Connexion:
VCC → ESP32 3V3
OUT → ESP32 GPIO34 (ADC1_CH6)
GND → ESP32 GND

⚠️ CALIBRATION OBLIGATOIRE:
1. Immerger sonde dans solution pH 7
2. Ajuster potentiomètre "Offset"
3. Immerger dans solution pH 4
4. Ajuster potentiomètre "Gain"
5. Vérifier avec pH 10

ÉTAPE 4.2 - Capteur Turbidité
┌──────────────────────────────┐
│   Turbidity Sensor SEN0189   │
│                              │
│   [Sonde Optique]────┐       │
│                      │       │
│   ┌──────────────────▼───┐  │
│   │  LED + Photodiode    │  │
│   └──┬──┬──┬────────────┘  │
│      │  │  │                │
│     VCC OUT GND             │
│   (Rouge)(Violet)(Noir)     │
└──────────────────────────────┘

Connexion:
VCC → ESP32 3V3
OUT → ESP32 GPIO35 (ADC1_CH7)
GND → ESP32 GND

⚠️ CALIBRATION:
1. Eau distillée = 0 NTU (tension max)
2. Solution test 100 NTU (tension min)
3. Créer courbe de calibration

✅ Capteurs analogiques installés
```

### Étape 5: Bouton SOS et LED

```
ÉTAPE 5.1 - Bouton SOS
┌──────────────────────────────┐
│   Bouton Étanche             │
│                              │
│      ┌─────────┐             │
│      │  ┌───┐  │             │
│      │  │SOS│  │             │
│      │  └───┘  │             │
│      └──┬───┬──┘             │
│         │   │                │
│        Pin1 Pin2             │
└──────────────────────────────┘

Connexion:
Pin1 → ESP32 GPIO5 (avec pull-up interne)
Pin2 → ESP32 GND

Code ESP32:
pinMode(5, INPUT_PULLUP);
// Appuyé = LOW, Relâché = HIGH

ÉTAPE 5.2 - LED Status
┌──────────────────────────────┐
│   LED 5mm + Résistance       │
│                              │
│     Longue  Courte           │
│       │      │               │
│     Anode  Cathode           │
│       (+)    (-)             │
│       │      │               │
│      [R]     │               │
│      220Ω    │               │
│       │      │               │
└───────┼──────┼───────────────┘
        │      │
     GPIO2    GND

Connexion:
Anode → Résistance 220Ω → ESP32 GPIO2
Cathode → ESP32 GND

✅ Bouton et LED installés
```

### Étape 6: Système d'Alimentation

```
SCHÉMA COMPLET D'ALIMENTATION
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  [Panneau Solaire 20W]                                     │
│         18V / 1.1A                                          │
│              │                                              │
│              │ Câble 2.5mm² Rouge(+) Noir(-)              │
│              ▼                                              │
│  ┌─────────────────────────┐                               │
│  │ Contrôleur MPPT         │                               │
│  │ ┌─────────────────────┐ │                               │
│  │ │ IN: Solar 12-24V    │ │                               │
│  │ │ OUT: Battery 12V    │ │                               │
│  │ │ Protection:         │ │                               │
│  │ │ - Surcharge         │ │                               │
│  │ │ - Décharge profonde │ │                               │
│  │ │ - Court-circuit     │ │                               │
│  │ └─────────────────────┘ │                               │
│  └───────────┬─────────────┘                               │
│              │                                              │
│              │ 12V Régulé                                   │
│              ▼                                              │
│  ┌─────────────────────────┐                               │
│  │ Batterie LiFePO4        │                               │
│  │ 12V 7Ah (84Wh)          │                               │
│  │ BMS Protection intégrée │                               │
│  └───────────┬─────────────┘                               │
│              │                                              │
│              │ 12V                                          │
│              ├──────────────┐                              │
│              │              │                              │
│              ▼              ▼                              │
│  ┌──────────────┐  ┌──────────────┐                       │
│  │ Fusible 5A   │  │ Interrupteur │                       │
│  └──────┬───────┘  │ ON/OFF       │                       │
│         │          └──────┬───────┘                       │
│         │                 │                                │
│         └────────┬────────┘                                │
│                  │                                         │
│                  │ 12V Protégé                             │
│                  ▼                                         │
│  ┌─────────────────────────┐                              │
│  │ Régulateur LM2596       │                              │
│  │ Buck Converter          │                              │
│  │ IN: 12V                 │                              │
│  │ OUT: 5V @ 3A            │                              │
│  │ Ajustable (potentiomètre)│                             │
│  └───────────┬─────────────┘                              │
│              │                                             │
│              │ 5V                                          │
│              ▼                                             │
│  ┌─────────────────────────┐                              │
│  │ ESP32 VIN Pin           │                              │
│  │ (Régulateur 3.3V interne)│                             │
│  └─────────────────────────┘                              │
│                                                            │
└────────────────────────────────────────────────────────────┘

ÉTAPES D'INSTALLATION:
1. ✅ Connecter batterie au contrôleur (respecter polarité!)
2. ✅ Connecter panneau solaire au contrôleur
3. ✅ Installer fusible 5A sur ligne 12V
4. ✅ Régler régulateur LM2596 à exactement 5.0V (multimètre)
5. ✅ Connecter ESP32 VIN à sortie 5V
6. ✅ Tester avec multimètre: 3.3V sur pin 3V3 ESP32

⚠️ ATTENTION:
- NE JAMAIS inverser polarité (destruction composants)
- NE JAMAIS dépasser 6V sur VIN ESP32
- NE JAMAIS dépasser 3.6V sur pins GPIO
```

### Étape 7: Assemblage dans le Boîtier

```
DISPOSITION DANS LE BOÎTIER IP67
┌─────────────────────────────────────────────────────────────┐
│                    Vue de Dessus                            │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │  ① ESP32 sur PCB                                   │   │
│  │     (Fixé avec entretoises M3)                     │   │
│  │                                                     │   │
│  │  ┌──────────┐                                      │   │
│  │  │ ESP32    │                                      │   │
│  │  │ DevKit   │         ② Batterie 12V               │   │
│  │  └────┬─────┘            (Fixée avec velcro)       │   │
│  │       │                                            │   │
│  │       │                  ┌──────────────┐         │   │
│  │       │                  │              │         │   │
│  │       │                  │   Battery    │         │   │
│  │       │                  │   12V 7Ah    │         │   │
│  │       │                  │              │         │   │
│  │       │                  └──────────────┘         │   │
│  │       │                                            │   │
│  │  ┌────▼──────────────────────────────────────┐   │   │
│  │  │ ③ Bornier de Connexion                    │   │   │
│  │  │   - Alimentation (12V, 5V, 3.3V, GND)    │   │   │
│  │  │   - Capteurs (DHT22, GPS, pH, Turb.)     │   │   │
│  │  └───────────────────────────────────────────┘   │   │
│  │                                                     │   │
│  │  ④ Composants Électroniques:                      │   │
│  │  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐         │   │
│  │  │Régul.│  │Fusib.│  │Relais│  │Desic.│         │   │
│  │  │ 5V   │  │ 5A   │  │12V   │  │Silica│         │   │
│  │  └──────┘  └──────┘  └──────┘  └──────┘         │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ⑤ Presse-étoupes (Bas du boîtier):                       │
│     ○ ○ ○ ○ ○ ○                                           │
│     1 2 3 4 5 6                                             │
│     │ │ │ │ │ │                                            │
│     │ │ │ │ │ └─ Câble Solaire (Rouge/Noir)              │
│     │ │ │ │ └─── Bouton SOS (2 fils)                     │
│     │ │ │ └───── Turbidité (3 fils)                      │
│     │ │ └─────── pH (3 fils)                             │
│     │ └───────── GPS (4 fils)                            │
│     └─────────── DHT22 (3 fils)                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘

ÉTAPES D'ASSEMBLAGE:
1. ✅ Percer trous pour presse-étoupes (diamètre 12mm)
2. ✅ Installer presse-étoupes avec joint
3. ✅ Passer câbles des capteurs à travers
4. ✅ Fixer ESP32 sur PCB avec entretoises
5. ✅ Souder toutes les connexions
6. ✅ Fixer batterie avec velcro
7. ✅ Installer régulateur et fusible
8. ✅ Placer sachet dessiccant (anti-humidité)
9. ✅ Tester toutes les connexions
10. ✅ Appliquer silicone sur joint
11. ✅ Fermer boîtier et serrer vis
12. ✅ Test d'étanchéité (immersion 30min)
```

### Étape 8: Installation sur le Bateau

```
MONTAGE SUR BATEAU
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                    [Mât du Bateau]                          │
│                          │                                  │
│                          │                                  │
│                    ┌─────▼─────┐                           │
│                    │  Panneau  │                           │
│                    │  Solaire  │                           │
│                    │   20W     │                           │
│                    └─────┬─────┘                           │
│                          │ Câble                           │
│                          │                                  │
│                    ┌─────▼──────────────┐                  │
│                    │   Boîtier IP67     │                  │
│                    │   ESP32 + Sensors  │                  │
│                    │   + Batterie       │                  │
│                    └────────────────────┘                  │
│                          │                                  │
│                    [Fixation M6]                           │
│                          │                                  │
│              ════════════▼════════════                     │
│              ║   Pont du Bateau    ║                     │
│              ╚══════════════════════╝                     │
│                                                             │
│  CAPTEURS IMMERGÉS:                                        │
│  ┌──────────────────────────────────┐                     │
│  │ Sonde pH        │                │                     │
│  │ Sonde Turbidité │  Câbles 2m     │                     │
│  └─────────────────┴────────────────┘                     │
│           │                                                 │
│           │ Immergés à -50cm                               │
│           ▼                                                 │
│  ≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈                         │
│  ≈≈≈≈≈≈≈ Niveau de l'Eau ≈≈≈≈≈≈≈                         │
│  ≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘

INSTRUCTIONS:
1. Choisir emplacement stable (éviter vibrations)
2. Fixer support avec boulons M6 inox
3. Ajouter rondelles anti-vibration
4. Orienter panneau solaire plein sud
5. Incliner panneau à 15° (latitude Dakar)
6. Immerger sondes pH et turbidité
7. Fixer câbles avec colliers plastique
8. Protéger connexions de l'eau de mer
```

---

## 📝 Checklist Finale

### Avant Mise en Service

```
┌─────────────────────────────────────────────────────────────┐
│              CHECKLIST DE VÉRIFICATION                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ALIMENTATION:                                              │
│  ☐ Batterie chargée à 100%                                 │
│  ☐ Panneau solaire produit du courant                      │
│  ☐ Régulateur 5V délivre exactement 5.0V                   │
│  ☐ ESP32 pin 3V3 mesure 3.3V                               │
│  ☐ Fusible 5A installé                                     │
│                                                             │
│  CAPTEURS:                                                  │
│  ☐ DHT22 lit température et humidité                       │
│  ☐ GPS obtient fix (latitude/longitude valides)            │
│  ☐ pH calibré (solutions 4, 7, 10)                         │
│  ☐ Turbidité calibrée (eau distillée + test)              │
│  ☐ Bouton SOS fonctionne (LED s'allume)                   │
│  ☐ LED status clignote                                     │
│                                                             │
│  COMMUNICATION:                                             │
│  ☐ WiFi se connecte au réseau                              │
│  ☐ Données envoyées au serveur                             │
│  ☐ Visible sur dashboard admin                             │
│  ☐ Position GPS affichée sur carte                         │
│                                                             │
│  ÉTANCHÉITÉ:                                                │
│  ☐ Joint O-ring en bon état                                │
│  ☐ Silicone appliqué sur presse-étoupes                   │
│  ☐ Test immersion 30 minutes OK                            │
│  ☐ Aucune condensation interne                             │
│  ☐ Sachet dessiccant présent                               │
│                                                             │
│  MÉCANIQUE:                                                 │
│  ☐ Boîtier solidement fixé                                 │
│  ☐ Boulons serrés (couple 5 Nm)                            │
│  ☐ Rondelles anti-vibration installées                     │
│  ☐ Câbles bien fixés (colliers)                            │
│  ☐ Panneau solaire orienté sud, 15°                        │
│                                                             │
│  SÉCURITÉ:                                                  │
│  ☐ Polarités vérifiées (multimètre)                        │
│  ☐ Pas de court-circuit                                    │
│  ☐ Isolation câbles OK                                      │
│  ☐ Fusible accessible                                      │
│  ☐ Interrupteur ON/OFF fonctionne                          │
│                                                             │
│  ✅ DEVICE PRÊT POUR DÉPLOIEMENT                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Code de Test Complet

### Programme de Test ESP32

```cpp
/*
 * Programme de Test Complet - ESP32-001
 * Teste tous les capteurs et l'envoi de données
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <DHT.h>
#include <TinyGPS++.h>
#include <HardwareSerial.h>

// Configuration WiFi
const char* ssid = "VOTRE_WIFI";
const char* password = "VOTRE_PASSWORD";
const char* serverUrl = "http://192.168.1.100:3000/api/sensor-data";

// Configuration Pins
#define DHTPIN 4
#define DHTTYPE DHT22
#define PH_PIN 34
#define TURBIDITY_PIN 35
#define SOS_BUTTON 5
#define LED_STATUS 2

// Objets
DHT dht(DHTPIN, DHTTYPE);
TinyGPSPlus gps;
HardwareSerial GPS_Serial(1);

void setup() {
  Serial.begin(115200);
  Serial.println("\n\n=== TEST ESP32-001 ===\n");
  
  // Configuration pins
  pinMode(SOS_BUTTON, INPUT_PULLUP);
  pinMode(LED_STATUS, OUTPUT);
  
  // Initialisation capteurs
  dht.begin();
  GPS_Serial.begin(9600, SERIAL_8N1, 16, 17);
  
  // Test WiFi
  testWiFi();
  
  // Test capteurs
  testDHT22();
  testGPS();
  testAnalogSensors();
  testButton();
  
  Serial.println("\n=== FIN DES TESTS ===\n");
}

void loop() {
  // Clignotement LED
  digitalWrite(LED_STATUS, !digitalRead(LED_STATUS));
  delay(1000);
}

void testWiFi() {
  Serial.println("TEST WiFi...");
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi OK - IP: " + WiFi.localIP().toString());
  } else {
    Serial.println("\n❌ WiFi ÉCHEC");
  }
}

void testDHT22() {
  Serial.println("\nTEST DHT22...");
  delay(2000); // DHT22 needs time
  
  float temp = dht.readTemperature();
  float hum = dht.readHumidity();
  
  if (!isnan(temp) && !isnan(hum)) {
    Serial.println("✅ DHT22 OK");
    Serial.println("   Température: " + String(temp) + "°C");
    Serial.println("   Humidité: " + String(hum) + "%");
  } else {
    Serial.println("❌ DHT22 ÉCHEC - Vérifier connexions");
  }
}

void testGPS() {
  Serial.println("\nTEST GPS (attendre 30s pour fix)...");
  
  unsigned long start = millis();
  while (millis() - start < 30000) {
    while (GPS_Serial.available() > 0) {
      if (gps.encode(GPS_Serial.read())) {
        if (gps.location.isValid()) {
          Serial.println("✅ GPS OK");
          Serial.println("   Latitude: " + String(gps.location.lat(), 6));
          Serial.println("   Longitude: " + String(gps.location.lng(), 6));
          Serial.println("   Satellites: " + String(gps.satellites.value()));
          return;
        }
      }
    }
  }
  Serial.println("❌ GPS ÉCHEC - Pas de fix (vérifier antenne)");
}

void testAnalogSensors() {
  Serial.println("\nTEST Capteurs Analogiques...");
  
  int phRaw = analogRead(PH_PIN);
  int turbRaw = analogRead(TURBIDITY_PIN);
  
  float phValue = map(phRaw, 0, 4095, 0, 1400) / 100.0;
  float turbidity = map(turbRaw, 0, 4095, 0, 100);
  
  Serial.println("✅ Capteurs Analogiques OK");
  Serial.println("   pH: " + String(phValue) + " (raw: " + String(phRaw) + ")");
  Serial.println("   Turbidité: " + String(turbidity) + " NTU (raw: " + String(turbRaw) + ")");
  
  if (phRaw == 0 || phRaw == 4095) {
    Serial.println("⚠️  pH semble déconnecté");
  }
  if (turbRaw == 0 || turbRaw == 4095) {
    Serial.println("⚠️  Turbidité semble déconnectée");
  }
}

void testButton() {
  Serial.println("\nTEST Bouton SOS...");
  Serial.println("Appuyez sur le bouton SOS dans les 5 secondes...");
  
  unsigned long start = millis();
  bool pressed = false;
  
  while (millis() - start < 5000) {
    if (digitalRead(SOS_BUTTON) == LOW) {
      Serial.println("✅ Bouton SOS OK - Détecté!");
      digitalWrite(LED_STATUS, HIGH);
      pressed = true;
      break;
    }
    delay(100);
  }
  
  if (!pressed) {
    Serial.println("⚠️  Bouton SOS non appuyé");
  }
  digitalWrite(LED_STATUS, LOW);
}
```

---

## 📞 Support

**En cas de problème:**
- 📧 Email: support@proj-iot.com
- 📖 Documentation: [WIRING_DIAGRAMS.md](./WIRING_DIAGRAMS.md)
- 🐛 Issues: [GitHub](https://github.com/DONZO-sigui/Projet-IOT/issues)

---

<div align="center">

**Guide d'Installation Rapide - Version 1.0**  
*Dernière mise à jour: 2026-01-16*

✅ **Suivez les étapes dans l'ordre pour une installation réussie!**

</div>
