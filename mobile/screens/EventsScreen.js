import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { Screen, Card, PlaceholderImage, Button, Loading } from '../components/ui';
import { colors, spacing, font } from '../theme';
import { api } from '../api';

export default function EventsScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.events().then(r => { setItems(r); setLoading(false); }); }, []);
  if (loading) return <Screen><Loading /></Screen>;

  return (
    <Screen>
      {items.map(e => (
        <Card key={e.id}>
          <PlaceholderImage keyName={e.title} category="event" height={140} />
          <View style={{ padding: spacing.md }}>
            <Text style={font.h3}>{e.title}</Text>
            <Text style={{ ...font.small, marginTop: 2 }}>{new Date(e.start_time).toLocaleString()}</Text>
            {e.location ? <Text style={font.small}>{e.location}</Text> : null}
            {e.description ? <Text style={{ ...font.body, marginTop: spacing.sm }}>{e.description}</Text> : null}
            {e.bookable ? (
              <Button
                title="Book a spot"
                style={{ marginTop: spacing.md }}
                onPress={() => navigation.navigate('Booking', {
                  resource_type: 'event',
                  resource_id: e.id,
                  resource_name: e.title,
                  preset_start: e.start_time,
                  preset_end: e.end_time,
                })}
              />
            ) : null}
          </View>
        </Card>
      ))}
      {items.length === 0 && <Text style={{ ...font.small, textAlign: 'center', marginTop: spacing.xl }}>No upcoming events.</Text>}
    </Screen>
  );
}
