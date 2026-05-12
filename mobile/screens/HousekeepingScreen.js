import React from 'react';
import { Linking } from 'react-native';
import CategoryPage from '../components/CategoryPage';
import { useService, serviceImages } from '../data/services';

const FALLBACK = {
  title: 'Housekeeping',
  description: 'Fresh towels, extra pillows, turn-down service — anything to make your room feel just right.',
  phone: '+9619123458',
  hours: '24 hours',
  extra: 'Daily room cleaning: 9:00 AM – 3:00 PM',
  image: require('../assets/housekeeping.jpg'),
};

export default function HousekeepingScreen({ navigation }) {
  const s = useService('housekeeping');
  const title = s?.name || FALLBACK.title;
  const description = s?.description || FALLBACK.description;
  const phone = s?.phone || FALLBACK.phone;
  const hours = s?.hours || FALLBACK.hours;
  const extra = s?.extra_info || FALLBACK.extra;
  const apiImgs = serviceImages(s);
  const images = apiImgs.length ? apiImgs : [FALLBACK.image];

  const rows = [];
  if (phone) rows.push({
    icon: 'phone-outline', title: 'Request housekeeping', subtitle: phone,
    onPress: () => Linking.openURL(`tel:${phone.replace(/\s+/g, '')}`),
  });
  if (hours) rows.push({ icon: 'clock-outline', title: 'Available', subtitle: hours });
  if (extra) rows.push({ icon: 'broom', title: 'Cleaning', subtitle: extra });
  rows.push({
    icon: 'tshirt-crew-outline', title: 'Laundry request',
    subtitle: 'Schedule a pickup via Request housekeeping',
  });

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
