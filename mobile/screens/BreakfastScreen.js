import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import CategoryPage from '../components/CategoryPage';
import { colors, spacing, radius } from '../theme';
import { api } from '../api';

const BREAKFAST_INCLUDED = false;
const COUPON_PRICE = 25;

export default function BreakfastScreen({ navigation }) {
  const [purchasing, setPurchasing] = useState(false);

  const buyCoupon = async () => {
    setPurchasing(true);
    try {
      await api.createDelivery({
        restaurant_id: 0,
        items: [
          {
            id: 'breakfast-coupon',
            name: 'Breakfast Coupon',
            price: COUPON_PRICE,
            qty: 1,
          },
        ],
        notes: 'Breakfast coupon — usable any morning during breakfast hours.',
      });
      Alert.alert(
        'Coupon purchased',
        'Show this to the breakfast staff. Use it any morning between 7 and 11 AM.'
      );
      navigation.navigate('Info');
    } catch (e) {
      Alert.alert('Purchase failed', e.message || 'Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  const statusBlock = (
    <View style={styles.statusCard}>
      <View style={styles.statusHeader}>
        <MaterialCommunityIcons
          name={BREAKFAST_INCLUDED ? 'check-circle-outline' : 'ticket-outline'}
          size={22}
          color={BREAKFAST_INCLUDED ? colors.success : colors.accent2}
        />
        <Text style={styles.statusTitle}>
          {BREAKFAST_INCLUDED ? 'Included with your stay' : 'Available for purchase'}
        </Text>
      </View>
      {BREAKFAST_INCLUDED ? (
        <Text style={styles.statusBody}>
          Just walk in any morning — your stay covers it.
        </Text>
      ) : (
        <>
          <Text style={styles.statusBody}>
            Buy a coupon for ${COUPON_PRICE}. Use it any morning of your stay — it stays in your Active Requests until you redeem it.
          </Text>
          <Pressable
            onPress={buyCoupon}
            disabled={purchasing}
            style={[styles.buyBtn, purchasing && { opacity: 0.6 }]}
          >
            <MaterialCommunityIcons name="ticket-confirmation-outline" size={18} color="#fff" />
            <Text style={styles.buyBtnText}>
              {purchasing ? 'Purchasing…' : `Buy a coupon · $${COUPON_PRICE}`}
            </Text>
          </Pressable>
        </>
      )}
    </View>
  );

  return (
    <CategoryPage
      navigation={navigation}
      title="Breakfast"
      images={[
        require('../assets/breakfast.jpg'),
        require('../assets/restaurants.jpg'),
        require('../assets/special-events.jpg'),
      ]}
      description="The reason mornings exist. A generous Lebanese buffet — manakish, labneh, mouneh, plus hot croissants, fresh cakes, eggs to order, juices, and any drink you can dream up. Worth waking up for."
      rows={[
        { icon: 'clock-outline', title: 'Hours', subtitle: '7:00 – 11:00 AM, every day' },
        { icon: 'silverware-fork-knife', title: 'Style', subtitle: 'Buffet · Lebanese & continental' },
        { icon: 'map-marker-outline', title: 'Location', subtitle: "Fellini's Restaurant · 1st floor" },
        { icon: 'glass-mug-variant', title: 'Drinks', subtitle: 'Juices, coffee, tea — anything, just ask' },
      ]}
      extra={statusBlock}
    />
  );
}

const styles = StyleSheet.create({
  statusCard: {
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  statusBody: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.subtle,
    marginTop: 8,
  },
  buyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.accent,
    paddingVertical: 14,
    borderRadius: 999,
    marginTop: spacing.md,
  },
  buyBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.3,
  },
});
