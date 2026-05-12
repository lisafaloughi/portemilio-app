import React from 'react';
import ServiceListPage from '../components/ServiceListPage';
import { useFacility, facilityImages, toAbsolute } from '../data/facilities';

const PLACEHOLDER = require('../assets/wellness-area.jpg');
const FALLBACK = {
  title: 'SEArenity Club',
  description: 'Gym, classes, scuba, swimming, and personal training. Train with the team however you move.',
  phone: '+9619635356',
  instagram: 'https://www.instagram.com/searenityclub/',
};

function mapServices(items, fallback) {
  const services = (items || []).filter(i => i.kind === 'service');
  if (!services.length) return fallback;
  return services.map(s => ({
    id: String(s.id),
    name: s.name,
    image: s.image_url ? { uri: toAbsolute(s.image_url) } : PLACEHOLDER,
  }));
}

const SERVICES = [
  { id: 'pt', name: 'Personal Training', image: PLACEHOLDER },
  { id: 'gym', name: 'Gym Membership', image: PLACEHOLDER },
  { id: 'pool', name: 'Pool Membership', image: PLACEHOLDER },
  { id: 'scuba', name: 'Scuba Diving', image: PLACEHOLDER },
  { id: 'kangoo', name: 'Kangoo Jumps Class', image: PLACEHOLDER },
  { id: 'kungfu', name: 'Kung-Fu Class', image: PLACEHOLDER },
  { id: 'self-defence', name: 'Self Defence Class', image: PLACEHOLDER },
  { id: 'zumba', name: 'Zumba Class', image: PLACEHOLDER },
  { id: 'oriental', name: 'Oriental Class', image: PLACEHOLDER },
  { id: 'swimming', name: 'Swimming', image: PLACEHOLDER },
  { id: 'dietitian', name: 'Dietitian Consultation', image: PLACEHOLDER },
];

export default function SEArenityClubScreen({ navigation }) {
  const f = useFacility('searenity_club');
  const apiImgs = facilityImages(f);
  return (
    <ServiceListPage
      navigation={navigation}
      title={f?.name || FALLBACK.title}
      images={apiImgs.length ? apiImgs : [PLACEHOLDER]}
      description={f?.description || FALLBACK.description}
      phone={f?.phone || FALLBACK.phone}
      mapPinId="gym"
      instagramUrl={f?.instagram_url || FALLBACK.instagram}
      services={mapServices(f?.items, SERVICES)}
      showPrices={false}
      columns={2}
    />
  );
}
