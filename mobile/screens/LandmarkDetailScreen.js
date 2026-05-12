import React from 'react';
import VenueDetailPage from '../components/VenueDetailPage';
import { useLandmark } from '../data/landmarks';

export default function LandmarkDetailScreen({ navigation, route }) {
  const landmark = useLandmark(route?.params?.id);

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

  const images = landmark.images && landmark.images.length
    ? landmark.images
    : [landmark.image];

  return (
    <VenueDetailPage
      navigation={navigation}
      title={landmark.name}
      subtitle={landmark.subtitle}
      images={images}
      description={landmark.description}
      highlights={landmark.bullets}
      address={landmark.address}
      phone={landmark.phone}
      website={landmark.website}
    />
  );
}
