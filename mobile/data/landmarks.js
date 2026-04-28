const PLACEHOLDER = require('../assets/jounieh-guide.jpg');

export const LANDMARKS = [
  {
    id: 'jeita-grotto',
    type: 'sightseeing',
    name: 'Jeita Grotto',
    subtitle: 'Limestone caves & underground river',
    distance: '5 km',
    image: require('../assets/guide/jeita_grotto.jpg'),
    description:
      'Two magnificent grottoes burrow deep into the earth within a beautiful green valley. A river flows between the rocks inside the mountain, with stunning stone draperies and natural wonders that have been forming for thousands of years.',
    bullets: ['5 km from the hotel'],
    address: 'Jeita, Mount Lebanon',
    phone: null,
    website: 'https://www.jeitagrotto.com/',
  },
  {
    id: 'casino-du-liban',
    type: 'sightseeing',
    name: 'Casino Du Liban',
    subtitle: 'The most famous Casino in the Middle East',
    distance: '5 km',
    image: require('../assets/guide/casino_du_liban.jpg'),
    description:
      'The most famous Casino in the Middle East, in Maameltein, Jounieh. 35,000 m² of gaming space, around 400 slot machines and 60 gaming tables, and a rich history of hosting heads of state, royalty, and Hollywood legends.',
    bullets: ['5 km from the hotel'],
    address: 'Maameltein, Jounieh',
    website: 'https://www.cdl.com.lb/',
  },
  {
    id: 'jounieh-district',
    type: 'sightseeing',
    name: 'Jounieh District',
    subtitle: 'Coastal town · Resorts, cafes & nightlife',
    distance: 'Walking distance',
    image: require('../assets/guide/jounieh.jpg'),
    description:
      'Between Beirut and Byblos, the coastal town of Jounieh has a spectacular bay with mountains rising behind it. Seaside resorts, cafes, bustling nightlife, an old stone souk, ferry port, and the famous cable car (Téléphérique) up the mountain to Harissa.',
    bullets: ['Walking distance from the hotel'],
    address: 'Jounieh, Mount Lebanon',
  },
  {
    id: 'harissa',
    type: 'sightseeing',
    name: 'Harissa',
    subtitle: 'Our Lady of Lebanon · Virgin Mary statue',
    distance: '10 km',
    image: require('../assets/guide/harissa.jpg'),
    description:
      "A 15-ton bronze statue of the Virgin Mary, known as Our Lady of Lebanon (Notre Dame du Liban), arms outstretched, adorns the bluff high above Jounieh. Inside the statue's base there is a small chapel.",
    bullets: ['10 km from the hotel'],
    address: 'Harissa, Mount Lebanon',
  },
  {
    id: 'beirut-downtown',
    type: 'sightseeing',
    name: 'Beirut Downtown',
    subtitle: 'Beirut Central District · Shopping & cafes',
    distance: '18 km',
    image: require('../assets/guide/beirut_downtown.jpg'),
    description:
      "Beirut's most prestigious shopping district. Home to high-end local boutiques and international luxury brands, car-free streets, cafes, restaurants, and the Beirut Souks.",
    bullets: ['18 km from the hotel'],
    address: 'Downtown Beirut',
  },
  {
    id: 'byblos',
    type: 'sightseeing',
    name: 'Byblos (Jbeil)',
    subtitle: 'One of the oldest continuously inhabited cities',
    distance: '22 km',
    image: require('../assets/guide/byblos.jpg'),
    description:
      "Byblos competes for the title of oldest continuously inhabited city. The Greeks named it Byblos, meaning 'Papyrus', for its papyrus trade. A charming city with an ancient harbor, seaside fish restaurants, ancient souks, and historic neighborhoods.",
    bullets: ['22 km from the hotel'],
    address: 'Jbeil (Byblos), Lebanon',
  },
  {
    id: 'st-charbel',
    type: 'sightseeing',
    name: 'St Charbel',
    subtitle: 'Saint Charbel Monastery · Annaya',
    distance: '25 km',
    image: PLACEHOLDER,
    description:
      "Nestled in the serene mountains of Annaya, the St. Charbel Monastery is one of Lebanon's most revered pilgrimage sites. Home to the tomb of Saint Charbel Makhlouf, surrounded by breathtaking landscapes — a unique blend of spiritual heritage and natural beauty.",
    bullets: ['25 km from the hotel'],
    address: 'Annaya, Lebanon',
  },
  {
    id: 'mzaar-ski',
    type: 'sightseeing',
    name: 'Mzaar Ski Resort',
    subtitle: 'Largest ski resort in the Middle East',
    distance: '30 km',
    image: require('../assets/guide/mzaar-ski.jpg'),
    description:
      "The Middle East's largest ski resort. 20 chairlifts, 50 runs, and 8,000 acres of terrain, plus an entertainment scene of restaurants and bars at the base.",
    bullets: ['30 km from the hotel'],
    address: 'Kfardebian, Mount Lebanon',
  },
  {
    id: 'batroun',
    type: 'sightseeing',
    name: 'Batroun',
    subtitle: 'Coastal tourist town · Beach & nightlife',
    distance: '30 km',
    image: require('../assets/guide/batroun.jpg'),
    description:
      'A major tourist destination in North Lebanon. Historic Maronite and Greek Orthodox churches, vibrant nightlife, fresh lemonade at the cafés on the main street, and the annual Batroun International Festival.',
    bullets: ['30 km from the hotel'],
    address: 'Batroun, North Lebanon',
  },
  {
    id: 'saida',
    type: 'sightseeing',
    name: 'Saida (Sidon)',
    subtitle: 'Ancient Phoenician city · Crusader castle',
    distance: '60 km',
    image: require('../assets/guide/saida.jpg'),
    description:
      'Saida (Sidon) has a fascinating Phoenician history — once a major city-state, famous for its glass manufacturing and the invention of purple dye. Today known for its Roman ruins, Crusader castle, and Mamluk and Ottoman heritage.',
    bullets: ['60 km from the hotel'],
    address: 'Saida, South Lebanon',
  },
  {
    id: 'tripoli',
    type: 'sightseeing',
    name: 'Tripoli',
    subtitle: "Lebanon's second-largest city · Northern coast",
    distance: '65 km',
    image: require('../assets/guide/tripoli.jpg'),
    description:
      "The largest city in northern Lebanon. Holds the Oscar Niemeyer International Fair and the Palm Islands — a protected area for endangered loggerhead turtles, monk seals, and migratory birds.",
    bullets: ['65 km from the hotel'],
    address: 'Tripoli, North Lebanon',
  },
  {
    id: 'baalbeck',
    type: 'sightseeing',
    name: 'Baalbeck',
    subtitle: 'Ancient Phoenician city · Roman temples',
    distance: '85 km',
    image: require('../assets/guide/baalbeck.jpg'),
    description:
      'An ancient Phoenician city in the Beqaa Valley. Inhabited as early as 9000 BCE and once a major pilgrimage site for the worship of the Phoenician sky-god Baal. The ruins of the early temple remain today beneath the later Roman Temple of Jupiter.',
    bullets: ['85 km from the hotel'],
    address: 'Baalbek, Beqaa Valley',
  },

  {
    id: 'pharmacies',
    type: 'relevant-services',
    name: 'Pharmacies',
    subtitle: 'Nearby pharmacies',
    distance: 'Various',
    image: require('../assets/guide/pharmacies.jpg'),
    description:
      'Pharmacies near Portemilio in Kaslik and Jounieh.',
    bullets: [
      'Placeholder Pharmacy 1 — distance · address',
      'Placeholder Pharmacy 2 — distance · address',
      'Placeholder Pharmacy 3 — distance · address',
    ],
    website: null,
  },
  {
    id: 'hospitals',
    type: 'relevant-services',
    name: 'Hospitals',
    subtitle: 'Hospitals and clinics',
    distance: 'Various',
    image: require('../assets/guide/hospitals.jpg'),
    description: 'Nearby hospitals and clinics for emergencies and care.',
    bullets: [
      'Placeholder Hospital 1 — distance · address',
      'Placeholder Hospital 2 — distance · address',
    ],
  },
];

export const landmarkById = (id) => LANDMARKS.find(l => l.id === id);
