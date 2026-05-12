import React from 'react';
import { Linking } from 'react-native';
import CategoryPage from '../components/CategoryPage';
import { useService, serviceImages } from '../data/services';

const FALLBACK = {
  title: 'Front Desk',
  description: 'Our team is here for you around the clock. Concierge, requests, late check-out, anything you need — just ask.',
  phone: '+9619123456',
  email: 'frontdesk@portemilio.com',
  hours: '24 hours, every day',
  location: 'Lobby · Ground floor',
  image: require('../assets/front-desk.jpg'),
};

export default function FrontDeskScreen({ navigation }) {
  const s = useService('front_desk');
  const title = s?.name || FALLBACK.title;
  const description = s?.description || FALLBACK.description;
  const phone = s?.phone || FALLBACK.phone;
  const email = s?.email || FALLBACK.email;
  const hours = s?.hours || FALLBACK.hours;
  const location = s?.location || FALLBACK.location;
  const images = (() => {
    const fromApi = serviceImages(s);
    return fromApi.length ? fromApi : [FALLBACK.image];
  })();

  const rows = [];
  if (hours) rows.push({ icon: 'clock-outline', title: 'Open', subtitle: hours });
  if (phone) rows.push({
    icon: 'phone-outline', title: 'Call front desk', subtitle: phone,
    onPress: () => Linking.openURL(`tel:${phone.replace(/\s+/g, '')}`),
  });
  if (email) rows.push({
    icon: 'email-outline', title: 'Email us', subtitle: email,
    onPress: () => Linking.openURL(`mailto:${email}`),
  });
  if (location) rows.push({ icon: 'map-marker-outline', title: 'Location', subtitle: location });

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
