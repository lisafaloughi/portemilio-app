const RESTAURANTS_IMG = require('../assets/restaurants.jpg');
const BARS_IMG = require('../assets/bars.jpg');
const BREAKFAST_IMG = require('../assets/breakfast.jpg');

export const VENUES = [
  {
    id: 'la-reserve',
    name: 'La Réserve',
    categories: ['restaurants'],
    specialty: 'Brunch on Sundays',
    image: RESTAURANTS_IMG,
    images: [RESTAURANTS_IMG],
    description:
      'A refined dining experience for our most memorable Sunday brunches — the kind that runs into the afternoon.',
    highlights: ['Sunday brunch · 11 AM – 4 PM', 'Reservations recommended'],
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
    image: RESTAURANTS_IMG,
    images: [RESTAURANTS_IMG],
    description:
      'Casual bites and refreshing drinks served right by the pool. Toes in the water, glass in hand.',
    highlights: ['Daily · 10 AM – sunset', 'Light bites & cocktails'],
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
    image: RESTAURANTS_IMG,
    images: [RESTAURANTS_IMG],
    description:
      'Open-air dining suspended above the Mediterranean. The breeze, the horizon, and your plate.',
    highlights: ['Lunch & dinner', 'Mediterranean menu'],
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
    image: BREAKFAST_IMG,
    images: [BREAKFAST_IMG],
    description:
      'Where mornings begin — a generous Lebanese buffet, fresh pastries, eggs to order, and anything you can dream up.',
    highlights: ['Breakfast · 7 – 11 AM', 'Buffet · Lebanese & continental'],
    address: '1st floor · Lobby level',
    phone: '+9619123464',
    menuUrl: null,
    mapPinId: 'fellini',
  },
  {
    id: 'khuans-bar',
    name: "Khuan's Bar",
    categories: ['bars'],
    specialty: 'Piano nights & pool table',
    image: BARS_IMG,
    images: [BARS_IMG],
    description:
      'A classic piano bar for slow nights. Sink into the leather, rack up a game, listen to the music.',
    highlights: ['Evenings · 6 PM – late', 'Live piano · Pool table'],
    address: 'Lobby level',
    phone: '+9619123465',
    menuUrl: null,
    mapPinId: 'khuans-bar',
  },
  {
    id: 'sunset-bar',
    name: 'Sunset Bar',
    categories: ['bars'],
    specialty: 'Coming soon · Rooftop sunsets',
    image: BARS_IMG,
    images: [BARS_IMG],
    description:
      "A new rooftop bar for the resort's best sunsets. Opening soon.",
    highlights: ['Opening soon'],
    address: 'Rooftop',
    upcoming: true,
    menuUrl: null,
    mapPinId: 'sunset-bar',
  },
];

export const venueById = (id) => VENUES.find(v => v.id === id);
