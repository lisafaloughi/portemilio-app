import React from 'react';
import { Linking, Alert } from 'react-native';
import CategoryPage from '../components/CategoryPage';
import { useService, serviceImages } from '../data/services';

const FALLBACK = {
  title: 'Room Service',
  description: 'Anything from the kitchen, delivered to your door. From a midnight snack to a full dinner — just call.',
  phone: '+9619123460',
  hours: '6:00 AM – 11:00 PM',
  extra: 'About 30 min delivery, charged to your room',
  image: require('../assets/room-service.jpg'),
};

const openRoomServiceMenu = () => {
  Alert.alert('Menu coming soon', "We're polishing it. Check back shortly.");
};

export default function RoomServiceScreen({ navigation }) {
  const s = useService('room_service');
  const title = s?.name || FALLBACK.title;
  const description = s?.description || FALLBACK.description;
  const phone = s?.phone || FALLBACK.phone;
  const hours = s?.hours || FALLBACK.hours;
  const extra = s?.extra_info || FALLBACK.extra;
  const apiImgs = serviceImages(s);
  const images = apiImgs.length ? apiImgs : [FALLBACK.image];

  const rows = [];
  if (phone) rows.push({
    icon: 'phone-outline', title: 'Order', subtitle: phone,
    onPress: () => Linking.openURL(`tel:${phone.replace(/\s+/g, '')}`),
  });
  if (hours) rows.push({ icon: 'clock-outline', title: 'Hours', subtitle: hours });
  rows.push({
    icon: 'file-document-outline', title: 'View menu',
    subtitle: 'Our room service menu', onPress: openRoomServiceMenu,
  });
  if (extra) rows.push({ icon: 'truck-fast-outline', title: 'Delivery', subtitle: extra });

  return (
    <CategoryPage
      navigation={navigation}
      title={title}
      images={images}
      description={description}
      rows={rows}
    />
  );
}
