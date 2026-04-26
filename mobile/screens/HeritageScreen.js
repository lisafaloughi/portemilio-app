import React from 'react';
import CategoryPage from '../components/CategoryPage';

export default function HeritageScreen({ navigation }) {
  return (
    <CategoryPage
      navigation={navigation}
      title="Since 1996"
      images={[require('../assets/portemilio_vintage.jpg')]}
      description={
        "For three decades, Portemilio has been the chosen retreat of royalty, dignitaries, and Lebanon's most distinguished gatherings — a quiet tradition of refined hospitality on 50,000 m² of Mediterranean gardens."
      }
      rows={[
        {
          icon: 'calendar-star',
          title: 'Inaugurated',
          subtitle: '1996 · A storied seaside escape',
        },
        {
          icon: 'crown-outline',
          title: 'Distinguished guests',
          subtitle: 'Royalty, dignitaries, and heads of state',
        },
        {
          icon: 'star-circle-outline',
          title: 'A prestigious address',
          subtitle: "Host to Lebanon's most refined occasions",
        },
        {
          icon: 'pine-tree',
          title: 'The grounds',
          subtitle: '50,000 m² of seaside gardens · Kaslik–Jounieh coast',
        },
      ]}
    />
  );
}
