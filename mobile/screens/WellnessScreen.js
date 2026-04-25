import React from 'react';
import { Linking } from 'react-native';
import CategoryPage from '../components/CategoryPage';

const SPA_PHONE = '+9619123459';

export default function WellnessScreen({ navigation }) {
  return (
    <CategoryPage
      navigation={navigation}
      title="Wellness"
      images={[require('../assets/wellness-area.jpg')]}
      description="An indoor semi-Olympic pool, sauna, steam, gym, and a spa menu of treatments. Take the morning slow."
      rows={[
        { icon: 'clock-outline', title: 'Open', subtitle: '6:00 AM – 9:00 PM' },
        { icon: 'map-marker-outline', title: 'Location', subtitle: 'Health Club · 2nd floor' },
        {
          icon: 'phone-outline',
          title: 'Book a treatment',
          subtitle: SPA_PHONE,
          onPress: () => Linking.openURL(`tel:${SPA_PHONE.replace(/\s+/g, '')}`),
        },
        { icon: 'pool', title: 'Indoor pool', subtitle: 'Semi-Olympic · heated year-round' },
        { icon: 'fire', title: 'Sauna & steam', subtitle: 'Included with wellness access' },
        { icon: 'dumbbell', title: 'Gym', subtitle: 'Cardio, weights, free classes' },
      ]}
    />
  );
}
