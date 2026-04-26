import React from 'react';
import { Linking } from 'react-native';
import CategoryPage from '../components/CategoryPage';

const TRANSPORT_PHONE = '+9619123475';

export default function GetToCityScreen({ navigation }) {
  return (
    <CategoryPage
      navigation={navigation}
      title="Get to the City"
      images={[require('../assets/transport-to-the-city.png')]}
      description="Heading into Beirut, Byblos, or beyond? We arrange a private car or a group van — daily, 7 AM – 11 PM. Call us to book."
      rows={[
        {
          icon: 'phone-outline',
          title: 'Call to book',
          subtitle: TRANSPORT_PHONE,
          onPress: () =>
            Linking.openURL(`tel:${TRANSPORT_PHONE.replace(/\s+/g, '')}`),
        },
        {
          icon: 'van-passenger',
          title: 'Van',
          subtitle: 'Up to 8 passengers',
        },
        {
          icon: 'car',
          title: 'Private Car',
          subtitle: 'Up to 4 passengers',
        },
      ]}
    />
  );
}
