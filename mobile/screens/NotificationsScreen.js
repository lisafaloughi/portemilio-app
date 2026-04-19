import React, { useCallback, useState } from 'react';
import { View, Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Screen, Card, Loading } from '../components/ui';
import { colors, spacing, font } from '../theme';
import { api } from '../api';

export default function NotificationsScreen() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => api.myNotifications().then(r => { setItems(r); setLoading(false); }), []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) return <Screen><Loading /></Screen>;
  if (!items.length) return <Screen><Text style={{ ...font.small, textAlign: 'center', marginTop: spacing.xl }}>No notifications yet.</Text></Screen>;

  return (
    <Screen onRefresh={() => { setLoading(true); load(); }}>
      {items.map(n => (
        <Card key={n.id}>
          <View style={{ padding: spacing.md }}>
            <Text style={font.h3}>{n.title}</Text>
            {n.body ? <Text style={{ ...font.body, marginTop: 4 }}>{n.body}</Text> : null}
            <Text style={{ ...font.tiny, marginTop: spacing.sm }}>{new Date(n.created_at).toLocaleString()}</Text>
          </View>
        </Card>
      ))}
    </Screen>
  );
}
