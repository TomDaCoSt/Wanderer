/* =====================================================
   DATA.JS — localStorage CRUD + Default Travel Data
   Japan Travel Dashboard
   ===================================================== */

const STORAGE_KEY = 'voyage_japon_data';

// =====================================================
// DEFAULT SAMPLE DATA
// =====================================================
const DEFAULT_DATA = {
  version: 2,
  trip: {
    name: 'Voyage Japon 2026',
    startDate: '2026-07-28',
    endDate:   '2026-08-20',
  },
  settings: {
    jpyRate:      162.5,
    homeCurrency: 'EUR',
    budget:       4000,
  },
  cities: ['Tokyo', 'Fujinomiya', 'Fujiyoshida', 'Nagano', 'Kyoto'],

  flights: [
    {
      id: 'f1',
      direction: 'aller',
      airline: 'Air France',
      flightNumber: 'AF275',
      fromCity: 'Paris', fromAirport: 'CDG', fromTerminal: '2E',
      toCity: 'Tokyo',  toAirport: 'HND', toTerminal: '3',
      departure: '2026-07-28T11:15',
      arrival:   '2026-07-29T07:35',
      status: 'confirmed',
      notes: 'Siège 34A côté fenêtre. Repas végétarien commandé.',
    },
    {
      id: 'f2',
      direction: 'retour',
      airline: 'Air France',
      flightNumber: 'AF274',
      fromCity: 'Tokyo', fromAirport: 'HND', fromTerminal: '3',
      toCity:  'Paris',  toAirport: 'CDG',  toTerminal: '2E',
      departure: '2026-08-20T09:10',
      arrival:   '2026-08-20T15:40',
      status: 'confirmed',
      notes: 'Aéroport à rejoindre depuis le centre de Tokyo en 45 min via Keikyu.',
    },
  ],

  trains: [
    {
      id: 't1',
      from: 'Tokyo', to: 'Fujinomiya',
      date: '2026-08-01',
      departureTime: '09:30', arrivalTime: '11:45',
      trainName: 'JR Shinkansen + Local', passCovered: true,
      notes: 'Changement à Shizuoka ou Mishima.',
    },
    {
      id: 't2',
      from: 'Fujinomiya', to: 'Fujiyoshida',
      date: '2026-08-02',
      departureTime: '11:00', arrivalTime: '12:30',
      trainName: 'Bus / Train Fuji', passCovered: false,
      notes: 'Liaison région des 5 lacs.',
    },
    {
      id: 't3',
      from: 'Nagano', to: 'Kyoto',
      date: '2026-08-08',
      departureTime: '10:00', arrivalTime: '13:00',
      trainName: 'Shinkansen', passCovered: true,
      notes: 'Trajet vers Kyoto.',
    },
  ],

  accommodations: [
    {
      id: 'a1',
      name: 'COTO Tokyo',
      city: 'Tokyo (Sumida)',
      address: '1-chōme-52-6 Oshiage, Sumida City, Tokyo 131-0045',
      lat: 35.7107, lng: 139.8130,
      checkIn: '2026-07-28', checkOut: '2026-07-31',
      pricePerNight: 119.71, currency: 'EUR',
      bookingRef: 'HMKC83JSCF',
      accessInfo: 'Check-in: 16:00 | Check-out: 11:00',
      notes: 'Prix total: 359,12 € (3 nuits)',
      color: '#e94560',
    },
    {
      id: 'a2',
      name: 'KIKUSUI (掬水) — Suruganoma',
      city: 'Fujinomiya',
      address: '22-3, Motoshirochō, Fujinomiya, Shizuoka 418-0064',
      lat: 35.2238, lng: 138.6148,
      checkIn: '2026-08-01', checkOut: '2026-08-02',
      pricePerNight: 99.54, currency: 'EUR',
      bookingRef: 'HMZJ3SHF33',
      accessInfo: 'Check-in: 16:00 | Check-out: 11:00',
      notes: 'Prix total: 99,54 € (1 nuit)',
      color: '#3b82f6',
    },
    {
      id: 'a3',
      name: '西裏ステイ なか富士 (Nishiura Stay Nakafuji)',
      city: 'Fujiyoshida',
      address: '3-chōme-17-3 Shimoyoshida, Fujiyoshida, Yamanashi 403-0004',
      lat: 35.4935, lng: 138.8038,
      checkIn: '2026-08-02', checkOut: '2026-08-03',
      pricePerNight: 82.70, currency: 'EUR',
      bookingRef: 'HMQYT3W32W',
      accessInfo: 'Check-in: 15:00 | Check-out: 10:00',
      notes: 'Prix total: 82,70 € (1 nuit)',
      color: '#22c55e',
    },
    {
      id: 'a4',
      name: 'MIRAI PORT NAGANO 405',
      city: 'Nagano',
      address: 'Nagano City, Nagano',
      lat: 36.6485, lng: 138.1942,
      checkIn: '2026-08-03', checkOut: '2026-08-04',
      pricePerNight: 0, currency: 'EUR',
      bookingRef: 'À préciser',
      accessInfo: 'Check-in: 15:00 | Check-out: 11:00',
      notes: 'Adresse précise non mentionnée dans la confirmation',
      color: '#f5a623',
    },
    {
      id: 'a5',
      name: 'Minn Kiyomizu Gojo',
      city: 'Kyoto',
      address: '4-432-6 Gojobashi Higashi, Higashiyama-ku, Kyoto 605-0846',
      lat: 34.9960, lng: 135.7725,
      checkIn: '2026-08-08', checkOut: '2026-08-09',
      pricePerNight: 79.90, currency: 'EUR',
      bookingRef: 'HMHTEJ83J8',
      accessInfo: 'Check-in: 15:00 | Check-out: 11:00',
      notes: 'Prix total: 79,90 € (1 nuit)',
      color: '#8b5cf6',
    },
    {
      id: 'a6',
      name: 'Voyan Hotels (301)',
      city: 'Tokyo (Minato)',
      address: '3-chōme-6-25 Takanawa, Minato City, Tokyo 108-0074',
      lat: 35.6338, lng: 139.7360,
      checkIn: '2026-08-16', checkOut: '2026-08-20',
      pricePerNight: 83.65, currency: 'EUR',
      bookingRef: 'HMJCEND3AE',
      accessInfo: 'Check-in: 16:00 | Check-out: 11:00',
      notes: 'Prix total: 334,60 € (4 nuits)',
      color: '#ec4899',
    },
  ],

  itinerary: [
    {
      date: '2026-09-01',
      city: 'Paris',
      emoji: '🛫',
      events: [
        { id: 'e-1-1', time: '08:00', title: 'Départ pour CDG', type: 'transport', notes: 'RER B depuis Châtelet', mapsUrl: 'https://maps.google.com/?q=Paris+Charles+de+Gaulle+Airport' },
        { id: 'e-1-2', time: '11:15', title: 'Vol AF275 → Tokyo', type: 'transport', notes: 'Terminal 2E, embarquement à 10h30', mapsUrl: '' },
      ],
    },
    {
      date: '2026-09-02',
      city: 'Tokyo',
      emoji: '🗼',
      events: [
        { id: 'e-2-1', time: '07:35', title: 'Arrivée à HND', type: 'transport', notes: 'Immigration, récupérer SIM card & JR Pass', mapsUrl: 'https://maps.google.com/?q=Tokyo+Haneda+Airport' },
        { id: 'e-2-2', time: '10:00', title: 'Check-in Shinjuku Granbell', type: 'accom', notes: 'Dépôt des bagages si chambre pas prête', mapsUrl: 'https://maps.google.com/?q=Shinjuku+Granbell+Hotel+Tokyo' },
        { id: 'e-2-3', time: '14:00', title: 'Promenade Shinjuku', type: 'activity', notes: 'Se réadapter au décalage horaire doucement', mapsUrl: 'https://maps.google.com/?q=Shinjuku+Tokyo' },
        { id: 'e-2-4', time: '19:00', title: 'Dîner Ramen Ichiran', type: 'food', notes: 'Ramen solitaire dans une cabine individuelle', mapsUrl: 'https://maps.google.com/?q=Ichiran+Ramen+Shinjuku' },
      ],
    },
    {
      date: '2026-09-03',
      city: 'Tokyo',
      emoji: '🗼',
      events: [
        { id: 'e-3-1', time: '06:30', title: 'Senso-ji Temple (tôt)', type: 'activity', notes: 'Arriver avant la foule pour les photos', mapsUrl: 'https://maps.google.com/?q=Sensoji+Temple+Asakusa' },
        { id: 'e-3-2', time: '10:00', title: 'Marché de Tsukiji', type: 'food', notes: 'Sushi du matin et street food', mapsUrl: 'https://maps.google.com/?q=Tsukiji+Market+Tokyo' },
        { id: 'e-3-3', time: '14:00', title: 'Akihabara', type: 'activity', notes: 'Culture geek & électronique', mapsUrl: 'https://maps.google.com/?q=Akihabara+Tokyo' },
        { id: 'e-3-4', time: '18:00', title: 'Shibuya Crossing', type: 'activity', notes: 'Voir le croisement emblématique en soirée', mapsUrl: 'https://maps.google.com/?q=Shibuya+Crossing+Tokyo' },
      ],
    },
    {
      date: '2026-09-07',
      city: 'Kyoto',
      emoji: '⛩️',
      events: [
        { id: 'e-7-1', time: '09:33', title: 'Shinkansen Tokyo → Kyoto', type: 'transport', notes: 'Nozomi 15, voiture 3', mapsUrl: '' },
        { id: 'e-7-2', time: '12:00', title: 'Check-in Ryokan Gion', type: 'accom', notes: 'Expérience tatami & yukata', mapsUrl: 'https://maps.google.com/?q=Gion+Kyoto' },
        { id: 'e-7-3', time: '15:00', title: 'Fushimi Inari (après-midi)', type: 'activity', notes: 'Torii gates dorés en fin de journée', mapsUrl: 'https://maps.google.com/?q=Fushimi+Inari+Kyoto' },
      ],
    },
    {
      date: '2026-09-08',
      city: 'Kyoto',
      emoji: '⛩️',
      events: [
        { id: 'e-8-1', time: '08:00', title: 'Kinkaku-ji (Pavillon d\'Or)', type: 'activity', notes: 'Arriver tôt avant les groupes', mapsUrl: 'https://maps.google.com/?q=Kinkakuji+Kyoto' },
        { id: 'e-8-2', time: '11:00', title: 'Bambouseraie Arashiyama', type: 'activity', notes: '30 min de train depuis le centre', mapsUrl: 'https://maps.google.com/?q=Arashiyama+Bamboo+Grove+Kyoto' },
        { id: 'e-8-3', time: '14:00', title: 'Marché Nishiki', type: 'food', notes: '"La cuisine de Kyoto" — snacks à gogo', mapsUrl: 'https://maps.google.com/?q=Nishiki+Market+Kyoto' },
      ],
    },
    {
      date: '2026-09-12',
      city: 'Osaka',
      emoji: '🏯',
      events: [
        { id: 'e-12-1', time: '14:10', title: 'Shinkansen Kyoto → Osaka', type: 'transport', notes: 'Hikari, 18 min de trajet', mapsUrl: '' },
        { id: 'e-12-2', time: '15:30', title: 'Check-in Cross Hotel', type: 'accom', notes: 'Quartier Shinsaibashi', mapsUrl: 'https://maps.google.com/?q=Cross+Hotel+Osaka' },
        { id: 'e-12-3', time: '18:00', title: 'Dotonbori en soirée', type: 'food', notes: 'Takoyaki, Okonomiyaki, néons ! 🦑', mapsUrl: 'https://maps.google.com/?q=Dotonbori+Osaka' },
      ],
    },
  ],

  activities: [
    // Tokyo
    { id: 'act-1',  city: 'Tokyo',  name: 'Senso-ji Temple',         category: 'Culture',  status: 'todo',     priority: 'must',     notes: 'Arriver avant 7h pour photos sans foule',    estimatedCost: 0,    mapsUrl: 'https://maps.google.com/?q=Sensoji+Temple+Tokyo',   lat: 35.7147, lng: 139.7966 },
    { id: 'act-2',  city: 'Tokyo',  name: 'Shibuya Crossing',        category: 'Activity', status: 'todo',     priority: 'must',     notes: 'Voir en soirée depuis le Starbucks du 2ème',  estimatedCost: 0,    mapsUrl: 'https://maps.google.com/?q=Shibuya+Crossing+Tokyo', lat: 35.6595, lng: 139.7004 },
    { id: 'act-3',  city: 'Tokyo',  name: 'teamLab Borderless',      category: 'Activity', status: 'todo',     priority: 'must',     notes: 'Réserver en ligne. ~1h30 de visite',          estimatedCost: 3200, mapsUrl: 'https://maps.google.com/?q=teamLab+Borderless+Tokyo', lat: 35.6267, lng: 139.7756 },
    { id: 'act-4',  city: 'Tokyo',  name: 'Shinjuku Gyoen',          category: 'Nature',   status: 'todo',     priority: 'should',   notes: 'Grand parc arboré. Ouvert 9h-16h.',           estimatedCost: 500,  mapsUrl: 'https://maps.google.com/?q=Shinjuku+Gyoen+Tokyo',  lat: 35.6852, lng: 139.7099 },
    { id: 'act-5',  city: 'Tokyo',  name: 'Tsukiji Market',          category: 'Food',     status: 'todo',     priority: 'must',     notes: 'Sushi du matin ! Y aller tôt (6h-10h).',      estimatedCost: 2000, mapsUrl: 'https://maps.google.com/?q=Tsukiji+Market+Tokyo',  lat: 35.6655, lng: 139.7707 },
    { id: 'act-6',  city: 'Tokyo',  name: 'Meiji Shrine',            category: 'Culture',  status: 'todo',     priority: 'should',   notes: 'Sanctuaire dans la forêt en plein Tokyo.',    estimatedCost: 0,    mapsUrl: 'https://maps.google.com/?q=Meiji+Shrine+Tokyo',    lat: 35.6763, lng: 139.6993 },
    { id: 'act-7',  city: 'Tokyo',  name: 'Akihabara',               category: 'Shopping', status: 'todo',     priority: 'should',   notes: 'Rétrogaming, anime, électronique.',            estimatedCost: 5000, mapsUrl: 'https://maps.google.com/?q=Akihabara+Tokyo',       lat: 35.6987, lng: 139.7741 },
    { id: 'act-8',  city: 'Tokyo',  name: 'Odaiba',                  category: 'Activity', status: 'optional', priority: 'optional', notes: 'Île artificielle avec vue sur la baie.',       estimatedCost: 0,    mapsUrl: 'https://maps.google.com/?q=Odaiba+Tokyo',          lat: 35.6274, lng: 139.7756 },
    { id: 'act-9',  city: 'Tokyo',  name: 'Harajuku Takeshita Street',category: 'Shopping',status: 'optional', priority: 'optional', notes: 'Mode alternative et street food sucrée.',      estimatedCost: 2000, mapsUrl: 'https://maps.google.com/?q=Harajuku+Takeshita+Street', lat: 35.6715, lng: 139.7027 },
    // Kyoto
    { id: 'act-10', city: 'Kyoto',  name: 'Fushimi Inari Taisha',   category: 'Culture',  status: 'todo',     priority: 'must',     notes: '10 000 torii. Randonnée 2h aller-retour.',    estimatedCost: 0,    mapsUrl: 'https://maps.google.com/?q=Fushimi+Inari+Shrine+Kyoto', lat: 34.9671, lng: 135.7727 },
    { id: 'act-11', city: 'Kyoto',  name: 'Kinkaku-ji',             category: 'Culture',  status: 'todo',     priority: 'must',     notes: 'Pavillon d\'Or — arriver dès l\'ouverture.',   estimatedCost: 500,  mapsUrl: 'https://maps.google.com/?q=Kinkakuji+Kyoto',       lat: 35.0394, lng: 135.7292 },
    { id: 'act-12', city: 'Kyoto',  name: 'Bambouseraie Arashiyama',category: 'Nature',   status: 'todo',     priority: 'must',     notes: 'Mieux tôt le matin. Train JR Saga-Arashiyama.',estimatedCost: 0,    mapsUrl: 'https://maps.google.com/?q=Arashiyama+Bamboo+Grove', lat: 35.0168, lng: 135.6775 },
    { id: 'act-13', city: 'Kyoto',  name: 'Marché Nishiki',         category: 'Food',     status: 'todo',     priority: 'should',   notes: 'Tofu, yuzu, dango et street food Kyoto.',     estimatedCost: 2000, mapsUrl: 'https://maps.google.com/?q=Nishiki+Market+Kyoto',  lat: 35.0042, lng: 135.7668 },
    { id: 'act-14', city: 'Kyoto',  name: 'Quartier Gion (Geisha)', category: 'Culture',  status: 'todo',     priority: 'should',   notes: 'Hanamikoji Street en fin d\'après-midi.',      estimatedCost: 0,    mapsUrl: 'https://maps.google.com/?q=Gion+Kyoto',            lat: 35.0039, lng: 135.7744 },
    { id: 'act-15', city: 'Kyoto',  name: 'Chemin du Philosophe',   category: 'Nature',   status: 'optional', priority: 'optional', notes: 'Balade le long du canal. ~2km.',               estimatedCost: 0,    mapsUrl: 'https://maps.google.com/?q=Philosophers+Path+Kyoto', lat: 35.0247, lng: 135.7936 },
    // Nara
    { id: 'act-16', city: 'Nara',   name: 'Parc aux Daims',         category: 'Nature',   status: 'todo',     priority: 'must',     notes: 'Biscuits shika senbei pour nourrir les daims.', estimatedCost: 200,  mapsUrl: 'https://maps.google.com/?q=Nara+Deer+Park',        lat: 34.6818, lng: 135.8447 },
    { id: 'act-17', city: 'Nara',   name: 'Tōdai-ji Temple',        category: 'Culture',  status: 'todo',     priority: 'must',     notes: 'Énorme Bouddha en bronze à l\'intérieur.',     estimatedCost: 600,  mapsUrl: 'https://maps.google.com/?q=Todaiji+Temple+Nara',   lat: 34.6888, lng: 135.8398 },
    // Osaka
    { id: 'act-18', city: 'Osaka',  name: 'Dotonbori',              category: 'Food',     status: 'todo',     priority: 'must',     notes: 'Glico, takoyaki, street food. Y aller le soir.', estimatedCost: 2500, mapsUrl: 'https://maps.google.com/?q=Dotonbori+Osaka',       lat: 34.6687, lng: 135.5011 },
    { id: 'act-19', city: 'Osaka',  name: 'Château d\'Osaka',       category: 'Culture',  status: 'todo',     priority: 'should',   notes: 'Belle vue depuis le dernier étage.',           estimatedCost: 600,  mapsUrl: 'https://maps.google.com/?q=Osaka+Castle',          lat: 34.6873, lng: 135.5262 },
    { id: 'act-20', city: 'Osaka',  name: 'Kuromon Market',         category: 'Food',     status: 'todo',     priority: 'should',   notes: '"La cuisine d\'Osaka" — fruits de mer frais.', estimatedCost: 3000, mapsUrl: 'https://maps.google.com/?q=Kuromon+Market+Osaka',  lat: 34.6695, lng: 135.5065 },
    { id: 'act-21', city: 'Osaka',  name: 'Universal Studios Japan',category: 'Activity', status: 'optional', priority: 'optional', notes: 'Harry Potter World ! Réserver tôt.',           estimatedCost: 8500, mapsUrl: 'https://maps.google.com/?q=Universal+Studios+Japan+Osaka', lat: 34.6654, lng: 135.4324 },
  ],

  expenses: [
    { id: 'ex-1', date: '2026-09-02', description: 'Ramen Ichiran',         amount: 1200, currency: 'JPY', category: 'Food',      city: 'Tokyo'  },
    { id: 'ex-2', date: '2026-09-02', description: 'Metro 1-day pass',      amount: 800,  currency: 'JPY', category: 'Transport', city: 'Tokyo'  },
    { id: 'ex-3', date: '2026-09-03', description: 'Entrée teamLab',        amount: 3200, currency: 'JPY', category: 'Activity',  city: 'Tokyo'  },
    { id: 'ex-4', date: '2026-09-03', description: 'Sushi Tsukiji',         amount: 2800, currency: 'JPY', category: 'Food',      city: 'Tokyo'  },
    { id: 'ex-5', date: '2026-09-04', description: 'Souvenirs Senso-ji',    amount: 4500, currency: 'JPY', category: 'Shopping',  city: 'Tokyo'  },
    { id: 'ex-6', date: '2026-09-08', description: 'Entrée Kinkaku-ji',     amount: 500,  currency: 'JPY', category: 'Activity',  city: 'Kyoto'  },
    { id: 'ex-7', date: '2026-09-08', description: 'Déjeuner Marché Nishiki',amount: 2200, currency: 'JPY', category: 'Food',     city: 'Kyoto'  },
    { id: 'ex-8', date: '2026-09-13', description: 'Dotonbori street food', amount: 2500, currency: 'JPY', category: 'Food',      city: 'Osaka'  },
  ],

  documents: [
    {
      id: 'doc-1',
      title: 'Visit Japan Web',
      type: 'url',
      content: 'https://vjw-lp.digital.go.jp/',
      notes: 'Enregistrement immigration japonaise — à présenter à l\'aéroport.',
    },
    {
      id: 'doc-2',
      title: 'JR Pass — N° de référence',
      type: 'text',
      content: 'JRPASS-2026-FR-782945',
      notes: 'Pass 21 jours valide du 02/09 au 22/09. À échanger au guichet JR.',
    },
    {
      id: 'doc-3',
      title: 'Réservation Ryokan Kyoto',
      type: 'url',
      content: 'https://www.hatanaka.co.jp/confirmation/RYO-48291',
      notes: 'Ryokan Gion Hatanaka — Réf: RYO-48291. Check-in 16h.',
    },
    {
      id: 'doc-4',
      title: 'Assurance voyage N°',
      type: 'text',
      content: 'AXA-TRAVEL-2026-FR-449201',
      notes: 'Assistance 24h/24 : +33 1 55 92 42 42',
    },
  ],

  emergencyNumbers: [
    { id: 'em-1', label: 'Police',        number: '110', icon: '👮' },
    { id: 'em-2', label: 'Pompiers/SAMU', number: '119', icon: '🚑' },
    { id: 'em-3', label: 'Ambassade FR',  number: '+81-3-5798-6000', icon: '🏛️' },
    { id: 'em-4', label: 'Assistance AXA',number: '+33 1 55 92 42 42', icon: '🆘' },
  ],

  rentals: [
    {
      id: 'car-1',
      agency: 'Toyota Rent a Car',
      company: 'Toyota',
      model: 'Yaris Hybrid / Compacte',
      pickupLocation: 'Tokyo / Hakone Agency',
      pickupDate: '2026-09-05T09:00',
      dropoffLocation: 'Gare de Kyoto Hachijo',
      dropoffDate: '2026-09-07T18:00',
      bookingRef: 'TRC-982145',
      cost: 24000,
      currency: 'JPY',
      etcCardIncluded: true,
      driverName: 'Chauffeur principal',
      licenseRequirement: 'Permis International 1949 (ou Traduction JAF si permis FR)',
      notes: 'Carte ETC (télépéage) demandée. Conduite à gauche au Japon 🚗💨',
      mapsUrl: 'https://maps.google.com/?q=Toyota+Rent+a+Car',
    },
  ],
};

