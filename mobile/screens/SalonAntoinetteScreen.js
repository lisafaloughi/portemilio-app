import React from 'react';
import ServiceListPage from '../components/ServiceListPage';
import { useFacility, facilityImages, toAbsolute } from '../data/facilities';

const PLACEHOLDER = require('../assets/wellness-area.jpg');
const FALLBACK = {
  title: 'Salon Antoinette',
  description: 'Hair, nails, and makeup — book in for a special occasion or a relaxed afternoon.',
  phone: '+9619123469',
  instagram: 'https://www.instagram.com/salon_antoinette/',
};

function mapItems(items, fallback) {
  const services = (items || []).filter(i => i.kind === 'service');
  if (!services.length) return fallback;
  return services.map(s => ({
    id: String(s.id),
    name: s.name,
    price: s.subtitle || '',
    image: s.image_url ? { uri: toAbsolute(s.image_url) } : PLACEHOLDER,
    items: s.sub_items ? (() => { try { return JSON.parse(s.sub_items); } catch { return []; } })() : [],
  }));
}

const SERVICES = [
  {
    id: 'hair',
    name: 'Hair Atelier',
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
  {
    id: 'beauty',
    name: 'Beauty Treatments',
    price: 'from $35',
    image: PLACEHOLDER,
    items: [
      'Facials (Hydrating, Deep Clean, Anti-Aging)',
      'Eyebrow Shaping & Tinting',
      'Lash Lifting & Extensions',
      'Skin Treatments',
    ],
  },
];

export default function SalonAntoinetteScreen({ navigation }) {
  const f = useFacility('salon_antoinette');
  const apiImgs = facilityImages(f);
  return (
    <ServiceListPage
      navigation={navigation}
      title={f?.name || FALLBACK.title}
      images={apiImgs.length ? apiImgs : [PLACEHOLDER]}
      description={f?.description || FALLBACK.description}
      phone={f?.phone || FALLBACK.phone}
      mapPinId="beauty-salon"
      instagramUrl={f?.instagram_url || FALLBACK.instagram}
      services={mapItems(f?.items, SERVICES)}
      priceNote="* Prices may differ slightly. Confirm at the salon."
    />
  );
}
