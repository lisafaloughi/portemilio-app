import React from 'react';
import { Linking } from 'react-native';
import CategoryPage from '../components/CategoryPage';
import { useService, serviceImages } from '../data/services';

const FALLBACK = {
  title: 'Maritime Academy',
  description: 'Professional Maritime Education & Training. Boat cruise certifications, safety courses, and crew training — taught by experienced instructors.',
  phone: '+961 81 273 239',
  email: 'admissions@imaritime.academy',
  website: 'https://www.imaritimeacademy.com/',
  instagram: 'https://www.instagram.com/maritimeacademyleb/',
  image: require('../assets/maritime_academy.png'),
};

function prettyHost(url) {
  if (!url) return '';
  try { return url.replace(/^https?:\/\//, '').replace(/\/$/, ''); } catch { return url; }
}

export default function MaritimeAcademyScreen({ navigation }) {
  const s = useService('maritime_academy');
  const title = s?.name || FALLBACK.title;
  const description = s?.description || FALLBACK.description;
  const phone = s?.phone || FALLBACK.phone;
  const email = s?.email || FALLBACK.email;
  const website = s?.website || FALLBACK.website;
  const instagram = s?.instagram_url || FALLBACK.instagram;
  const apiImgs = serviceImages(s);
  const images = apiImgs.length ? apiImgs : [FALLBACK.image];

  const rows = [];
  if (phone) rows.push({
    icon: 'phone-outline', title: 'Call', subtitle: phone,
    onPress: () => Linking.openURL(`tel:${phone.replace(/\s+/g, '')}`),
  });
  if (email) rows.push({
    icon: 'email-outline', title: 'Email', subtitle: email,
    onPress: () => Linking.openURL(`mailto:${email}`),
  });
  if (website) rows.push({
    icon: 'web', title: 'Website', subtitle: prettyHost(website),
    onPress: () => Linking.openURL(website),
  });
  if (instagram) rows.push({
    icon: 'instagram', title: 'Instagram',
    subtitle: '@' + prettyHost(instagram).replace(/^.*instagram\.com\//, '').replace(/\/$/, ''),
    onPress: () => Linking.openURL(instagram),
  });
  rows.push({
    icon: 'map-marker-outline', title: 'Location',
    onPress: () => navigation.navigate('ResortMap', { pinId: 'gym' }),
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
