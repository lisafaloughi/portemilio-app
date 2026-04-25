import React from 'react';
import ServiceListPage from '../components/ServiceListPage';

const PLACEHOLDER = require('../assets/wellness-area.jpg');

const SERVICES = [
  { id: '1-session', name: '1 Session', price: '$20', image: PLACEHOLDER },
  { id: '4-sessions', name: '4 Sessions', price: '$75', image: PLACEHOLDER },
  { id: '8-sessions', name: '8 Sessions', price: '$140', image: PLACEHOLDER },
  { id: '12-sessions', name: '12 Sessions', price: '$195', image: PLACEHOLDER },
  { id: 'private-solo', name: 'Private · Solo Session', price: '$50', image: PLACEHOLDER },
  { id: 'private-duo', name: 'Private · Duo Session', price: '$80', image: PLACEHOLDER },
];

export default function RovePilatesScreen({ navigation }) {
  return (
    <ServiceListPage
      navigation={navigation}
      title="Rove Pilates"
      images={[PLACEHOLDER]}
      description="Group reformer classes — Abs & Core, Legs & Glutes, Power, and Foundations — plus private 1-on-1 and duo sessions. Book everything through the Rove app."
      phone="+96181152433"
      mapPinId="pilates"
      instagramUrl="https://www.instagram.com/rovepilatesstudio/"
      whatsappUrl="https://api.whatsapp.com/send/?phone=96181152433&text&type=phone_number&app_absent=0"
      appStoreUrl="https://apps.apple.com/us/app/rove-pilates-studio/id6743739472"
      services={SERVICES}
      showImages={false}
    />
  );
}
