import React from 'react';
import { Linking } from 'react-native';
import CategoryPage from '../components/CategoryPage';
import { useService, serviceImages } from '../data/services';

const FALLBACK = {
  title: 'Seaside Access',
  description: "A complimentary shuttle takes you from the hotel to the seaside and La Réserve in just a few minutes. Call when you're ready and we'll come pick you up.",
  phone: '+9619123457',
  hours: '7:00 AM – 7:00 PM',
  location: 'Hotel lobby → Seaside / La Réserve',
  extra: 'Complimentary for hotel guests',
  image: require('../assets/seaside-access.png'),
};

export default function SeasideAccessScreen({ navigation }) {
  const s = useService('seaside_access');
  const title = s?.name || FALLBACK.title;
  const description = s?.description || FALLBACK.description;
  const phone = s?.phone || FALLBACK.phone;
  const hours = s?.hours || FALLBACK.hours;
  const location = s?.location || FALLBACK.location;
  const extra = s?.extra_info || FALLBACK.extra;
  const apiImgs = serviceImages(s);
  const images = apiImgs.length ? apiImgs : [FALLBACK.image];

  const rows = [];
  if (phone) rows.push({
    icon: 'phone-outline', title: 'Call for the shuttle', subtitle: phone,
    onPress: () => Linking.openURL(`tel:${phone.replace(/\s+/g, '')}`),
  });
  if (hours) rows.push({ icon: 'bus-clock', title: 'Service hours', subtitle: hours });
  if (location) rows.push({ icon: 'map-marker-path', title: 'Route', subtitle: location });
  if (extra) rows.push({ icon: 'cash-multiple', title: 'Cost', subtitle: extra });

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
