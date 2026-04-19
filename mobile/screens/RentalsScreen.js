import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { Screen, Card, PlaceholderImage, Button, Loading } from '../components/ui';
import { colors, spacing, font } from '../theme';
import { api } from '../api';

export default function RentalsScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.rentals().then(r => { setItems(r); setLoading(false); }); }, []);

  if (loading) return <Screen><Loading /></Screen>;

  const grouped = {};
  for (const it of items) (grouped[it.category || 'Other'] ||= []).push(it);

  return (
    <Screen>
      {Object.entries(grouped).map(([cat, list]) => (
        <View key={cat} style={{ marginBottom: spacing.md }}>
          <Text style={{ ...font.h2, marginBottom: spacing.sm }}>{humanize(cat)}</Text>
          {list.map(r => (
            <Card key={r.id}>
              <PlaceholderImage keyName={r.name} category={r.category} height={140} />
              <View style={{ padding: spacing.md }}>
                <Text style={font.h3}>{r.name}</Text>
                {r.description ? <Text style={{ ...font.small, marginTop: 2 }}>{r.description}</Text> : null}
                <Text style={{ ...font.body, fontWeight: '700', marginTop: 6 }}>${Number(r.price_per_hour).toFixed(2)} / hour</Text>
                <Button
                  title="Rent this"
                  style={{ marginTop: spacing.md }}
                  onPress={() => navigation.navigate('Booking', {
                    resource_type: 'rental',
                    resource_id: r.id,
                    resource_name: r.name,
                  })}
                />
              </View>
            </Card>
          ))}
        </View>
      ))}
    </Screen>
  );
}
function humanize(s) { return s.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase()); }
