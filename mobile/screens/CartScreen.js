import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, Alert, TextInput } from 'react-native';
import { Screen, Card, Button } from '../components/ui';
import { colors, spacing, radius, font } from '../theme';
import { useCart, useAuth } from '../App';
import { api } from '../api';

export default function CartScreen({ navigation }) {
  const { cart, updateCart, clearCart } = useCart();
  const { user } = useAuth();
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Cart is one-restaurant-at-a-time in this UI; if mixed, we group by restaurant and let them check out per restaurant.
  const byRestaurant = useMemo(() => {
    const m = {};
    for (const it of cart) (m[it.restaurant_id] ||= []).push(it);
    return m;
  }, [cart]);

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
    } catch (e) { Alert.alert('Order failed', e.message); }
    finally { setSubmitting(false); }
  };

  if (!cart.length) {
    return (
      <Screen>
        <Text style={{ ...font.small, textAlign: 'center', marginTop: spacing.xl }}>
          Cart is empty. Open a restaurant with delivery to add items.
        </Text>
      </Screen>
    );
  }

  const destination = user?.chalet_number ? `Chalet ${user.chalet_number}` : user?.room_number ? `Room ${user.room_number}` : 'Front desk';

  return (
    <Screen>
      <Card>
        <View style={{ padding: spacing.md }}>
          <Text style={font.h3}>Delivery to</Text>
          <Text style={{ ...font.body, marginTop: 2 }}>{destination}</Text>
          <Text style={{ ...font.small, marginTop: 4 }}>
            Change this from your profile if needed.
          </Text>
        </View>
      </Card>

      {Object.entries(byRestaurant).map(([rid, items]) => {
        const total = items.reduce((a, b) => a + b.price * b.qty, 0);
        return (
          <Card key={rid}>
            <View style={{ padding: spacing.md }}>
              <Text style={font.h3}>Order</Text>
              {items.map(it => (
                <View key={it.id} style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm }}>
                  <Text style={{ flex: 1, ...font.body }}>{it.name}</Text>
                  <Pressable onPress={() => updateCart(it.id, it.qty - 1)} style={qtyBtn}><Text style={qtyTxt}>−</Text></Pressable>
                  <Text style={{ width: 28, textAlign: 'center' }}>{it.qty}</Text>
                  <Pressable onPress={() => updateCart(it.id, it.qty + 1)} style={qtyBtn}><Text style={qtyTxt}>+</Text></Pressable>
                  <Text style={{ width: 70, textAlign: 'right', ...font.body, fontWeight: '600' }}>${(it.price * it.qty).toFixed(2)}</Text>
                </View>
              ))}
              <View style={{ height: 1, backgroundColor: colors.border, marginVertical: spacing.md }} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={font.h3}>Total</Text>
                <Text style={font.h3}>${total.toFixed(2)}</Text>
              </View>
              <Text style={{ ...font.small, marginTop: spacing.md, marginBottom: spacing.xs }}>Notes for the kitchen</Text>
              <TextInput
                style={{
                  borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
                  paddingHorizontal: spacing.md, paddingVertical: 10, backgroundColor: '#fff', minHeight: 60, textAlignVertical: 'top',
                }}
                multiline value={notes} onChangeText={setNotes} placeholder="Allergies, extras, etc."
              />
              <Button
                title={submitting ? 'Placing…' : `Place order · $${total.toFixed(2)}`}
                onPress={() => checkout(rid, items)}
                disabled={submitting}
                style={{ marginTop: spacing.md }}
              />
            </View>
          </Card>
        );
      })}

      <Button title="Clear cart" variant="danger" onPress={clearCart} style={{ marginTop: spacing.md }} />
    </Screen>
  );
}

const qtyBtn = {
  width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: colors.border,
  alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', marginHorizontal: 2,
};
const qtyTxt = { fontSize: 18, fontWeight: '700', color: colors.accent };
