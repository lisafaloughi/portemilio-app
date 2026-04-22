import React, { useCallback, useLayoutEffect, useState } from 'react';
import { View, Text, Linking, Pressable, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Card, Loading } from '../components/ui';
import { colors, spacing, radius, font } from '../theme';
import { api } from '../api';

const TABS = [
  { key: 'orders', label: 'Orders', icon: 'shopping-outline' },
  { key: 'bookings', label: 'Bookings', icon: 'calendar-blank-outline' },
  { key: 'contact', label: 'Contact', icon: 'message-text-outline' },
];

const CONTACT_KEYS = [
  ['welcome_message',  'Welcome'],
  ['address',          'Address'],
  ['front_desk_phone', 'Front desk'],
  ['emergency_phone',  'Emergency'],
  ['wifi_name',        'Wi-Fi network'],
  ['wifi_password',    'Wi-Fi password'],
];

const LIVE_ORDER_STATUSES = new Set(['pending', 'preparing']);
const LIVE_BOOKING_STATUSES = new Set(['pending', 'confirmed']);

const SOCIAL = {
  instagram: 'https://instagram.com/portemilio',
  facebook: 'https://www.facebook.com/PortemilioHotelResort',
  website: 'https://portemilio.com',
};

export default function InfoScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState('orders');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [contact, setContact] = useState({});

  useLayoutEffect(() => {
    navigation?.setOptions({ headerShown: false });
  }, [navigation]);

  const load = useCallback(async () => {
    const [dRes, bRes, sRes] = await Promise.all([
      api.myDeliveries().catch(() => []),
      api.myBookings().catch(() => []),
      Promise.all(CONTACT_KEYS.map(([k]) => api.setting(k).catch(() => ({ value: '' })))),
    ]);
    setOrders(dRes.filter(d => LIVE_ORDER_STATUSES.has(d.status)));
    setBookings(bRes.filter(b => LIVE_BOOKING_STATUSES.has(b.status)));
    const obj = {};
    CONTACT_KEYS.forEach(([k], i) => obj[k] = sRes[i].value);
    setContact(obj);
    setLoading(false);
    setRefreshing(false);
  }, []);
  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  const onRefresh = () => { setRefreshing(true); load(); };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>Live requests</Text>
        <View style={{ width: 38 }} />
      </View>

      <View style={styles.tabRow}>
        {TABS.map(t => {
          const active = t.key === tab;
          return (
            <Pressable key={t.key} style={styles.tab} onPress={() => setTab(t.key)}>
              <MaterialCommunityIcons
                name={t.icon}
                size={20}
                color={active ? colors.accent : colors.subtle}
                style={{ marginBottom: 4 }}
              />
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]} numberOfLines={1}>
                {t.label}
              </Text>
              <View style={[styles.tabUnderline, active && styles.tabUnderlineActive]} />
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xxl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading ? (
          <Loading />
        ) : (
          <>
            {tab === 'orders' && <OrdersTab orders={orders} />}
            {tab === 'bookings' && <BookingsTab bookings={bookings} />}
            {tab === 'contact' && <ContactTab contact={contact} />}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function OrdersTab({ orders }) {
  if (orders.length === 0) {
    return <EmptyState icon="shopping-outline" text="No live orders right now." />;
  }
  return (
    <>
      {orders.map(d => (
        <Card key={d.id}>
          <View style={{ padding: spacing.md }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={font.h3}>{d.restaurant_name || 'Delivery'}</Text>
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
      ))}
    </>
  );
}

function BookingsTab({ bookings }) {
  if (bookings.length === 0) {
    return <EmptyState icon="calendar-blank-outline" text="No upcoming bookings." />;
  }
  return (
    <>
      {bookings.map(b => (
        <Card key={b.id}>
          <View style={{ padding: spacing.md }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={font.h3}>{b.resource_name || humanize(b.resource_type)}</Text>
              <StatusChip s={b.status} />
            </View>
            <Text style={{ ...font.small, marginTop: 4 }}>{new Date(b.start_time).toLocaleString()}</Text>
            {b.party_size ? <Text style={font.small}>Party of {b.party_size}</Text> : null}
            {b.notes ? <Text style={{ ...font.small, marginTop: 4, fontStyle: 'italic' }}>"{b.notes}"</Text> : null}
          </View>
        </Card>
      ))}
    </>
  );
}

function ContactTab({ contact }) {
  return (
    <>
      <Card>
        <View style={{ padding: spacing.md }}>
          <Text style={styles.contactTitle}>Portemilio Resort</Text>
          <Text style={{ ...font.small, marginTop: 2 }}>Kaslik · Lebanon</Text>
          {CONTACT_KEYS.map(([k, label]) => contact[k] ? (
            <View key={k} style={{ marginTop: spacing.md }}>
              <Text style={{ ...font.small, color: colors.muted }}>{label}</Text>
              <Text
                style={{ ...font.body, color: (k.includes('phone') ? colors.accent : colors.text), marginTop: 2 }}
                onPress={k.includes('phone') ? () => Linking.openURL(`tel:${contact[k]}`) : undefined}
              >
                {contact[k]}
              </Text>
            </View>
          ) : null)}
        </View>
      </Card>

      <Text style={styles.socialHeading}>Follow us</Text>
      <View style={styles.socialRow}>
        <SocialButton icon="instagram" label="Instagram" url={SOCIAL.instagram} />
        <SocialButton icon="facebook" label="Facebook" url={SOCIAL.facebook} />
        <SocialButton icon="web" label="Website" url={SOCIAL.website} />
      </View>
    </>
  );
}

function SocialButton({ icon, label, url }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.socialBtn, pressed && { opacity: 0.75 }]}
      onPress={() => Linking.openURL(url)}
    >
      <MaterialCommunityIcons name={icon} size={26} color={colors.accent} />
      <Text style={styles.socialLabel}>{label}</Text>
    </Pressable>
  );
}

function EmptyState({ icon, text }) {
  return (
    <View style={styles.empty}>
      <MaterialCommunityIcons name={icon} size={36} color={colors.muted} />
      <Text style={{ ...font.small, marginTop: spacing.sm, textAlign: 'center' }}>{text}</Text>
    </View>
  );
}

function StatusChip({ s }) {
  const map = {
    pending: ['#fff3cd', '#856404'],
    preparing: ['#fde2b3', '#8a5a00'],
    confirmed: ['#d4edda', '#155724'],
  };
  const [bg, fg] = map[s] || ['#eee', '#444'];
  return (
    <View style={{ backgroundColor: bg, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 }}>
      <Text style={{ color: fg, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' }}>{s}</Text>
    </View>
  );
}

function humanize(s) { return (s || '').replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase()); }

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: colors.surface,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },

  tabRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: { flex: 1, paddingTop: 6, alignItems: 'center' },
  tabLabel: { fontSize: 12, color: colors.subtle, fontWeight: '500' },
  tabLabelActive: { color: colors.accent, fontWeight: '700' },
  tabUnderline: { height: 3, width: '70%', marginTop: 6, backgroundColor: 'transparent', borderRadius: 2 },
  tabUnderlineActive: { backgroundColor: colors.accent },

  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },

  contactTitle: { fontSize: 20, fontWeight: '700', color: colors.accent },

  socialHeading: { ...font.tiny, textTransform: 'uppercase', letterSpacing: 1, marginTop: spacing.lg, marginBottom: spacing.sm, marginLeft: spacing.xs, color: colors.accent, fontWeight: '700' },
  socialRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  socialBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  socialLabel: { ...font.small, color: colors.text, fontWeight: '600', marginTop: 4 },
});
