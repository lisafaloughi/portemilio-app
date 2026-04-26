import React from 'react';
import VenueDetailPage from '../components/VenueDetailPage';
import { landmarkById } from '../data/landmarks';

export default function LandmarkDetailScreen({ navigation, route }) {
  const landmark = landmarkById(route?.params?.id);

  if (!landmark) {
    return (
      <VenueDetailPage
        navigation={navigation}
        title="Not found"
        images={[]}
        description="This place couldn't be found."
      />
    );
  }

  return (
    <VenueDetailPage
      navigation={navigation}
      title={landmark.name}
      subtitle={landmark.subtitle}
      images={[landmark.image]}
      description={landmark.description}
      highlights={landmark.bullets}
      address={landmark.address}
      phone={landmark.phone}
      website={landmark.website}
    />
  );
}
