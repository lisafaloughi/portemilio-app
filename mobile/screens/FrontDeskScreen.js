import React from 'react';
import { Linking } from 'react-native';
import CategoryPage from '../components/CategoryPage';

const PHONE = '+9619123456';
const EMAIL = 'frontdesk@portemilio.com';

export default function FrontDeskScreen({ navigation }) {
  return (
    <CategoryPage
      navigation={navigation}
      title="Front Desk"
      images={[require('../assets/front-desk.jpg')]}
      description="Our team is here for you around the clock. Concierge, requests, late check-out, anything you need — just ask."
      rows={[
        {
          icon: 'clock-outline',
          title: 'Open',
          subtitle: '24 hours, every day',
        },
        {
          icon: 'phone-outline',
          title: 'Call front desk',
          subtitle: PHONE,
          onPress: () => Linking.openURL(`tel:${PHONE.replace(/\s+/g, '')}`),
        },
        {
          icon: 'email-outline',
          title: 'Email us',
          subtitle: EMAIL,
          onPress: () => Linking.openURL(`mailto:${EMAIL}`),
        },
        {
          icon: 'map-marker-outline',
          title: 'Location',
          subtitle: 'Lobby · Ground floor',
        },
      ]}
    />
  );
}
