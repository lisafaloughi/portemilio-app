import React, { useCallback, useState } from 'react';
import { View, Text, Pressable, Modal, ScrollView, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { HeaderScreen, Card, Loading } from '../components/ui';
import { colors, spacing, font, radius } from '../theme';
import { api } from '../api';
import { useAuth } from '../App';

function formatStamp(s) {
  if (!s) return '';
  const d = new Date(s.includes('T') ? s : s.replace(' ', 'T') + 'Z');
  if (isNaN(d)) return s;
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function NotificationsScreen({ navigation }) {
  const { isGuest } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(!isGuest);
  const [refreshing, setRefreshing] = useState(false);
  const [opened, setOpened] = useState(null);

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

  const openNotification = (n) => {
    setOpened(n);
    if (!n.read) {
      api.markNotificationRead(n.id).catch(() => {});
      setItems(prev => prev.map(item => item.id === n.id ? { ...item, read: 1 } : item));
    }
  };

  return (
    <HeaderScreen title="Notifications" navigation={navigation} onRefresh={onRefresh} refreshing={refreshing}>
      {loading ? (
        <Loading />
      ) : items.length === 0 ? (
        <Text style={{ ...font.small, textAlign: 'center', marginTop: spacing.xl }}>No notifications yet.</Text>
      ) : items.map(n => (
        <Pressable key={n.id} onPress={() => openNotification(n)}>
          <Card>
            <View style={styles.notifRow}>
              {!n.read && <View style={styles.unreadDot} />}
              <View style={{ flex: 1 }}>
                <Text style={[font.h3, !n.read && styles.unreadTitle]} numberOfLines={1}>{n.title}</Text>
                {n.body ? (
                  <Text style={{ ...font.body, marginTop: 4, color: colors.subtle }} numberOfLines={2}>
                    {n.body}
                  </Text>
                ) : null}
                <Text style={{ ...font.tiny, marginTop: spacing.sm }}>
                  {formatStamp(n.created_at)}
                </Text>
              </View>
            </View>
          </Card>
        </Pressable>
      ))}

      <Modal
        transparent
        animationType="fade"
        visible={!!opened}
        onRequestClose={() => setOpened(null)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpened(null)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation && e.stopPropagation()}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetStamp}>{opened ? formatStamp(opened.created_at) : ''}</Text>
              <Pressable hitSlop={10} onPress={() => setOpened(null)}>
                <MaterialCommunityIcons name="close" size={22} color={colors.subtle} />
              </Pressable>
            </View>
            <Text style={styles.sheetTitle}>{opened?.title || ''}</Text>
            <ScrollView style={styles.sheetScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.sheetBody}>{opened?.body || ''}</Text>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </HeaderScreen>
  );
}

const styles = StyleSheet.create({
  notifRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    gap: 10,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e03030',
    marginTop: 6,
    flexShrink: 0,
  },
  unreadTitle: {
    color: colors.accent,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl + 16,
    maxHeight: '75%',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sheetStamp: {
    ...font.tiny,
    color: colors.muted,
  },
  sheetTitle: {
    ...font.h2,
    color: colors.accent,
    marginBottom: spacing.md,
  },
  sheetScroll: {
    maxHeight: 360,
  },
  sheetBody: {
    ...font.body,
    color: colors.text,
    lineHeight: 22,
  },
});
