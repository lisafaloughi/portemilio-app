import React from 'react';
import { Linking } from 'react-native';
import CategoryPage from '../components/CategoryPage';
import { useFacility, facilityImages } from '../data/facilities';

const FALLBACK = {
  title: 'Kaslik Gun Club',
  description: 'Indoor shooting range with guided sessions for beginners and experienced shooters alike. Safety briefing always included.',
  phone: '+9619123474',
  hours: '9:00 AM – 6:00 PM',
  location: 'Activities zone · Outdoor range',
  extra: 'Briefing and supervision included with every session',
  image: require('../assets/todays-act-1.jpg'),
};

export default function GunClubScreen({ navigation }) {
  const f = useFacility('kaslik_gun_club');
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
    icon: 'phone-outline', title: 'Call to book', subtitle: phone,
    onPress: () => Linking.openURL(`tel:${phone.replace(/\s+/g, '')}`),
  });
  if (location) rows.push({
    icon: 'map-marker-outline', title: 'Location', subtitle: location,
    onPress: () => navigation.navigate('ResortMap', { pinId: 'gun-club' }),
  });
  if (extra) rows.push({ icon: 'shield-check-outline', title: 'Safety', subtitle: extra });

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
