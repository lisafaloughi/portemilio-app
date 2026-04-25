import React from 'react';
import { Linking, Alert } from 'react-native';
import CategoryPage from '../components/CategoryPage';

const RS_PHONE = '+9619123460';
const ROOM_SERVICE_MENU_URL = null;

const openRoomServiceMenu = () => {
  if (ROOM_SERVICE_MENU_URL) {
    Linking.openURL(ROOM_SERVICE_MENU_URL).catch(() =>
      Alert.alert('Unable to open menu', 'Please try again later.')
    );
  } else {
    Alert.alert('Menu coming soon', "We're polishing it. Check back shortly.");
  }
};

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
          icon: 'file-document-outline',
          title: 'View menu',
          subtitle: 'Our room service menu',
          onPress: openRoomServiceMenu,
        },
        { icon: 'truck-fast-outline', title: 'Delivery', subtitle: 'About 30 min, charged to your room' },
      ]}
    />
  );
}
