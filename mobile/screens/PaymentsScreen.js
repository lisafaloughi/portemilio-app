import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { HeaderScreen } from '../components/ui';
import { colors, spacing, radius, font } from '../theme';

// UI stub — no real card storage yet.
export default function PaymentsScreen({ navigation }) {
  const [cards] = useState([]);

  const handleAdd = () => {
    Alert.alert('Add card', 'Payment processing is coming soon.');
  };

  return (
    <HeaderScreen title="Payment methods" navigation={navigation}>
      <Text style={styles.sub}>Saved payment methods for faster checkout.</Text>

      {cards.length === 0 ? (
        <View style={styles.empty}>
          <MaterialCommunityIcons name="credit-card-off-outline" size={40} color={colors.muted} />
          <Text style={styles.emptyText}>No cards saved yet.</Text>
        </View>
      ) : (
        cards.map(c => (
          <View key={c.id} style={styles.card}>
            <MaterialCommunityIcons name="credit-card-outline" size={24} color={colors.accent} style={{ marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.cardBrand}>{c.brand} ··· {c.last4}</Text>
              <Text style={styles.cardExp}>Expires {c.exp}</Text>
            </View>
          </View>
        ))
      )}

      <Pressable style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.85 }]} onPress={handleAdd}>
        <MaterialCommunityIcons name="plus" size={22} color={colors.accent} style={{ marginRight: 10 }} />
        <Text style={styles.addText}>Add payment method</Text>
      </Pressable>

      <Text style={styles.footNote}>
        Your card details are encrypted and stored securely.
      </Text>
    </HeaderScreen>
  );
}

const styles = StyleSheet.create({
  sub: { ...font.small, marginBottom: spacing.lg },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  emptyText: { ...font.small, marginTop: spacing.sm },
  card: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: 14,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  cardBrand: { fontSize: 15, fontWeight: '600', color: colors.text },
  cardExp: { ...font.small, marginTop: 2 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.accent,
    borderStyle: 'dashed',
    marginTop: spacing.md,
  },
  addText: { fontSize: 15, fontWeight: '600', color: colors.accent },
  footNote: { ...font.tiny, textAlign: 'center', marginTop: spacing.md },
});
