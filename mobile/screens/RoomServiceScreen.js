import React from 'react';
import { Linking } from 'react-native';
import CategoryPage from '../components/CategoryPage';

const RS_PHONE = '+9619123460';

export default function RoomServiceScreen({ navigation }) {
  return (
    <CategoryPage
      navigation={navigation}
      title="Room Service"
      images={[require('../assets/room-service.jpg')]}
      description="Anything from the kitchen, delivered to your door. From a midnight snack to a full dinner — just call."
      rows={[
        {
          icon: 'phone-outline',
          title: 'Order',
          subtitle: RS_PHONE,
          onPress: () => Linking.openURL(`tel:${RS_PHONE.replace(/\s+/g, '')}`),
        },
        { icon: 'clock-outline', title: 'Hours', subtitle: '6:00 AM – 11:00 PM' },
        {
          icon: 'silverware-fork-knife',
          title: 'Browse the menus',
          subtitle: 'Restaurants & bars',
          onPress: () => navigation.navigate('Restaurants'),
        },
        { icon: 'truck-fast-outline', title: 'Delivery', subtitle: 'About 30 min, charged to your room' },
      ]}
    />
  );
}
