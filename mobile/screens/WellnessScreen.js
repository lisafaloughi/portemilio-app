import React from 'react';
import CategoryPage from '../components/CategoryPage';

export default function WellnessScreen({ navigation }) {
  return (
    <CategoryPage
      navigation={navigation}
      title="Wellness"
      images={[require('../assets/wellness-area.jpg')]}
      description="Spa, salon, gym, and pilates — wellness and relaxation under one roof."
      rows={[
        {
          icon: 'content-cut',
          title: 'Salon Antoinette',
          subtitle: 'Hair · Nails · Makeup',
          onPress: () => navigation.navigate('SalonAntoinette'),
        },
        {
          icon: 'spa-outline',
          title: 'Le Rodin Spa',
          subtitle: 'Massage · Body sculpting',
          onPress: () => navigation.navigate('LeRodin'),
        },
        {
          icon: 'dumbbell',
          title: 'SEArenity Club',
          subtitle: 'Gym · Classes · Personal training',
          onPress: () => navigation.navigate('SEArenityClub'),
        },
        {
          icon: 'yoga',
          title: 'Rove Pilates',
          subtitle: 'Group classes · Private sessions',
          onPress: () => navigation.navigate('RovePilates'),
        },
      ]}
    />
  );
}
