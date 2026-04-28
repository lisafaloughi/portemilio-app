import React, { useCallback, useState } from 'react';
import { View, Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { HeaderScreen, Card, Loading } from '../components/ui';
import { spacing, font } from '../theme';
import { api } from '../api';
import { useAuth } from '../App';

export default function NotificationsScreen({ navigation }) {
  const { isGuest } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(!isGuest);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    if (isGuest) {
      setItems([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    api.myNotifications()
      .then(r => setItems(r))
      .catch(() => setItems([]))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }, [isGuest]);

  useFocusEffect(useCallback(() => {
    if (!isGuest) setLoading(true);
    load();
  }, [load, isGuest]));

  const onRefresh = () => { setRefreshing(true); load(); };

  return (
    <HeaderScreen title="Alerts" navigation={navigation} onRefresh={onRefresh} refreshing={refreshing}>
      {loading ? (
        <Loading />
      ) : items.length === 0 ? (
        <Text style={{ ...font.small, textAlign: 'center', marginTop: spacing.xl }}>No notifications yet.</Text>
      ) : items.map(n => (
        <Card key={n.id}>
          <View style={{ padding: spacing.md }}>
            <Text style={font.h3}>{n.title}</Text>
            {n.body ? <Text style={{ ...font.body, marginTop: 4 }}>{n.body}</Text> : null}
            <Text style={{ ...font.tiny, marginTop: spacing.sm }}>{new Date(n.created_at).toLocaleString()}</Text>
          </View>
        </Card>
      ))}
    </HeaderScreen>
  );
}
