const IVIEW_IMG = require('../assets/iview.jpg');
const PAVILLION_IMG = require('../assets/pavillion.jpg');
const EVENTS_PHONE = '+9619123466';

export const EVENT_VENUES = [
  {
    id: 'iview',
    name: 'Iview',
    specialty: 'Sunset views · Intimate gatherings',
    image: IVIEW_IMG,
    images: [IVIEW_IMG],
    capacity: 'Up to 30 guests',
    description:
      "An intimate seaside lounge for the kind of evenings you'll remember. Sunset views, privacy, and a relaxed atmosphere — perfect for small celebrations and private moments.",
    highlights: [
      'Up to 30 guests',
      'Sunset views',
      'Private & intimate setting',
    ],
    address: 'Iview · Seaside lounge',
    phone: EVENTS_PHONE,
    mapPinId: 'iview',
  },
  {
    id: 'pavillion',
    name: 'Pavillion',
    specialty: 'Beachfront · Wedding-ready',
    image: PAVILLION_IMG,
    images: [PAVILLION_IMG],
    capacity: '200+ guests',
    description:
      'A grand beachfront pavilion built for the celebrations that matter most. Wedding afterparties, gala dinners, milestone events — everything you need under one elegant roof.',
    highlights: [
      '200+ guests',
      'Beachfront setting',
      'Wedding-style events',
      'Customizable layout',
    ],
    address: 'Beachfront pavilion',
    phone: EVENTS_PHONE,
    mapPinId: 'pavillion',
  },
];

export const eventVenueById = (id) => EVENT_VENUES.find(v => v.id === id);
