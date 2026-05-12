import React from 'react';
import ServiceListPage from '../components/ServiceListPage';
import { useFacility, facilityImages, toAbsolute } from '../data/facilities';

const PLACEHOLDER = require('../assets/wellness-area.jpg');
const FALLBACK = {
  title: 'Le Rodin Spa',
  description: 'Massages and body-sculpting treatments in a quiet spa setting. Take an hour for yourself.',
  phone: '+9619123470',
  instagram: 'https://www.instagram.com/lerodin/',
};

const FALLBACK_SERVICES = [
  { id: 'massage', name: 'Massage', price: 'from $60', image: PLACEHOLDER },
  { id: 'body-sculpting', name: 'Body sculpting', price: 'from $80', image: PLACEHOLDER },
];

function mapServices(items) {
  const services = (items || []).filter(i => i.kind === 'service');
  if (!services.length) return FALLBACK_SERVICES;
  return services.map(s => ({
    id: String(s.id),
    name: s.name,
    price: s.subtitle || '',
    image: s.image_url ? { uri: toAbsolute(s.image_url) } : PLACEHOLDER,
  }));
}

export default function LeRodinScreen({ navigation }) {
  const f = useFacility('le_rodin_spa');
  const apiImgs = facilityImages(f);
  return (
    <ServiceListPage
      navigation={navigation}
      title={f?.name || FALLBACK.title}
      images={apiImgs.length ? apiImgs : [PLACEHOLDER]}
      description={f?.description || FALLBACK.description}
      phone={f?.phone || FALLBACK.phone}
      mapPinId="le-rodin-spa"
      instagramUrl={f?.instagram_url || FALLBACK.instagram}
      services={mapServices(f?.items)}
      priceNote="* Prices may differ slightly. Confirm at reception."
    />
  );
}
