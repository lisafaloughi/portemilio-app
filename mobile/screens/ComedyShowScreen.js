import React from 'react';
import { Linking } from 'react-native';
import CategoryPage from '../components/CategoryPage';

const RES_PHONES = ['+9619639111', '+9619639112', '+9619639115'];

const callPhone = (n) =>
  Linking.openURL(`tel:${n.replace(/\s+/g, '')}`);

export default function ComedyShowScreen({ navigation }) {
  return (
    <CategoryPage
      navigation={navigation}
      title="Comedy Show"
      images={[require('../assets/comedy-theatre.jpg')]}
      description="Laugh your worries away with the one and only Fady Raidy. Spots fill quickly — high demand."
      rows={[
        {
          icon: 'calendar-week',
          title: 'When',
          subtitle: 'Weekends · Friday – Sunday',
        },
        {
          icon: 'map-marker-outline',
          title: 'Location',
          subtitle: 'The Sheraka Retro Theatre',
          onPress: () =>
            navigation.navigate('ResortMap', { pinId: 'comedy-theatre' }),
        },
        {
          icon: 'phone-outline',
          title: 'Reservations',
          subtitle: '+961 09 639 111',
          onPress: () => callPhone(RES_PHONES[0]),
        },
      ]}
    />
  );
}
