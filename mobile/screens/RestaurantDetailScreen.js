import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import VenueDetailPage from '../components/VenueDetailPage';
import { useVenue } from '../data/venues';
import { colors } from '../theme';

export default function RestaurantDetailScreen({ navigation, route }) {
  const id = route?.params?.id;
  const { venue, loading } = useVenue(id);

  if (loading && !venue) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

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
      website={venue.website}
      menuUrl={venue.menuUrl}
      showMenuButton
      mapPinId={venue.mapPinId}
    />
  );
}
