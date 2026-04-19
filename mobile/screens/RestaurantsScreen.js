import React, { useCallback, useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { Screen, Card, PlaceholderImage, Loading, Chip } from '../components/ui';
import { colors, spacing, font } from '../theme';
import { api } from '../api';

export default function RestaurantsScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => api.restaurants().then(r => { setItems(r); setLoading(false); setRefreshing(false); }), []);
  useEffect(() => { load(); }, [load]);

  if (loading) return <Screen><Loading /></Screen>;
  return (
    <Screen refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }}>
      {items.map(r => (
        <Card key={r.id} onPress={() => navigation.navigate('RestaurantDetail', { id: r.id, title: r.name })}>
          <PlaceholderImage keyName={r.name} category={r.cuisine} height={150} />
          <View style={{ padding: spacing.md }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={font.h3}>{r.name}</Text>
              {r.delivery ? <Chip label="Delivery" /> : null}
            </View>
            <Text style={{ ...font.small, marginTop: 2 }}>{r.cuisine} · {r.hours}</Text>
            {r.description ? <Text style={{ ...font.small, marginTop: spacing.sm }}>{r.description}</Text> : null}
          </View>
        </Card>
      ))}
      {items.length === 0 && <Text style={{ ...font.small, textAlign: 'center', marginTop: spacing.xl }}>No restaurants yet.</Text>}
    </Screen>
  );
}
