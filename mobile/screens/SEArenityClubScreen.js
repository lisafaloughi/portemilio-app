import React from 'react';
import ServiceListPage from '../components/ServiceListPage';

const PLACEHOLDER = require('../assets/wellness-area.jpg');

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
  return (
    <ServiceListPage
      navigation={navigation}
      title="SEArenity Club"
      images={[PLACEHOLDER]}
      description="Gym, classes, scuba, swimming, and personal training. Train with the team however you move."
      phone="+9619635356"
      mapPinId="gym"
      instagramUrl="https://www.instagram.com/searenityclub/"
      services={SERVICES}
      showPrices={false}
      columns={2}
    />
  );
}
