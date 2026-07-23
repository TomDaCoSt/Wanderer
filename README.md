# 🗺️ Wanderer — Guide d'utilisation du format JSON

Ce guide explique comment exporter, importer et générer vos données de voyage au format **JSON** dans l'application Wanderer, tout en conservant la synchronisation Cloud automatique sur tous vos appareils.

---

## 🚀 1. Comment utiliser l'Export et l'Import

Sur le **Dashboard** principal de l'application (en haut à droite, à côté de *Modifier*) :

### 📄 Exporter vos données (`Export JSON`)
1. Clique sur le bouton bleu **`Export`**.
2. Un fichier nommé `voyage_[nom_du_voyage]_[date].json` est immédiatement téléchargé sur ton appareil.
3. Ce fichier contient l'intégralité des informations de ton voyage actif (hébergements, vols, planning, budget, etc.).

### 📥 Importer un voyage (`Import JSON`)
1. Clique sur le bouton vert **`Import`**.
2. Sélectionne ton fichier `.json` sur ton ordinateur ou téléphone.
3. Confirme l'importation.
4. **Synchronisation automatique** : les données sont immédiatement appliquées à ton projet actif et sauvegardées sur la base distante (Upstash Redis). Tous tes appareils connectés recevront la mise à jour !

---

## 🤖 2. Génération automatique de voyage par IA

Si tu organises un nouveau voyage ou que tu as des notes textuelles brutes (emails de réservation, brouillons, plannings), tu peux simplement donner ton texte à l'IA (dans le chat) avec cette consigne :

> *"Voici les détails de mon voyage. Génère-moi le fichier JSON compatible avec Wanderer :"*

L'IA te donnera le JSON structuré complet. Tu n'auras plus qu'à enregistrer ce texte dans un fichier `.json` et l'importer en un clic !

---

## 📋 3. Structure complète du fichier JSON

Voici un exemple type réutilisable pour structurer un projet :

```json
{
  "version": 2,
  "trip": {
    "name": "Voyage Japon 2027",
    "startDate": "2027-03-15",
    "endDate": "2027-04-02"
  },
  "settings": {
    "jpyRate": 162.5,
    "homeCurrency": "EUR",
    "budget": 4500
  },
  "cities": ["Tokyo", "Kyoto", "Osaka", "Nara"],
  "flights": [
    {
      "id": "flight-1",
      "flightNumber": "AF274",
      "airline": "Air France",
      "fromCity": "Paris",
      "fromAirport": "CDG",
      "toCity": "Tokyo",
      "toAirport": "HND",
      "departure": "2027-03-15T10:30:00",
      "arrival": "2027-03-16T06:15:00",
      "status": "confirmé",
      "price": 950
    }
  ],
  "trains": [
    {
      "id": "train-1",
      "type": "Shinkansen",
      "from": "Tokyo",
      "to": "Kyoto",
      "date": "2027-03-22",
      "departureTime": "09:00",
      "seat": "Car 5, Siège 12A"
    }
  ],
  "accommodations": [
    {
      "id": "acc-1",
      "name": "Hotel Gracery Shinjuku",
      "city": "Tokyo",
      "address": "Kabukicho 1-19-1, Shinjuku",
      "checkIn": "2027-03-16",
      "checkOut": "2027-03-22",
      "price": 720,
      "currency": "EUR",
      "status": "réservé"
    }
  ],
  "itinerary": [
    {
      "date": "2027-03-17",
      "city": "Tokyo",
      "emoji": "🗼",
      "events": [
        {
          "id": "evt-1",
          "time": "10:00",
          "title": "Visite du sanctuaire Meiji Jingu",
          "notes": "Arriver tôt pour éviter la foule",
          "mapsUrl": "https://maps.google.com"
        }
      ]
    }
  ],
  "activities": [
    {
      "id": "act-1",
      "title": "TeamLab Planets",
      "city": "Tokyo",
      "category": "Incontournable",
      "status": "planned",
      "cost": 35,
      "notes": "Billets réservés à l'avance"
    }
  ],
  "expenses": [
    {
      "id": "exp-1",
      "category": "Vol",
      "description": "Vols AR Air France",
      "amount": 950,
      "currency": "EUR"
    }
  ],
  "documents": [],
  "emergencyNumbers": []
}
```

---

## 🔐 4. Authentification & Base Cloud (Configuration Vercel)

- **Variables requises sur Vercel** :
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `GOOGLE_REDIRECT_URI` (`https://<votre-domaine>.vercel.app/api/auth/google/callback`)
  - `SESSION_SECRET` (Clef HMAC)
  - `UPSTASH_REDIS_REST_URL`
  - `UPSTASH_REDIS_REST_TOKEN`