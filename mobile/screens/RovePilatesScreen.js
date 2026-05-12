import React from 'react';
import ServiceListPage from '../components/ServiceListPage';
import { useFacility, facilityImages, toAbsolute } from '../data/facilities';

const PLACEHOLDER = require('../assets/wellness-area.jpg');
const FALLBACK = {
  title: 'Rove Pilates',
  description: 'Group reformer classes — Abs & Core, Legs & Glutes, Power, and Foundations — plus private 1-on-1 and duo sessions. Book everything through the Rove app.',
  phone: '+96181152433',
  instagram: 'https://www.instagram.com/rovepilatesstudio/',
  whatsapp: 'https://api.whatsapp.com/send/?phone=96181152433&text&type=phone_number&app_absent=0',
  appStore: 'https://apps.apple.com/us/app/rove-pilates-studio/id6743739472',
};

function mapPlans(items, fallback) {
  const plans = (items || []).filter(i => i.kind === 'plan');
  if (!plans.length) return fallback;
  return plans.map(p => ({
    id: String(p.id),
    name: p.name,
    price: p.subtitle || '',
    image: p.image_url ? { uri: toAbsolute(p.image_url) } : PLACEHOLDER,
  }));
}

const SERVICES = [
  { id: '1-session', name: '1 Session', price: '$20', image: PLACEHOLDER },
  { id: '4-sessions', name: '4 Sessions', price: '$75', image: PLACEHOLDER },
  { id: '8-sessions', name: '8 Sessions', price: '$140', image: PLACEHOLDER },
  { id: '12-sessions', name: '12 Sessions', price: '$195', image: PLACEHOLDER },
  { id: 'private-solo', name: 'Private · Solo Session', price: '$50', image: PLACEHOLDER },
  { id: 'private-duo', name: 'Private · Duo Session', price: '$80', image: PLACEHOLDER },
];

export default function RovePilatesScreen({ navigation }) {
  const f = useFacility('rove_pilates');
  const apiImgs = facilityImages(f);
  return (
    <ServiceListPage
      navigation={navigation}
      title={f?.name || FALLBACK.title}
      images={apiImgs.length ? apiImgs : [PLACEHOLDER]}
      description={f?.description || FALLBACK.description}
      phone={f?.phone || FALLBACK.phone}
      mapPinId="pilates"
      instagramUrl={f?.instagram_url || FALLBACK.instagram}
      whatsappUrl={f?.whatsapp_url || FALLBACK.whatsapp}
      appStoreUrl={f?.app_store_url || FALLBACK.appStore}
      services={mapPlans(f?.items, SERVICES)}
      showImages={false}
    />
  );
}
