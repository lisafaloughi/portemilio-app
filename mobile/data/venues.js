const LA_RESERVE_IMGS = [
  require('../assets/restaurants/la_reserve.jpeg'),
  require('../assets/restaurants/lareserve1.png'),
  require('../assets/restaurants/lareserve2.png'),
];
const POOL_BAR_IMGS = [
  require('../assets/restaurants/poolbar1.jpg'),
  require('../assets/restaurants/poolbar2.jpg'),
];
const LA_TERRASSE_IMGS = [
  require('../assets/restaurants/laterrasse1.jpg'),
  require('../assets/restaurants/laterrasse2.jpg'),
];
const FELLINIS_IMGS = [
  require('../assets/restaurants/felinis1.jpg'),
  require('../assets/restaurants/felinis2.jpg'),
  require('../assets/restaurants/felinis3.jpg'),
];
const KHUANS_IMGS = [
  require('../assets/restaurants/khuans1.jpg'),
  require('../assets/restaurants/khuans2.jpg'),
  require('../assets/restaurants/khuans3.jpeg'),
  require('../assets/restaurants/khuans4.jpg'),
  require('../assets/restaurants/khuans5.png'),
];
const SUNSET_IMGS = [
  require('../assets/restaurants/sunsetbar.jpg'),
];

export const VENUES = [
  {
    id: 'la-reserve',
    name: 'La Réserve',
    categories: ['restaurants'],
    specialty: 'Brunch on Sundays',
    image: LA_RESERVE_IMGS[0],
    images: LA_RESERVE_IMGS,
    description:
      'A refined buffet experience for our most memorable Sunday brunches — the kind that runs into the afternoon.',
    highlights: ['Sunday brunch · 1 PM – 6 PM', 'Buffet for $35/adult · $25/child', 'Reservations recommended'],
    address: 'Portemilio · Seaside terrace',
    phone: '+9619123461',
    menuUrl: null,
    mapPinId: 'la-reserve',
  },
  {
    id: 'pool-bar',
    name: 'Pool Bar',
    categories: ['restaurants', 'bars'],
    specialty: 'Eat & drink by the pool',
    image: POOL_BAR_IMGS[0],
    images: POOL_BAR_IMGS,
    description:
      'Simple lunches, fresh lemonade, and our signature Merry Cream.',
    highlights: ['Daily · 9 AM – sunset'],
    address: 'Olympic pool deck',
    phone: '+9619123462',
    menuUrl: null,
    mapPinId: 'pool-bar',
  },
  {
    id: 'la-terrasse',
    name: 'La Terrasse',
    categories: ['restaurants'],
    specialty: 'Eat & drink with a view of the sea',
    image: LA_TERRASSE_IMGS[0],
    images: LA_TERRASSE_IMGS,
    description:
      'Open-air dining suspended above the Mediterranean. The breeze, the horizon, and your plate.',
    highlights: ['Lunch & dinner'],
    address: 'Seafront terrace',
    phone: '+9619123463',
    menuUrl: null,
    mapPinId: 'la-terrasse',
  },
  {
    id: 'fellinis',
    name: "Fellini's",
    categories: ['restaurants'],
    specialty: 'Breakfast buffet',
    image: FELLINIS_IMGS[0],
    images: FELLINIS_IMGS,
    description:
      'Where mornings begin — a generous Lebanese buffet, fresh pastries, eggs to order, and anything worth waking up for.',
    highlights: [
      'Breakfast Buffet · 7 – 11 AM',
      '$25 per person — pay at reception',
      'A la carte options also available',
    ],
    address: '1st floor · Lobby level',
    phone: '+9619123464',
    menuUrl: null,
    mapPinId: 'fellini',
  },
  {
    id: 'khuans-bar',
    name: "Khuan's Bar",
    categories: ['bars'],
    specialty: 'Piano nights · pool table',
    image: KHUANS_IMGS[0],
    images: KHUANS_IMGS,
    description:
      'A classic piano bar for slow nights. Sink into the leather, rack up a game, listen to the music.',
    highlights: ['Evenings · 6 PM – late', 'Live piano · Late-night drinks & games'],
    address: 'Lobby level',
    phone: '+9619123465',
    menuUrl: null,
    mapPinId: 'khuans-bar',
  },
  {
    id: 'sunset-bar',
    name: 'Sunset Bar',
    categories: ['bars'],
    specialty: 'Coming soon · Sunsets & cocktails',
    image: SUNSET_IMGS[0],
    images: SUNSET_IMGS,
    description:
      "Light bites and fresh drinks, with front-row sunset views",
    highlights: ['Opening soon'],
    address: 'Sea deck near the tennis courts',
    upcoming: true,
    menuUrl: null,
    mapPinId: 'sunset-bar',
  },
];

export const venueById = (id) => VENUES.find(v => v.id === id);
