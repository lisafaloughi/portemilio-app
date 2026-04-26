import React from 'react';
import { Linking } from 'react-native';
import CategoryPage from '../components/CategoryPage';

const CATERING_PHONE = '+9619123471';

export default function CateringScreen({ navigation }) {
  return (
    <CategoryPage
      navigation={navigation}
      title="Catering by Portemilio"
      images={[require('../assets/portemilio-catering.jpg')]}
      description="Custom catering for events, weddings, corporate gatherings, and private occasions — at the resort or off-site. Call us to plan your menu."
      rows={[
        {
          icon: 'phone-outline',
          title: 'Call for more info',
          subtitle: CATERING_PHONE,
          onPress: () =>
            Linking.openURL(`tel:${CATERING_PHONE.replace(/\s+/g, '')}`),
        },
      ]}
    />
  );
}
