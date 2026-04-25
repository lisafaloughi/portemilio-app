import React from 'react';
import { Linking } from 'react-native';
import CategoryPage from '../components/CategoryPage';

const HK_PHONE = '+9619123458';

export default function HousekeepingScreen({ navigation }) {
  return (
    <CategoryPage
      navigation={navigation}
      title="Housekeeping"
      images={[require('../assets/housekeeping.jpg')]}
      description="Fresh towels, extra pillows, turn-down service — anything to make your room feel just right."
      rows={[
        {
          icon: 'phone-outline',
          title: 'Request housekeeping',
          subtitle: HK_PHONE,
          onPress: () => Linking.openURL(`tel:${HK_PHONE.replace(/\s+/g, '')}`),
        },
        { icon: 'clock-outline', title: 'Available', subtitle: '24 hours' },
        { icon: 'broom', title: 'Daily room cleaning', subtitle: '9:00 AM – 3:00 PM' },
      ]}
    />
  );
}
