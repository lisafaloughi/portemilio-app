import React from 'react';
import { Linking } from 'react-native';
import CategoryPage from '../components/CategoryPage';

const NURSERY_PHONE = '+9619123472';

export default function NurseryScreen({ navigation }) {
  return (
    <CategoryPage
      navigation={navigation}
      title="Nursery"
      images={[require('../assets/kids-activities.jpg')]}
      description="A supervised space for kids under 6. Drop them off in good hands and enjoy the resort with peace of mind."
      rows={[
        {
          icon: 'clock-outline',
          title: 'Hours',
          subtitle: '9:00 AM – 6:00 PM',
        },
        {
          icon: 'phone-outline',
          title: 'Call for more info',
          subtitle: NURSERY_PHONE,
          onPress: () =>
            Linking.openURL(`tel:${NURSERY_PHONE.replace(/\s+/g, '')}`),
        },
        {
          icon: 'map-marker-outline',
          title: 'Location',
          subtitle: 'Activities zone · Ground level',
          onPress: () =>
            navigation.navigate('ResortMap', { pinId: 'nursery' }),
        },
        {
          icon: 'baby-face-outline',
          title: 'Age range',
          subtitle: 'Babies & children under 6',
        },
      ]}
    />
  );
}