// =====================================================
// DATA LAYER — localStorage CRUD
// =====================================================

/** Load data from localStorage, falling back to defaults */
export function loadData() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Auto-migrate if version is outdated or missing
      if (parsed.version === DEFAULT_DATA.version) {
        return parsed;
      }
    }
  } catch (e) { /* ignore parse errors */ }

  // Save new default data if version upgraded or missing
  const freshData = JSON.parse(JSON.stringify(DEFAULT_DATA));
  saveData(freshData);
  return freshData;
}

/** Save entire data object to localStorage and trigger cloud sync */
export function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  pushToCloud(data);
}

/** Reset to default data */
export function resetData() {
  localStorage.removeItem(STORAGE_KEY);
  const fresh = JSON.parse(JSON.stringify(DEFAULT_DATA));
  saveData(fresh);
  return fresh;
}

// =====================================================
// REAL-TIME FREE CLOUD SYNC MODULE (jsonblob API)
// =====================================================
const SYNC_CODE_KEY = 'voyage_sync_code';
const API_BASE      = 'https://jsonblob.com/api/jsonBlob';

export function getSyncCode() {
  let code = localStorage.getItem(SYNC_CODE_KEY);
  if (!code) {
    code = 'JAPON-2026-' + Math.random().toString(36).substring(2, 7).toUpperCase();
    localStorage.setItem(SYNC_CODE_KEY, code);
  }
  return code;
}

