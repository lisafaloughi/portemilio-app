import React from 'react';
import { Linking } from 'react-native';
import CategoryPage from '../components/CategoryPage';
import { useService, serviceImages } from '../data/services';

const FALLBACK = {
  title: 'Get to the City',
  description: 'Heading into Beirut, Byblos, or beyond? We arrange a private car or a group van — daily, 7 AM – 11 PM. Call us to book.',
  phone: '+9619123475',
  extra: 'Private car (up to 4 passengers) · Van (up to 8 passengers)',
  image: require('../assets/transport-to-the-city.png'),
};

export default function GetToCityScreen({ navigation }) {
  const s = useService('get_to_city');
  const title = s?.name || FALLBACK.title;
  const description = s?.description || FALLBACK.description;
  const phone = s?.phone || FALLBACK.phone;
  const extra = s?.extra_info || FALLBACK.extra;
  const apiImgs = serviceImages(s);
  const images = apiImgs.length ? apiImgs : [FALLBACK.image];

  const rows = [];
  if (phone) rows.push({
    icon: 'phone-outline', title: 'Call to book', subtitle: phone,
    onPress: () => Linking.openURL(`tel:${phone.replace(/\s+/g, '')}`),
  });
  if (extra) rows.push({ icon: 'van-passenger', title: 'Vehicles', subtitle: extra });

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
