import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  ImageBackground,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../theme';

const HERO_HEIGHT = Dimensions.get('window').width;
const HERO_IMAGES = [require('../assets/pools.png')];
const POOL_PLACEHOLDER = require('../assets/pools.png');

const OUTDOOR_POOLS = [
  { id: 'olympic', name: 'Olympic Pool', subtitle: 'No pool floats allowed', image: POOL_PLACEHOLDER, mapPinId: 'olympic-pool' },
  { id: 'outdoor', name: 'Children Pool', subtitle: 'Pool floats allowed', image: POOL_PLACEHOLDER, mapPinId: 'children-pool' },
  {
    id: 'kids',
    name: "Kids' Fountain",
    subtitle: 'Supervised by parents',
    image: POOL_PLACEHOLDER,
    mapPinId: 'fountain-pool',
  },
];

export default function PoolsScreen({ navigation }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (HERO_IMAGES.length <= 1) return;
    const id = setInterval(() => {
      setIndex(prev => (prev + 1) % HERO_IMAGES.length);
    }, 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={false}
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        <View style={styles.hero}>
          {HERO_IMAGES.map((src, i) => (
            <View
              key={i}
              style={[StyleSheet.absoluteFill, { opacity: i === index ? 1 : 0 }]}
            >
              <Image
                source={src}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            </View>
          ))}
          <View style={styles.heroShade} />
          <SafeAreaView edges={['top']} style={styles.heroSafe}>
            <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
              <MaterialCommunityIcons name="arrow-left" size={20} color="#fff" />
            </Pressable>
          </SafeAreaView>
          <View style={styles.heroBottom}>
            <Text style={styles.heroTitle}>Pools</Text>
          </View>
        </View>

        <View style={styles.body}>
          <Text style={styles.description}>
            Three outdoor pools right on the seafront — one Olympic-size — plus a heated indoor pool at SEArenity Club.
          </Text>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons
                name="clock-outline"
                size={22}
                color={colors.accent}
                style={{ marginRight: 14 }}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>Hours</Text>
                <Text style={styles.rowSubtitle}>Outdoor pools · 7:00 AM – 7:00 PM</Text>
              </View>
            </View>
            <View style={styles.iconDivider} />
            <View style={styles.infoRow}>
              <MaterialCommunityIcons
                name="hanger"
                size={22}
                color={colors.accent}
                style={{ marginRight: 14 }}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>Towel rentals</Text>
                <Text style={styles.rowSubtitle}>Available nearthe Pool Bar</Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionLabel}>OUTDOOR POOLS</Text>
          <View style={styles.poolsCard}>
            {OUTDOOR_POOLS.map((p, i) => (
              <React.Fragment key={p.id}>
                <Pressable
                  style={({ pressed }) => [
                    styles.poolRow,
                    pressed && { backgroundColor: colors.bg },
                  ]}
                  onPress={() =>
                    navigation.navigate('ResortMap', { pinId: p.mapPinId })
                  }
                  hitSlop={4}
                >
                  <Image source={p.image} style={styles.poolImage} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>{p.name}</Text>
                    <Text style={styles.rowSubtitle}>{p.subtitle}</Text>
                  </View>
                  <MaterialCommunityIcons
                    name="map-marker-outline"
                    size={20}
                    color={colors.muted}
                    style={{ marginRight: 12 }}
                  />
                </Pressable>
                {i < OUTDOOR_POOLS.length - 1 ? <View style={styles.poolDivider} /> : null}
              </React.Fragment>
            ))}
          </View>

          <Text style={styles.sectionLabel}>INDOOR POOL</Text>
          <Pressable
            onPress={() => navigation.navigate('SEArenityClub')}
            style={({ pressed }) => [styles.indoorCard, pressed && { opacity: 0.92 }]}
          >
            <ImageBackground
              source={POOL_PLACEHOLDER}
              style={StyleSheet.absoluteFill}
              imageStyle={{ borderRadius: radius.lg }}
            >
              <View style={styles.indoorOverlay} />
            </ImageBackground>
            <View style={styles.indoorContent}>
              <View style={styles.indoorBadge}>
                <MaterialCommunityIcons name="home-roof" size={12} color="#fff" />
                <Text style={styles.indoorBadgeText}>INDOOR</Text>
              </View>
              <Text style={styles.indoorTitle}>Indoor Pool</Text>
              <Text style={styles.indoorSubtitle}>
                At SEArenity Club · Swimming cap is mandatory
              </Text>
              <View style={styles.indoorCta}>
                <Text style={styles.indoorCtaText}>Open SEArenity Club</Text>
                <MaterialCommunityIcons name="arrow-right" size={16} color="#fff" />
              </View>
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  hero: { height: HERO_HEIGHT, backgroundColor: colors.bg, overflow: 'hidden' },
  heroShade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.18)' },
  heroSafe: { paddingHorizontal: 16, paddingTop: 8 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBottom: { position: 'absolute', left: 20, right: 20, bottom: 22 },
  heroTitle: { color: '#fff', fontSize: 22, fontWeight: '700', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  body: { paddingHorizontal: 22, paddingTop: 24 },
  description: { fontSize: 15, lineHeight: 22, color: colors.text },
  infoCard: {
    marginTop: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  iconDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: spacing.md + 22 + 14,
  },
  rowTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  rowSubtitle: { fontSize: 13, color: colors.subtle, marginTop: 2 },
  sectionLabel: {
    fontSize: 12,
    letterSpacing: 1.3,
    fontWeight: '700',
    color: colors.accent,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  poolsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  poolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  poolImage: {
    width: 60,
    height: 60,
    borderRadius: radius.sm,
    marginRight: 14,
  },
  poolDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: spacing.md + 60 + 14,
  },
  indoorCard: {
    height: 180,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.bg,
  },
  indoorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: radius.lg,
  },
  indoorContent: {
    flex: 1,
    padding: 18,
    justifyContent: 'flex-end',
  },
  indoorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 4,
    backgroundColor: colors.accent,
    borderRadius: 999,
    marginBottom: 8,
  },
  indoorBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  indoorTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  indoorSubtitle: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 13,
    marginTop: 2,
  },
  indoorCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  indoorCtaText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