export function setSyncCode(newCode) {
  const formatted = newCode.trim().toUpperCase();
  localStorage.setItem(SYNC_CODE_KEY, formatted);
  return formatted;
}

/** Push current appData to the Cloud */
export async function pushToCloud(data) {
  try {
    const code = getSyncCode();
    const blobIdKey = 'voyage_blob_id_' + code;
    let blobId = localStorage.getItem(blobIdKey);

    if (blobId) {
      const res = await fetch(`${API_BASE}/${blobId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) return true;
    }

    // Create new blob if none exists or update failed
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      const location = res.headers.get('Location');
      if (location) {
        const newBlobId = location.split('/').pop();
        localStorage.setItem(blobIdKey, newBlobId);
        return true;
      }
    }
  } catch (e) {
    console.warn('Cloud sync push error:', e);
  }
  return false;
}

/** Pull latest appData from the Cloud */
export async function pullFromCloud() {
  try {
    const code = getSyncCode();
    const blobIdKey = 'voyage_blob_id_' + code;
    const blobId = localStorage.getItem(blobIdKey);
    if (!blobId) return null;

    const res = await fetch(`${API_BASE}/${blobId}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.trip) return data;
    }
  } catch (e) {
    console.warn('Cloud sync pull error:', e);
  }
  return null;
}

