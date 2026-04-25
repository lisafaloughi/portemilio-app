import React from 'react';
import { Linking } from 'react-native';
import CategoryPage from '../components/CategoryPage';

const SHUTTLE_PHONE = '+9619123457';

export default function SeasideAccessScreen({ navigation }) {
  return (
    <CategoryPage
      navigation={navigation}
      title="Seaside Access"
      images={[require('../assets/seaside-access.png')]}
      description="A complimentary shuttle takes you from the hotel to the seaside and La Réserve in just a few minutes. Call when you're ready and we'll come pick you up."
      rows={[
        {
          icon: 'phone-outline',
          title: 'Call for the shuttle',
          subtitle: SHUTTLE_PHONE,
          onPress: () => Linking.openURL(`tel:${SHUTTLE_PHONE.replace(/\s+/g, '')}`),
        },
        {
          icon: 'bus-clock',
          title: 'Service hours',
          subtitle: '7:00 AM – 7:00 PM',
        },
        {
          icon: 'map-marker-path',
          title: 'Route',
          subtitle: 'Hotel lobby → Seaside / La Réserve',
        },
        {
          icon: 'cash-multiple',
          title: 'Cost',
          subtitle: 'Complimentary for hotel guests',
        },
      ]}
    />
  );
}
