# 🚨 Guide Rapide - Tester le Système d'Alertes

## Méthode 1 : Script Automatique (Recommandé)

### Étape 1 : Assurez-vous que le serveur tourne
```bash
npm run dev
```

### Étape 2 : Lancez le script de test
```bash
node scripts/test-alerts.js
```

Ce script va :
- ✅ Utiliser les bateaux et zones existants
- ✅ Générer 3 positions GPS de test
- ✅ Créer automatiquement des alertes
- ✅ Afficher les statistiques

## Méthode 2 : Interface Web (Manuel)

### Étape 1 : Créer une zone interdite
1. Allez sur http://localhost:3000/admin/zones
2. Cliquez sur "Nouvelle Zone"
3. Remplissez :
   - **Nom** : Zone Test
   - **Type** : `prohibited` (interdite)
   - **Description** : Zone de test pour alertes
4. Sur la carte, cliquez pour créer un cercle ou polygone
5. Sauvegardez

### Étape 2 : Simuler une position GPS
1. Allez sur http://localhost:3000/admin/gps-tracking
2. Sélectionnez un bateau
3. Cliquez sur "Ajouter Position Manuelle"
4. Placez le marqueur **DANS la zone interdite**
5. Validez

### Étape 3 : Voir l'alerte
1. Allez sur http://localhost:3000/admin/alertes
2. Vous verrez l'alerte générée avec :
   - Badge rouge "CRITICAL"
   - Message détaillé
   - Position GPS
   - Bouton "Acquitter"

## Méthode 3 : Console du Navigateur

Ouvrez la console (F12) sur n'importe quelle page admin et exécutez :

```javascript
// Remplacez boatId par l'ID d'un bateau existant
fetch('/api/boats/positions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    boatId: 1,  // ← Changez cet ID
    latitude: 9.52,
    longitude: -13.68,
    speed: 10
  })
})
.then(r => r.json())
.then(data => {
  console.log('✅ Position enregistrée');
  if (data.alerts) {
    console.log('🚨 Alertes:', data.alerts);
  }
});
```

Puis rafraîchissez la page `/admin/alertes` pour voir l'alerte.

## Vérifier les Alertes

### Dashboard
http://localhost:3000/admin/dashboard
- Le compteur "Alertes Actives" s'incrémente
- Badge rouge si alertes critiques

### Page Alertes
http://localhost:3000/admin/alertes
- Liste complète avec filtres
- Statistiques en temps réel
- Bouton "Acquitter" pour chaque alerte

### GPS Tracking
http://localhost:3000/admin/gps-tracking
- Voir les bateaux sur la carte
- Voir les zones colorées
- Voir les positions qui ont déclenché des alertes

## Types d'Alertes Générées

| Type | Déclencheur | Sévérité |
|------|-------------|----------|
| `zone_violation` | Bateau dans zone interdite | `critical` (rouge) |
| `zone_violation` | Bateau dans zone protégée | `warning` (orange) |
| `drift_warning` | Bateau hors zones autorisées | `warning` (orange) |

## Acquitter une Alerte

1. Allez sur `/admin/alertes`
2. Trouvez l'alerte
3. Cliquez sur "Acquitter"
4. L'alerte passe en "Résolue" (grisée)

## Troubleshooting

### "Aucun bateau trouvé"
Créez un bateau sur `/admin/gps-tracking` → Onglet "Bateaux"

### "Aucune zone trouvée"
Créez une zone sur `/admin/zones`

### "Aucune alerte générée"
Vérifiez que :
- La position GPS est **dans** une zone interdite/protégée
- OU la position est **hors** de toutes les zones autorisées
- Le bateau existe dans la base de données

### Script ne fonctionne pas
Assurez-vous que :
- Le serveur tourne (`npm run dev`)
- Vous êtes dans le bon dossier
- Node.js est installé

## Prochaines Étapes

1. ✅ Tester avec le script automatique
2. ✅ Créer vos propres zones
3. ✅ Simuler des positions GPS
4. ✅ Voir les alertes en temps réel
5. ✅ Acquitter les alertes

**Bon test ! 🚀**
