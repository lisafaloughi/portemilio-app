import React, { useCallback, useLayoutEffect, useState } from 'react';
import { View, Text, Linking, Pressable, StyleSheet, ScrollView, RefreshControl, Modal } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Card, Loading } from '../components/ui';
import { colors, spacing, font } from '../theme';
import { api } from '../api';

const TABS = [
  { key: 'orders', label: 'Orders', icon: 'shopping-outline' },
  { key: 'bookings', label: 'Bookings', icon: 'calendar-blank-outline' },
  { key: 'contact', label: 'Contact', icon: 'message-text-outline' },
];

const LIVE_ORDER_STATUSES = new Set(['pending', 'preparing']);
const LIVE_BOOKING_STATUSES = new Set(['pending', 'confirmed']);

const HOTEL_PHONE = '+961 9 933 300';
const WHATSAPP_PHONE = '+961 81 697 272';
const HOTEL_EMAIL = 'reservation@portemilio.com';
const INSTAGRAM_URL = 'https://www.instagram.com/portemilio/';
const FACEBOOK_URL = 'https://www.facebook.com/PortemilioHotelResort/';
const WEBSITE_URL = 'https://www.portemilio.com';

const digits = (n) => n.replace(/\D/g, '');
const openUrl = (url) => Linking.openURL(url).catch(() => {});

const CONTACTS = [
  {
    icon: 'phone-outline',
    title: 'Call the front desk',
    subtitle: HOTEL_PHONE,
    action: () => openUrl(`tel:+${digits(HOTEL_PHONE)}`),
  },
  {
    icon: 'whatsapp',
    title: 'WhatsApp',
    subtitle: WHATSAPP_PHONE,
    action: () => openUrl(`https://wa.me/${digits(WHATSAPP_PHONE)}`),
  },
  {
    icon: 'email-outline',
    title: 'Email reservations',
    subtitle: HOTEL_EMAIL,
    action: () => openUrl(`mailto:${HOTEL_EMAIL}`),
  },
  {
    icon: 'map-marker-outline',
    title: 'Visit us',
    subtitle: 'Kaslik Seaside Road | Jounieh Lebanon',
    action: () => openUrl('https://maps.google.com/?q=Portemilio+Hotel+Kaslik'),
  },
];

