import React, { useCallback, useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Screen, Card, Button, Loading } from '../components/ui';
import { colors, spacing, font } from '../theme';
import { api } from '../api';

export default function MyBookingsScreen() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => api.myBookings().then(r => { setItems(r); setLoading(false); }), []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) return <Screen><Loading /></Screen>;
  if (!items.length) return <Screen><Text style={{ ...font.small, textAlign: 'center', marginTop: spacing.xl }}>No bookings yet. Book tennis, spa, a rental, an event, or a restaurant table from the Home screen.</Text></Screen>;

  return (
    <Screen onRefresh={() => { setLoading(true); load(); }}>
      {items.map(b => (
        <Card key={b.id}>
          <View style={{ padding: spacing.md }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={font.h3}>{b.resource_name || humanize(b.resource_type)}</Text>
              <StatusChip s={b.status} />
            </View>
            <Text style={{ ...font.small, marginTop: 4 }}>{new Date(b.start_time).toLocaleString()}</Text>
            {b.party_size ? <Text style={font.small}>Party of {b.party_size}</Text> : null}
            {b.notes ? <Text style={{ ...font.small, marginTop: 4, fontStyle: 'italic' }}>"{b.notes}"</Text> : null}
            {b.status !== 'cancelled' && b.status !== 'completed' ? (
              <Button
                title="Cancel booking"
                variant="danger"
                style={{ marginTop: spacing.md }}
                onPress={() => Alert.alert('Cancel booking?', '', [
                  { text: 'Keep', style: 'cancel' },
                  { text: 'Cancel booking', style: 'destructive', onPress: async () => {
                    await api.cancelBooking(b.id); load();
                  }},
                ])}
              />
            ) : null}
          </View>
        </Card>
      ))}
    </Screen>
  );
}

function StatusChip({ s }) {
  const map = {
    pending: ['#fff3cd', '#856404'],
    confirmed: ['#d4edda', '#155724'],
    cancelled: ['#f5c6cb', '#721c24'],
    completed: ['#d1ecf1', '#0c5460'],
  };
  const [bg, fg] = map[s] || ['#eee', '#444'];
  return (
    <View style={{ backgroundColor: bg, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 }}>
      <Text style={{ color: fg, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' }}>{s}</Text>
    </View>
  );
}
function humanize(s) { return (s || '').replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase()); }
