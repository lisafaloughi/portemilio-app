import React from 'react';
import { Linking } from 'react-native';
import CategoryPage from '../components/CategoryPage';

const GUN_CLUB_PHONE = '+9619123474';

export default function GunClubScreen({ navigation }) {
  return (
    <CategoryPage
      navigation={navigation}
      title="Kaslik Gun Club"
      images={[require('../assets/todays-act-1.jpg')]}
      description="Outdoor shooting range with guided sessions for beginners and experienced shooters alike. Safety briefing always included."
      rows={[
        { icon: 'clock-outline', title: 'Hours', subtitle: '9:00 AM – 6:00 PM' },
        {
          icon: 'phone-outline',
          title: 'Call to book',
          subtitle: GUN_CLUB_PHONE,
          onPress: () =>
            Linking.openURL(`tel:${GUN_CLUB_PHONE.replace(/\s+/g, '')}`),
        },
        {
          icon: 'map-marker-outline',
          title: 'Location',
          subtitle: 'Activities zone · Outdoor range',
          onPress: () =>
            navigation.navigate('ResortMap', { pinId: 'gun-club' }),
        },
        {
          icon: 'shield-check-outline',
          title: 'Safety',
          subtitle: 'Briefing and supervision included with every session',
        },
      ]}
    />
  );
}
