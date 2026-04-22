import React, { useCallback, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { HeaderScreen, Card, Loading } from '../components/ui';
import { colors, spacing, font } from '../theme';
import { api } from '../api';
import { useCart } from '../App';

export default function MyOrdersScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { cart } = useCart();

  const load = useCallback(() => api.myDeliveries().then(r => {
    setItems(r);
    setLoading(false);
    setRefreshing(false);
  }), []);
  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  const onRefresh = () => { setRefreshing(true); load(); };

  return (
    <HeaderScreen title="Orders" navigation={navigation} onRefresh={onRefresh} refreshing={refreshing}>
      {cart.length > 0 && (
        <Pressable
          onPress={() => navigation.navigate('Cart')}
          style={{
            backgroundColor: colors.accent, padding: spacing.md, borderRadius: 10,
            marginBottom: spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <MaterialCommunityIcons name="cart-outline" size={18} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '700' }}>Cart · {cart.reduce((a, b) => a + b.qty, 0)} items</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={{ color: '#fff' }}>Checkout</Text>
            <MaterialCommunityIcons name="chevron-right" size={18} color="#fff" />
          </View>
        </Pressable>
      )}
      {loading ? (
        <Loading />
      ) : items.length === 0 ? (
        <Text style={{ ...font.small, textAlign: 'center', marginTop: spacing.xl }}>
          No delivery orders yet. Open a restaurant with "Delivery" and add items to your cart.
        </Text>
      ) : items.map(d => (
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
    </HeaderScreen>
  );
}

function StatusChip({ s }) {
  const map = {
    pending: ['#fff3cd', '#856404'],
    preparing: ['#fde2b3', '#8a5a00'],
    delivered: ['#d4edda', '#155724'],
    cancelled: ['#f5c6cb', '#721c24'],
  };
  const [bg, fg] = map[s] || ['#eee', '#444'];
  return (
    <View style={{ backgroundColor: bg, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 }}>
      <Text style={{ color: fg, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' }}>{s}</Text>
    </View>
  );
}
