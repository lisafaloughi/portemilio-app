import React, { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ImageBackground,
  StyleSheet,
  Linking,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Loading } from '../components/ui';
import { colors, radius } from '../theme';
import { api } from '../api';
import { useCart } from '../App';

const HERO_HEIGHT = 300;
const heroImg = (seed) => `https://picsum.photos/seed/${seed}/1200/700`;

export default function RestaurantDetailScreen({ route, navigation }) {
  const { id, title } = route.params;
  const insets = useSafeAreaInsets();
  const [r, setR] = useState(null);
  const [loading, setLoading] = useState(true);
  const { cart, addToCart } = useCart();

  const myItemsCount = useMemo(
    () => cart.filter(c => c.restaurant_id === id).reduce((a, b) => a + b.qty, 0),
    [cart, id]
  );

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    api.restaurant(id).then(x => { setR(x); setLoading(false); });
  }, [id]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <Loading />
      </View>
    );
  }
  if (!r) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Not found</Text>
      </View>
    );
  }

  const categories = {};
  for (const m of (r.menu || [])) {
    const c = m.category || 'Other';
    (categories[c] ||= []).push(m);
  }

  const bottomPad = 40 + (r.delivery || true ? 80 : 0);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomPad }}
      >
        <ImageBackground
          source={{ uri: heroImg(`restaurant-${id}`) }}
          style={styles.hero}
        >
          <View style={styles.heroGradient} />
          <Pressable
            style={[styles.backBtn, { top: insets.top + 8 }]}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
          </Pressable>
          {myItemsCount > 0 ? (
            <Pressable
              style={[styles.cartBtn, { top: insets.top + 8 }]}
              onPress={() => navigation.navigate('Cart')}
            >
              <MaterialCommunityIcons name="cart-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.cartText}>{myItemsCount}</Text>
            </Pressable>
          ) : null}
          <View style={styles.heroFooter}>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle}>{r.name || title}</Text>
              {r.cuisine ? <Text style={styles.heroSubtitle}>{prettify(r.cuisine)}</Text> : null}
            </View>
            {r.location ? (
              <View style={styles.locationBtn}>
                <MaterialCommunityIcons name="map-marker-outline" size={18} color="#fff" />
              </View>
            ) : null}
          </View>
        </ImageBackground>

        {r.hours ? (
          <View style={styles.block}>
            <View style={styles.timetableRow}>
              <Text style={styles.timetableLabel}>Timetable</Text>
              <Text style={styles.timetableValue}>{r.hours}</Text>
            </View>
            <Text style={styles.link}>See full opening hours</Text>
          </View>
        ) : null}

        <View style={styles.divider} />

        {r.description ? (
          <View style={styles.block}>
            <Text style={styles.description}>{r.description}</Text>
          </View>
        ) : null}

        {r.location ? <InfoRow icon="map-marker-outline" title="Location" subtitle={r.location} /> : null}
        {r.phone ? (
          <InfoRow
            icon="phone-outline"
            title="Call"
            subtitle={r.phone}
            onPress={() => Linking.openURL(`tel:${r.phone}`)}
          />
        ) : null}

        {r.delivery ? (
          <View style={styles.deliveryBanner}>
            <MaterialCommunityIcons name="moped-outline" size={22} color={colors.accent} style={{ marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.deliveryTitle}>Delivery to your chalet / room</Text>
              <Text style={styles.deliverySubtitle}>Add items to cart and check out. We deliver directly to you.</Text>
            </View>
          </View>
        ) : null}

        {Object.keys(categories).length > 0 ? (
          <View style={styles.menuWrap}>
            <Text style={styles.menuHeading}>Menu</Text>
            {Object.entries(categories).map(([cat, items]) => (
              <View key={cat} style={styles.menuCategory}>
                <Text style={styles.menuCategoryTitle}>{cat}</Text>
                {items.map(m => (
                  <View key={m.id} style={styles.menuItem}>
                    <View style={{ flex: 1, paddingRight: 12 }}>
                      <View style={styles.menuItemHeader}>
                        <Text style={styles.menuItemName}>{m.name}</Text>
                        {m.plat_du_jour ? (
                          <View style={styles.platChip}>
                            <Text style={styles.platChipText}>Plat du jour</Text>
                          </View>
                        ) : null}
                      </View>
                      {m.description ? <Text style={styles.menuItemDesc}>{m.description}</Text> : null}
                      <Text style={styles.menuItemPrice}>${Number(m.price).toFixed(2)}</Text>
                    </View>
                    {r.delivery && m.available ? (
                      <Pressable
                        onPress={() => {
                          addToCart({ restaurant_id: r.id, id: m.id, name: m.name, price: m.price });
                          Alert.alert('Added to cart', `${m.name} added`);
                        }}
                        style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.85 }]}
                      >
                        <Text style={styles.addBtnText}>+ Add</Text>
                      </Pressable>
                    ) : null}
                  </View>
                ))}
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable
          style={({ pressed }) => [styles.reserveBtn, pressed && { opacity: 0.9 }]}
          onPress={() => navigation.navigate('Booking', {
            resource_type: 'restaurant',
            resource_id: r.id,
            resource_name: r.name,
          })}
        >
          <Text style={styles.reserveBtnText}>Reserve a table</Text>
        </Pressable>
      </View>
    </View>
  );
}

function InfoRow({ icon, title, subtitle, onPress }) {
  return (
    <Pressable style={styles.infoRow} onPress={onPress} disabled={!onPress}>
      <MaterialCommunityIcons name={icon} size={22} color={colors.accent} style={{ marginRight: 16 }} />
      <View style={{ flex: 1 }}>
        <Text style={styles.infoTitle}>{title}</Text>
        {subtitle ? <Text style={styles.infoSubtitle}>{subtitle}</Text> : null}
      </View>
      {onPress ? <MaterialCommunityIcons name="chevron-right" size={22} color={colors.muted} /> : null}
    </Pressable>
  );
}

function prettify(s) {
  return String(s).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

const styles = StyleSheet.create({
  hero: { height: HERO_HEIGHT, justifyContent: 'flex-end' },
  heroGradient: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.18)' },
  backBtn: {
    position: 'absolute',
    left: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBtn: {
    position: 'absolute',
    right: 16,
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.45)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  heroFooter: { flexDirection: 'row', alignItems: 'flex-end', padding: 20 },
  heroTitle: {
    fontSize: 30,
    fontWeight: '700',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  heroSubtitle: { fontSize: 16, color: 'rgba(255,255,255,0.95)', marginTop: 4 },
  locationBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  block: { paddingHorizontal: 20, paddingVertical: 18 },
  timetableRow: { flexDirection: 'row', alignItems: 'center' },
  timetableLabel: { fontSize: 17, color: colors.text, width: 120 },
  timetableValue: { fontSize: 17, color: colors.text, flex: 1 },
  link: { fontSize: 15, color: colors.accent, marginTop: 14, fontWeight: '500' },
  divider: { height: 1, backgroundColor: colors.border, marginHorizontal: 20 },
  description: { fontSize: 17, color: colors.text, lineHeight: 24 },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  infoIcon: { fontSize: 22, marginRight: 16 },
  infoTitle: { fontSize: 17, fontWeight: '600', color: colors.text },
  infoSubtitle: { fontSize: 14, color: colors.subtle, marginTop: 2 },
  chevron: { fontSize: 26, color: colors.muted },
  deliveryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 18,
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.accent + '14',
  },
  deliveryIcon: { fontSize: 22, marginRight: 12 },
  deliveryTitle: { fontSize: 15, fontWeight: '700', color: colors.accent },
  deliverySubtitle: { fontSize: 13, color: colors.subtle, marginTop: 2 },
  menuWrap: { paddingHorizontal: 20, paddingTop: 24 },
  menuHeading: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 14 },
  menuCategory: { marginBottom: 18 },
  menuCategoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.accent,
    marginBottom: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    marginBottom: 10,
  },
  menuItemHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  menuItemName: { fontSize: 16, fontWeight: '600', color: colors.text },
  menuItemDesc: { fontSize: 13, color: colors.subtle, marginTop: 4, lineHeight: 18 },
  menuItemPrice: { fontSize: 15, fontWeight: '700', color: colors.text, marginTop: 6 },
  platChip: {
    backgroundColor: colors.accent2 + '22',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  platChipText: { fontSize: 11, fontWeight: '700', color: colors.accent2 },
  addBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 64,
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  reserveBtn: {
    backgroundColor: colors.accent,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  reserveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
});
