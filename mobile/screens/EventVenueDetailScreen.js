import React from 'react';
import VenueDetailPage from '../components/VenueDetailPage';
import { eventVenueById } from '../data/eventVenues';

export default function EventVenueDetailScreen({ navigation, route }) {
  const venue = eventVenueById(route?.params?.id);

  if (!venue) {
    return (
      <VenueDetailPage
        navigation={navigation}
        title="Not found"
        images={[]}
        description="This venue couldn't be found."
      />
    );
  }

  return (
    <VenueDetailPage
      navigation={navigation}
      title={venue.name}
      subtitle={venue.specialty}
      images={venue.images}
      description={venue.description}
      highlights={venue.highlights}
      address={venue.address}
      phone={venue.phone}
      mapPinId={venue.mapPinId}
    />
  );
}
