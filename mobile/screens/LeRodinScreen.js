import React from 'react';
import ServiceListPage from '../components/ServiceListPage';

const PLACEHOLDER = require('../assets/wellness-area.jpg');

const SERVICES = [
  { id: 'massage', name: 'Massage', price: 'from $60', image: PLACEHOLDER },
  { id: 'body-sculpting', name: 'Body sculpting', price: 'from $80', image: PLACEHOLDER },
];

export default function LeRodinScreen({ navigation }) {
  return (
    <ServiceListPage
      navigation={navigation}
      title="Le Rodin Spa"
      images={[PLACEHOLDER]}
      description="Massages and body-sculpting treatments in a quiet spa setting. Take an hour for yourself."
      phone="+9619123470"
      mapPinId="le-rodin-spa"
      instagramUrl="https://www.instagram.com/lerodin/"
      services={SERVICES}
      priceNote="* Prices may differ slightly. Confirm at reception."
    />
  );
}