export default function InfoScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState('orders');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  useLayoutEffect(() => {
    navigation?.setOptions({ headerShown: false });
  }, [navigation]);

  const load = useCallback(async () => {
    const [dRes, bRes] = await Promise.all([
      api.myDeliveries().catch(() => []),
      api.myBookings().catch(() => []),
    ]);
    setOrders(dRes.filter(d => LIVE_ORDER_STATUSES.has(d.status)));
    setBookings(bRes.filter(b => LIVE_BOOKING_STATUSES.has(b.status)));
    setLoading(false);
    setRefreshing(false);
  }, []);
  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  const onRefresh = () => { setRefreshing(true); load(); };

  const confirmCancel = async () => {
    if (!cancelTarget || cancelling) return;
    setCancelling(true);
    try {
      await api.cancelBooking(cancelTarget.id);
      setCancelTarget(null);
      load();
    } catch {
      setCancelTarget(null);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>Active Requests</Text>
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
            {tab === 'bookings' && <BookingsTab bookings={bookings} onCancel={setCancelTarget} />}
            {tab === 'contact' && <ContactTab />}
          </>
        )}
      </ScrollView>
      {/* Cancel confirmation modal */}
      <Modal transparent animationType="fade" visible={!!cancelTarget} onRequestClose={() => setCancelTarget(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <MaterialCommunityIcons name="calendar-remove-outline" size={38} color="#e03030" style={{ alignSelf: 'center', marginBottom: 8 }} />
            <Text style={styles.modalTitle}>Cancel this booking?</Text>
            {cancelTarget ? (() => {
              const start = new Date(cancelTarget.start_time.includes('T') ? cancelTarget.start_time : cancelTarget.start_time.replace(' ', 'T') + 'Z');
              const end = cancelTarget.end_time ? new Date(cancelTarget.end_time.includes('T') ? cancelTarget.end_time : cancelTarget.end_time.replace(' ', 'T') + 'Z') : null;
              const dayLabel = start.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
              const startLabel = start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
              const endLabel = end ? end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : null;
              return (
                <Text style={styles.modalBody}>
                  {cancelTarget.resource_name || humanize(cancelTarget.resource_type)}{'\n'}
                  {dayLabel}{'\n'}
                  {startLabel}{endLabel ? ` – ${endLabel}` : ''}
                </Text>
              );
            })() : null}
            <View style={styles.modalActions}>
              <Pressable style={[styles.modalBtn, styles.modalBtnGhost]} onPress={() => setCancelTarget(null)}>
                <Text style={styles.modalBtnGhostText}>Keep it</Text>
              </Pressable>
              <Pressable style={[styles.modalBtn, styles.modalBtnDanger]} disabled={cancelling} onPress={confirmCancel}>
                <Text style={styles.modalBtnPrimaryText}>{cancelling ? 'Cancelling…' : 'Cancel booking'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
            {(() => {
              let destination = null;
              if (d.chalet_number) destination = `Chalet ${d.chalet_number}`;
              else if (d.room_number) destination = `Hotel room ${d.room_number}`;
              else if (d.notes && /Deliver to:\s*([^.]+)/i.test(d.notes)) {
                destination = d.notes.match(/Deliver to:\s*([^.]+)/i)[1].trim();
              } else if (d.room_or_chalet) {
                destination = d.room_or_chalet;
              }
              return destination ? (
                <Text style={{ ...font.small, marginTop: 2 }}>To: {destination}</Text>
              ) : null;
            })()}
            <Text style={{ ...font.small, marginTop: 2 }}>
              {(d.items || []).map(i => `${i.qty}× ${i.name}`).join(', ')}
            </Text>
            {(() => {
              let scheduledLabel = null;
              if (d.scheduled_for) {
                scheduledLabel = new Date(d.scheduled_for).toLocaleTimeString(
                  [],
                  { hour: 'numeric', minute: '2-digit' }
                );
              } else if (d.notes && /Scheduled for ([^.]+)/i.test(d.notes)) {
                scheduledLabel = d.notes.match(/Scheduled for ([^.]+)/i)[1].trim();
              }
              if (!scheduledLabel) return null;
              return (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
                  <MaterialCommunityIcons name="clock-outline" size={14} color={colors.accent} />
                  <Text style={{ ...font.small, color: colors.accent, fontWeight: '700' }}>
                    Scheduled for {scheduledLabel}
                  </Text>
                </View>
              );
            })()}
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

function BookingsTab({ bookings, onCancel }) {
  if (bookings.length === 0) {
    return <EmptyState icon="calendar-blank-outline" text="No upcoming bookings." />;
  }
  return (
    <>
      {bookings.map(b => {
        const start = new Date(b.start_time.includes('T') ? b.start_time : b.start_time.replace(' ', 'T') + 'Z');
        const end = b.end_time ? new Date(b.end_time.includes('T') ? b.end_time : b.end_time.replace(' ', 'T') + 'Z') : null;
        const timeLabel = end
          ? `${start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} – ${end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
          : start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
        const dateLabel = start.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
        return (
          <Card key={b.id}>
            <View style={{ padding: spacing.md }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={font.h3}>{b.resource_name || humanize(b.resource_type)}</Text>
                <StatusChip s={b.status} />
              </View>
              <Text style={{ ...font.small, marginTop: 4 }}>{dateLabel} · {timeLabel}</Text>
              {b.party_size ? <Text style={font.small}>Party of {b.party_size}</Text> : null}
              {b.notes ? <Text style={{ ...font.small, marginTop: 4, fontStyle: 'italic' }}>"{b.notes}"</Text> : null}
              <Pressable
                style={styles.cancelBtn}
                onPress={() => onCancel(b)}
              >
                <MaterialCommunityIcons name="calendar-remove-outline" size={14} color="#e03030" />
                <Text style={styles.cancelBtnText}>Cancel booking</Text>
              </Pressable>
            </View>
          </Card>
        );
      })}
    </>
  );
}

function ContactTab() {
  return (
    <View>
      {CONTACTS.map((item, i) => (
        <Pressable
          key={i}
          style={({ pressed }) => [styles.contactRow, pressed && { opacity: 0.55 }]}
          onPress={item.action}
        >
          <MaterialCommunityIcons
            name={item.icon}
            size={22}
            color={colors.accent}
            style={{ marginRight: 18 }}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.contactRowTitle}>{item.title}</Text>
            <Text style={styles.contactRowSubtitle}>{item.subtitle}</Text>
          </View>
        </Pressable>
      ))}

      <Text style={styles.followLabel}>Follow us</Text>
      <View style={styles.socialRow}>
        <Pressable style={styles.socialBtn} onPress={() => openUrl(INSTAGRAM_URL)}>
          <MaterialCommunityIcons name="instagram" size={28} color="#c9a87bfe" />
        </Pressable>
        <Pressable style={styles.socialBtn} onPress={() => openUrl(FACEBOOK_URL)}>
          <MaterialCommunityIcons name="facebook" size={28} color="#c9a87bfe" />
        </Pressable>
        <Pressable style={styles.socialBtn} onPress={() => openUrl(WEBSITE_URL)}>
          <MaterialCommunityIcons name="web" size={28} color="#c9a87bfe" />
        </Pressable>
      </View>
    </View>
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

  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  contactRowTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  contactRowSubtitle: {
    fontSize: 13,
    color: colors.subtle,
    marginTop: 2,
  },
  followLabel: {
    fontSize: 12,
    letterSpacing: 1.5,
    fontWeight: '700',
    color: colors.subtle,
    textAlign: 'center',
    marginTop: 44,
    marginBottom: 18,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
  },
  socialBtn: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.md,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e03030',
  },
  cancelBtnText: { fontSize: 12, fontWeight: '600', color: '#e03030' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 24,
    width: '100%',
    maxWidth: 360,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: colors.accent,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalBody: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.subtle,
    textAlign: 'center',
    marginBottom: 18,
  },
  modalActions: { flexDirection: 'row', gap: 10 },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  modalBtnGhost: {
    backgroundColor: colors.bg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  modalBtnGhostText: { color: colors.text, fontWeight: '600', fontSize: 14 },
  modalBtnDanger: { backgroundColor: '#e03030' },
  modalBtnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