/** Generate a short unique ID */
export function genId(prefix = 'id') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ---- Generic entity CRUD helpers ---- //

/** Add an item to an array field */
export function addItem(data, field, item) {
  if (!data[field]) data[field] = [];
  data[field].push({ ...item, id: item.id || genId(field) });
  saveData(data);
}

/** Update an item by id in an array field */
export function updateItem(data, field, id, updates) {
  const idx = data[field].findIndex(i => i.id === id);
  if (idx !== -1) data[field][idx] = { ...data[field][idx], ...updates };
  saveData(data);
}

/** Delete an item by id from an array field */
export function deleteItem(data, field, id) {
  data[field] = data[field].filter(i => i.id !== id);
  saveData(data);
}

/** Find an item by id in an array field */
export function findItem(data, field, id) {
  return (data[field] || []).find(i => i.id === id);
}

// ---- Itinerary event helpers ---- //

export function addItineraryEvent(data, date, event) {
  let day = data.itinerary.find(d => d.date === date);
  if (!day) {
    day = { date, city: '', emoji: '📅', events: [] };
    data.itinerary.push(day);
    data.itinerary.sort((a, b) => a.date.localeCompare(b.date));
  }
  if (!day.events) day.events = [];
  day.events.push({ ...event, id: event.id || genId('evt') });
  day.events.sort((a, b) => a.time.localeCompare(b.time));
  saveData(data);
}

export function updateItineraryDay(data, date, updates) {
  const day = data.itinerary.find(d => d.date === date);
  if (day) Object.assign(day, updates);
  saveData(data);
}

export function deleteItineraryDay(data, date) {
  data.itinerary = data.itinerary.filter(d => d.date !== date);
  saveData(data);
}

export function updateItineraryEvent(data, date, eventId, updates) {
  const day = data.itinerary.find(d => d.date === date);
  if (!day) return;
  const idx = day.events.findIndex(e => e.id === eventId);
  if (idx !== -1) day.events[idx] = { ...day.events[idx], ...updates };
  saveData(data);
}

export function deleteItineraryEvent(data, date, eventId) {
  const day = data.itinerary.find(d => d.date === date);
  if (day) day.events = day.events.filter(e => e.id !== eventId);
  saveData(data);
}
