import React from 'react';
import { Linking } from 'react-native';
import CategoryPage from '../components/CategoryPage';

export default function MaritimeAcademyScreen({ navigation }) {
  return (
    <CategoryPage
      navigation={navigation}
      title="Maritime Academy"
      images={[require('../assets/maritime_academy.png')]}
      description="Professional Maritime Education & Training. Boat cruise certifications, safety courses, and crew training — taught by experienced instructors."
      rows={[
        {
          icon: 'phone-outline',
          title: 'Call',
          subtitle: '+961 81 273 239',
          onPress: () => Linking.openURL('tel:+96181273239'),
        },
        {
          icon: 'email-outline',
          title: 'Email',
          subtitle: 'admissions@imaritime.academy',
          onPress: () => Linking.openURL('mailto:admissions@imaritime.academy'),
        },
        {
          icon: 'web',
          title: 'Website',
          subtitle: 'imaritimeacademy.com',
          onPress: () => Linking.openURL('https://www.imaritimeacademy.com/'),
        },
        {
          icon: 'instagram',
          title: 'Instagram',
          subtitle: '@maritimeacademyleb',
          onPress: () =>
            Linking.openURL('https://www.instagram.com/maritimeacademyleb/'),
        },
        {
          icon: 'map-marker-outline',
          title: 'Location',
          onPress: () => navigation.navigate('ResortMap', { pinId: 'gym' }),
        },
      ]}
    />
  );
}
