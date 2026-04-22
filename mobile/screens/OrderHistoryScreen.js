import React, { useCallback, useState } from 'react';
import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { HeaderScreen, Card, Loading } from '../components/ui';
import { colors, spacing, font } from '../theme';
import { api } from '../api';

const PAST_ORDER_STATUSES = new Set(['delivered', 'cancelled']);
const PAST_BOOKING_STATUSES = new Set(['completed', 'cancelled']);
const ROOM_TYPES = new Set(['room', 'chalet', 'stay']);

export default function OrderHistoryScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [orders, bookings] = await Promise.all([
      api.myDeliveries().catch(() => []),
      api.myBookings().catch(() => []),
    ]);
    const pastOrders = orders
      .filter(d => PAST_ORDER_STATUSES.has(d.status))
      .map(d => ({ kind: 'order', id: `o-${d.id}`, when: d.created_at, data: d }));
    const pastBookings = bookings
      .filter(b => !ROOM_TYPES.has(b.resource_type) && PAST_BOOKING_STATUSES.has(b.status))
      .map(b => ({ kind: 'booking', id: `b-${b.id}`, when: b.start_time || b.created_at, data: b }));
    const combined = [...pastOrders, ...pastBookings].sort((a, b) => new Date(b.when) - new Date(a.when));
    setItems(combined);
    setLoading(false);
    setRefreshing(false);
  }, []);
  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  const onRefresh = () => { setRefreshing(true); load(); };

  return (
    <HeaderScreen title="Order history" navigation={navigation} onRefresh={onRefresh} refreshing={refreshing}>
      {loading ? <Loading /> : items.length === 0 ? (
        <Text style={{ ...font.small, textAlign: 'center', marginTop: spacing.xl }}>
          No past activity yet. Completed deliveries and bookings will appear here.
        </Text>
      ) : items.map(it => it.kind === 'order'
        ? <OrderCard key={it.id} d={it.data} />
        : <BookingCard key={it.id} b={it.data} />
      )}
    </HeaderScreen>
  );
}

function OrderCard({ d }) {
  return (
    <Card>
      <View style={{ padding: spacing.md }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <MaterialCommunityIcons name="shopping-outline" size={18} color={colors.accent} style={{ marginRight: 8 }} />
            <Text style={font.h3}>{d.restaurant_name || 'Delivery'}</Text>
          </View>
          <StatusChip s={d.status} />
        </View>
        <Text style={{ ...font.small, marginTop: 2 }}>To: {d.room_or_chalet}</Text>
        <Text style={{ ...font.small, marginTop: 2 }}>
          {(d.items || []).map(i => `${i.qty}× ${i.name}`).join(', ')}
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm }}>
          <Text style={font.small}>{new Date(d.created_at).toLocaleString()}</Text>
          <Text style={{ fontWeight: '700' }}>${Number(d.total).toFixed(2)}</Text>
        </View>
      </View>
    </Card>
  );
}

function BookingCard({ b }) {
  return (
    <Card>
      <View style={{ padding: spacing.md }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <MaterialCommunityIcons name="calendar-check-outline" size={18} color={colors.accent} style={{ marginRight: 8 }} />
            <Text style={font.h3}>{b.resource_name || humanize(b.resource_type)}</Text>
          </View>
          <StatusChip s={b.status} />
        </View>
        <Text style={{ ...font.small, marginTop: 4 }}>{new Date(b.start_time).toLocaleString()}</Text>
        {b.party_size ? <Text style={font.small}>Party of {b.party_size}</Text> : null}
        {b.notes ? <Text style={{ ...font.small, marginTop: 4, fontStyle: 'italic' }}>"{b.notes}"</Text> : null}
      </View>
    </Card>
  );
}

function StatusChip({ s }) {
  const map = {
    delivered: ['#d4edda', '#155724'],
    completed: ['#d1ecf1', '#0c5460'],
    cancelled: ['#f5c6cb', '#721c24'],
  };
  const [bg, fg] = map[s] || ['#eee', '#444'];
  return (
    <View style={{ backgroundColor: bg, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 }}>
      <Text style={{ color: fg, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' }}>{s}</Text>
    </View>
  );
}

function humanize(s) { return (s || '').replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase()); }
