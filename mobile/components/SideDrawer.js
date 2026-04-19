import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius } from '../theme';
import { useAuth } from '../App';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(width * 0.82, 340);

const ITEMS = [
  { key: 'language', icon: '🌐', title: 'Language', subtitle: 'English' },
  { key: 'notifications', icon: '🔔', title: 'Notifications', subtitle: 'Alerts & preferences' },
  { key: 'legal', icon: '📄', title: 'Legal', subtitle: 'Terms & privacy' },
];

export default function SideDrawer({ visible, onClose, navigation }) {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const slide = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slide, { toValue: 0, duration: 260, useNativeDriver: true }),
        Animated.timing(fade, { toValue: 1, duration: 260, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slide, { toValue: -DRAWER_WIDTH, duration: 220, useNativeDriver: true }),
        Animated.timing(fade, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, slide, fade]);

  const handleItem = (key) => {
    onClose();
    setTimeout(() => {
      if (key === 'notifications') navigation.navigate('Notifications');
      else navigation.navigate('Info');
    }, 220);
  };

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => { onClose(); signOut(); } },
    ]);
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.backdrop, { opacity: fade }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View
        style={[
          styles.drawer,
          { transform: [{ translateX: slide }], paddingTop: insets.top + 20 },
        ]}
      >
        <View style={styles.header}>
          <Text style={styles.brand}>PORTEMILIO</Text>
          <Text style={styles.brandSub}>HOTEL & RESORT</Text>
          {user ? (
            <Text style={styles.userLine}>
              {user.name || user.email || 'Guest'}
            </Text>
          ) : null}
        </View>

        <View style={styles.divider} />

        <View style={{ flex: 1 }}>
          {ITEMS.map(item => (
            <Pressable
              key={item.key}
              style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.border + '80' }]}
              onPress={() => handleItem(item.key)}
            >
              <Text style={styles.rowIcon}>{item.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{item.title}</Text>
                {item.subtitle ? <Text style={styles.rowSubtitle}>{item.subtitle}</Text> : null}
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          ))}
        </View>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <Pressable
            style={({ pressed }) => [styles.signOutBtn, pressed && { opacity: 0.85 }]}
            onPress={handleSignOut}
          >
            <Text style={styles.signOutText}>Sign out</Text>
          </Pressable>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 12,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  brand: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.accent,
    letterSpacing: 3,
  },
  brandSub: {
    fontSize: 10,
    color: colors.subtle,
    letterSpacing: 2,
    marginTop: 4,
  },
  userLine: {
    fontSize: 14,
    color: colors.subtle,
    marginTop: 14,
  },
  divider: { height: 1, backgroundColor: colors.border, marginHorizontal: 24 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  rowIcon: { fontSize: 22, marginRight: 16 },
  rowTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  rowSubtitle: { fontSize: 13, color: colors.subtle, marginTop: 2 },
  chevron: { fontSize: 22, color: colors.muted },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  signOutBtn: {
    backgroundColor: colors.bg,
    paddingVertical: 14,
    borderRadius: radius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  signOutText: { color: colors.danger, fontSize: 15, fontWeight: '700' },
});
