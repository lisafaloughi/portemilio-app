import React from 'react';
import { Linking } from 'react-native';
import CategoryPage from '../components/CategoryPage';

const RESERVE_PHONE = '+9619123473';

export default function MatchDayScreen({ navigation }) {
  return (
    <CategoryPage
      navigation={navigation}
      title="Match Day"
      images={[require('../assets/special-events.jpg')]}
      description="Germany vs Spain · 2026 FIFA World Cup. Wear your team's colors and bring the noise — we're screening it live at the Pool Bar. Tables fill up fast, book yours before kickoff."
      rows={[
        {
          icon: 'soccer',
          title: 'Match',
          subtitle: 'Germany vs Spain · 2026 FIFA World Cup',
        },
        {
          icon: 'map-marker-outline',
          title: 'Location',
          subtitle: 'Pool Bar · Live screening',
          onPress: () =>
            navigation.navigate('ResortMap', { pinId: 'pool-bar' }),
        },
        {
          icon: 'phone-outline',
          title: 'Book a table',
          subtitle: RESERVE_PHONE,
          onPress: () =>
            Linking.openURL(`tel:${RESERVE_PHONE.replace(/\s+/g, '')}`),
        },
      ]}
    />
  );
}
