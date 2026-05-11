import React from 'react';
import { View, Text, StyleSheet, Alert, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { HeaderScreen } from '../components/ui';
import { colors, spacing, radius, font } from '../theme';
import { useAuth } from '../context';

const SECTIONS = [
  {
    title: null,
    rows: [
      { key: 'account', icon: 'account-circle-outline', title: 'Account info', subtitle: 'Name, email, phone, birthday', target: 'AccountInfo' },
      { key: 'history', icon: 'history', title: 'Order history', subtitle: 'Past deliveries & activity bookings', target: 'OrderHistory' },
      { key: 'payments', icon: 'credit-card-outline', title: 'Payment methods', subtitle: 'Manage your cards', target: 'Payments' },
    ],
  },
  {
    title: 'Your stays',
    rows: [
      { key: 'bookings', icon: 'calendar-blank-outline', title: 'Bookings', subtitle: 'Your room reservations', target: 'MyBookings' },
    ],
  },
];

export default function ProfileScreen({ navigation }) {
  const { user, signOut } = useAuth();

  const confirmSignOut = () => {
    Alert.alert('Sign out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: signOut },
    ]);
  };

  return (
    <HeaderScreen title="Profile" navigation={navigation}>
      <Text style={styles.name}>{user?.name || 'Guest'}</Text>

      {SECTIONS.map((section, si) => (
        <View key={si} style={{ marginTop: spacing.xl }}>
          {section.title ? <Text style={styles.sectionTitle}>{section.title}</Text> : null}
          <View style={styles.card}>
            {section.rows.map((row, i) => (
              <React.Fragment key={row.key}>
                <LinkRow
                  icon={row.icon}
                  title={row.title}
                  subtitle={row.subtitle}
                  onPress={() => navigation.navigate(row.target)}
                />
                {i < section.rows.length - 1 ? <View style={styles.divider} /> : null}
              </React.Fragment>
            ))}
          </View>
        </View>
      ))}

      <Pressable onPress={confirmSignOut} hitSlop={10} style={{ marginTop: spacing.xl }}>
        <Text style={styles.signOut}>Sign out</Text>
      </Pressable>
    </HeaderScreen>
  );
}

function LinkRow({ icon, title, subtitle, onPress }) {
  return (
    <Pressable style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.border + '60' }]} onPress={onPress}>
      <MaterialCommunityIcons name={icon} size={22} color={colors.accent} style={{ marginRight: 14 }} />
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      </View>
      <MaterialCommunityIcons name="chevron-right" size={22} color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  name: { ...font.body, color: colors.subtle, marginTop: -spacing.md },
  sectionTitle: { ...font.tiny, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.xs, marginLeft: spacing.xs, color: colors.accent, fontWeight: '700' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: 14 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: spacing.md + 22 + 14 },
  rowTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  rowSubtitle: { fontSize: 13, color: colors.subtle, marginTop: 2 },
  signOut: { fontSize: 16, fontWeight: '600', color: colors.danger, textAlign: 'center' },
});
