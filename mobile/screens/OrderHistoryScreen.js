import React, { useCallback, useState } from 'react';
import { View, Text, Pressable, Alert, Modal, StyleSheet } from 'react-native';
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

  const confirmClear = () => {
    Alert.alert(
      'Clear history?',
      'This will permanently remove all your past orders and bookings. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear history',
          style: 'destructive',
          onPress: async () => {
            await Promise.all([
              api.clearDeliveryHistory().catch(() => {}),
              api.clearBookingHistory().catch(() => {}),
            ]);
            setItems([]);
          },
        },
      ],
      { cancelable: true }
    );
  };

  const [selectedOrder, setSelectedOrder] = useState(null);

  const clearBtn = items.length > 0 ? (
    <Pressable onPress={confirmClear} hitSlop={8}>
      <Text style={{ fontSize: 14, fontWeight: '600', color: '#e03030' }}>Clear history</Text>
    </Pressable>
  ) : null;

  return (
    <HeaderScreen title="Order history" navigation={navigation} onRefresh={onRefresh} refreshing={refreshing} rightAction={clearBtn}>
      {loading ? <Loading /> : items.length === 0 ? (
        <Text style={{ ...font.small, textAlign: 'center', marginTop: spacing.xl }}>
          No past activity yet. Completed deliveries and bookings will appear here.
        </Text>
      ) : items.map(it => it.kind === 'order'
        ? <OrderCard key={it.id} d={it.data} onPress={() => setSelectedOrder(it.data)} />
        : <BookingCard key={it.id} b={it.data} />
      )}

      <Modal transparent animationType="fade" visible={!!selectedOrder} onRequestClose={() => setSelectedOrder(null)}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{selectedOrder?.restaurant_name || 'Delivery'}</Text>
              <Pressable onPress={() => setSelectedOrder(null)} hitSlop={10} style={styles.closeBtn}>
                <MaterialCommunityIcons name="close" size={18} color={colors.text} />
              </Pressable>
            </View>

            <StatusChip s={selectedOrder?.status} />

            <View style={styles.divider} />

            <Text style={styles.sectionLabel}>Items</Text>
            {(selectedOrder?.items || []).map((item, i) => (
              <View key={i} style={styles.itemRow}>
                <Text style={styles.itemName}>{item.qty}× {item.name}</Text>
                <Text style={styles.itemPrice}>${(Number(item.price) * Number(item.qty)).toFixed(2)}</Text>
              </View>
            ))}

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="map-marker-outline" size={16} color={colors.subtle} />
              <Text style={styles.detailText}>{selectedOrder?.room_or_chalet || '—'}</Text>
            </View>
            {selectedOrder?.notes && !/^deliver to:/i.test(selectedOrder.notes.trim()) ? (
              <View style={styles.detailRow}>
                <MaterialCommunityIcons name="note-text-outline" size={16} color={colors.subtle} />
                <Text style={styles.detailText}>{selectedOrder.notes}</Text>
              </View>
            ) : null}
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="clock-outline" size={16} color={colors.subtle} />
              <Text style={styles.detailText}>{selectedOrder ? new Date(selectedOrder.created_at).toLocaleString() : ''}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalAmount}>${Number(selectedOrder?.total || 0).toFixed(2)}</Text>
            </View>
          </View>
        </View>
      </Modal>
    </HeaderScreen>
  );
}

function OrderCard({ d, onPress }) {
  return (
    <Card onPress={onPress}>
      <View style={{ padding: spacing.md }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <MaterialCommunityIcons name="shopping-outline" size={18} color={colors.accent} style={{ marginRight: 8 }} />
            <Text style={font.h3}>{d.restaurant_name || 'Delivery'}</Text>
          </View>
          <StatusChip s={d.status} />
        </View>
        <Text style={{ ...font.small, marginTop: 2 }}>
          {(d.items || []).map(i => `${i.qty}× ${i.name}`).join(', ')}
        </Text>
        <Text style={{ ...font.small, marginTop: 4, color: colors.muted }}>
          {new Date(d.created_at).toLocaleString()}
        </Text>
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
    delivered: ['#d4edda', '#155724', 'Delivered'],
    completed: ['#d1ecf1', '#0c5460', 'Completed'],
    cancelled: ['#f5c6cb', '#721c24', 'Cancelled'],
  };
  const [bg, fg, label] = map[s] || ['#eee', '#444', s];
  return (
    <View style={{ backgroundColor: bg, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 }}>
      <Text style={{ color: fg, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' }}>{label}</Text>
    </View>
  );
}

function humanize(s) { return (s || '').replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase()); }

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    color: colors.subtle,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  itemName: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: colors.subtle,
    flex: 1,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.accent,
  },
});
