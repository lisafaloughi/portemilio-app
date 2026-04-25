import React from 'react';
import ServiceListPage from '../components/ServiceListPage';

const PLACEHOLDER = require('../assets/wellness-area.jpg');

const SERVICES = [
  {
    id: 'hair',
    name: 'Hair Services',
    price: 'from $30',
    image: PLACEHOLDER,
    items: [
      'Blowout & Styling',
      'Haircut & Trim',
      'Coloring',
      'Hair Treatments',
      'Event & Bridal Styling',
    ],
  },
  {
    id: 'nails',
    name: 'Nail Care',
    price: 'from $20',
    image: PLACEHOLDER,
    items: [
      'Classic Manicure',
      'Gel / Shellac Manicure',
      'Pedicure (Classic & Spa)',
      'Nail Extensions & Refills',
      'Nail Art & Design',
    ],
  },
  {
    id: 'makeup',
    name: 'Makeup Artistry',
    price: 'from $40',
    image: PLACEHOLDER,
    items: [
      'Natural / Day Makeup',
      'Evening / Glam Makeup',
      'Bridal Makeup',
      'Event & Photoshoot Makeup',
    ],
  },
];

export default function SalonAntoinetteScreen({ navigation }) {
  return (
    <ServiceListPage
      navigation={navigation}
      title="Salon Antoinette"
      images={[PLACEHOLDER]}
      description="Hair, nails, and makeup — book in for a special occasion or a relaxed afternoon."
      phone="+9619123469"
      mapPinId="beauty-salon"
      instagramUrl="https://www.instagram.com/salon_antoinette/"
      services={SERVICES}
      priceNote="* Prices may differ slightly. Confirm at the salon."
    />
  );
}
