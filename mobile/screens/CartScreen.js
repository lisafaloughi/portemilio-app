import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, Alert, TextInput, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { HeaderScreen, Button } from '../components/ui';
import { colors, spacing, radius, font } from '../theme';
import { useCart, useAuth } from '../App';
import { api } from '../api';

export default function CartScreen({ navigation }) {
  const { cart, updateCart } = useCart();
  const { user } = useAuth();
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const byRestaurant = useMemo(() => {
    const m = {};
    for (const it of cart) (m[it.restaurant_id] ||= []).push(it);
    return m;
  }, [cart]);

  const destination = user?.chalet_number
    ? `Chalet ${user.chalet_number}`
    : user?.room_number
    ? `Room ${user.room_number}`
    : 'Front desk';

  const checkout = async (restaurantId, items) => {
    setSubmitting(true);
    try {
      const res = await api.createDelivery({
        restaurant_id: Number(restaurantId),
        items: items.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty })),
        notes,
      });
      for (const it of items) updateCart(it.id, 0);
      Alert.alert('Order placed', `Your order of $${res.total.toFixed(2)} will be delivered to ${res.destination}.`);
      navigation.navigate('Orders');
    } catch (e) {
      Alert.alert('Order failed', e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!cart.length) {
    return (
      <HeaderScreen title="Cart" navigation={navigation}>
        <View style={styles.emptyWrap}>
          <MaterialCommunityIcons name="cart-outline" size={48} color={colors.muted} />
          <Text style={styles.emptyText}>Your cart is empty</Text>
          <Text style={styles.emptyHint}>Add dishes from a restaurant or today's plat du jour.</Text>
        </View>
      </HeaderScreen>
    );
  }

  return (
    <HeaderScreen title="Cart" navigation={navigation}>
      <View style={{ marginTop: spacing.md }}>
        <Text style={styles.sectionTitle}>Delivery to</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <MaterialCommunityIcons name="map-marker-outline" size={22} color={colors.accent} style={{ marginRight: 14 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{destination}</Text>
              <Text style={styles.rowSubtitle}>Change this from your profile if needed.</Text>
            </View>
          </View>
        </View>
      </View>

      {Object.entries(byRestaurant).map(([rid, items]) => {
        const total = items.reduce((a, b) => a + b.price * b.qty, 0);
        return (
          <View key={rid} style={{ marginTop: spacing.xl }}>
            <Text style={styles.sectionTitle}>Order</Text>
            <View style={styles.card}>
              {items.map((it, i) => (
                <React.Fragment key={it.id}>
                  <View style={styles.itemRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowTitle}>{it.name}</Text>
                      <Text style={styles.rowSubtitle}>${it.price.toFixed(2)} each</Text>
                    </View>
                    <View style={styles.qtyStepper}>
                      <Pressable
                        onPress={() => updateCart(it.id, it.qty - 1)}
                        style={styles.qtyBtn}
                        hitSlop={6}
                      >
                        <MaterialCommunityIcons
                          name={it.qty === 1 ? 'trash-can-outline' : 'minus'}
                          size={16}
                          color={it.qty === 1 ? colors.danger : colors.accent}
                        />
                      </Pressable>
                      <Text style={styles.qtyNum}>{it.qty}</Text>
                      <Pressable
                        onPress={() => updateCart(it.id, it.qty + 1)}
                        style={styles.qtyBtn}
                        hitSlop={6}
                      >
                        <MaterialCommunityIcons name="plus" size={16} color={colors.accent} />
                      </Pressable>
                    </View>
                    <Text style={styles.lineTotal}>${(it.price * it.qty).toFixed(2)}</Text>
                  </View>
                  {i < items.length - 1 ? <View style={styles.divider} /> : null}
                </React.Fragment>
              ))}
              <View style={styles.totalDivider} />
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
              </View>
            </View>

            <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>Notes for the kitchen</Text>
            <View style={styles.card}>
              <TextInput
                style={styles.notesInput}
                multiline
                value={notes}
                onChangeText={setNotes}
                placeholder="Allergies, extras, etc."
                placeholderTextColor={colors.muted}
              />
            </View>

            <Button
              title={submitting ? 'Placing…' : `Place order · $${total.toFixed(2)}`}
              onPress={() => checkout(rid, items)}
              disabled={submitting}
              style={{ marginTop: spacing.xl }}
            />
          </View>
        );
      })}
    </HeaderScreen>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    ...font.tiny,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
    marginLeft: spacing.xs,
    color: colors.accent,
    fontWeight: '700',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    gap: 10,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: spacing.md,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  rowSubtitle: {
    fontSize: 13,
    color: colors.subtle,
    marginTop: 2,
  },
  qtyStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  qtyNum: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    minWidth: 16,
    textAlign: 'center',
  },
  lineTotal: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    minWidth: 58,
    textAlign: 'right',
  },
  totalDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  notesInput: {
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    minHeight: 70,
    textAlignVertical: 'top',
    fontSize: 15,
    color: colors.text,
  },
  emptyWrap: {
    alignItems: 'center',
    marginTop: spacing.xl * 2,
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  emptyHint: {
    fontSize: 13,
    color: colors.subtle,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
});
