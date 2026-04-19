import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { Screen, Card, PlaceholderImage, Loading } from '../components/ui';
import { colors, spacing, font } from '../theme';
import { api } from '../api';

export default function CategoryScreen({ route, navigation }) {
  const { category } = route.params;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.facilities().then(all => {
      setItems(all.filter(f => f.category === category));
      setLoading(false);
    });
  }, [category]);

  if (loading) return <Screen><Loading /></Screen>;
  return (
    <Screen>
      {items.map(f => (
        <Card key={f.id} onPress={() => navigation.navigate('FacilityDetail', { facilityKey: f.key, title: f.name })}>
          <PlaceholderImage keyName={f.key} category={f.category} height={140} />
          <Text style={{ ...font.h3, padding: spacing.md, paddingBottom: 2 }}>{f.name}</Text>
          <Text style={{ ...font.small, paddingHorizontal: spacing.md }}>{f.hours}</Text>
          {f.description ? <Text style={{ ...font.small, padding: spacing.md }}>{f.description}</Text> : null}
        </Card>
      ))}
      {items.length === 0 && <Text style={{ ...font.small, textAlign: 'center', marginTop: spacing.xl }}>Nothing in this category yet.</Text>}
    </Screen>
  );
}
