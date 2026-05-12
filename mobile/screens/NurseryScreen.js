import React from 'react';
import { Linking } from 'react-native';
import CategoryPage from '../components/CategoryPage';
import { useFacility, facilityImages } from '../data/facilities';

const FALLBACK = {
  title: 'Nursery',
  description: 'A supervised space for kids under 6. Drop them off in good hands and enjoy the resort with peace of mind.',
  phone: '+9619123472',
  hours: '9:00 AM – 6:00 PM',
  location: 'Activities zone · Ground level',
  extra: 'Babies & children under 6',
  image: require('../assets/kids-activities.jpg'),
};

export default function NurseryScreen({ navigation }) {
  const f = useFacility('nursery');
  const title = f?.name || FALLBACK.title;
  const description = f?.description || FALLBACK.description;
  const phone = f?.phone || FALLBACK.phone;
  const hours = f?.hours || FALLBACK.hours;
  const location = f?.location || FALLBACK.location;
  const extra = f?.extra_info || FALLBACK.extra;
  const apiImgs = facilityImages(f);
  const images = apiImgs.length ? apiImgs : [FALLBACK.image];

  const rows = [];
  if (hours) rows.push({ icon: 'clock-outline', title: 'Hours', subtitle: hours });
  if (phone) rows.push({
    icon: 'phone-outline', title: 'Call for more info', subtitle: phone,
    onPress: () => Linking.openURL(`tel:${phone.replace(/\s+/g, '')}`),
  });
  if (location) rows.push({
    icon: 'map-marker-outline', title: 'Location', subtitle: location,
    onPress: () => navigation.navigate('ResortMap', { pinId: 'nursery' }),
  });
  if (extra) rows.push({ icon: 'baby-face-outline', title: 'Age range', subtitle: extra });

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
