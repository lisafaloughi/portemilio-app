import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  ImageBackground,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../theme';

const HERO_HEIGHT = 320;
const HERO_IMAGES = [require('../assets/kids-activities.jpg')];

export default function KidsClubScreen({ navigation }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (HERO_IMAGES.length <= 1) return;
    const id = setInterval(() => {
      setIndex(prev => (prev + 1) % HERO_IMAGES.length);
    }, 1000);
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
            <Image
              key={i}
              source={src}
              style={[StyleSheet.absoluteFill, { opacity: i === index ? 1 : 0 }]}
              resizeMode="cover"
            />
          ))}
          <View style={styles.heroShade} />
          <SafeAreaView edges={['top']} style={styles.heroSafe}>
            <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
              <MaterialCommunityIcons name="arrow-left" size={20} color="#fff" />
            </Pressable>
          </SafeAreaView>
          <View style={styles.heroBottom}>
            <Text style={styles.heroTitle}>Kids Club</Text>
          </View>
        </View>

        <View style={styles.body}>
          <Text style={styles.description}>
            Daily activities, games, and supervised fun for kids during your stay.
          </Text>

          <View style={styles.infoCard}>
            <Pressable
              style={({ pressed }) => [
                styles.infoRow,
                pressed && { backgroundColor: colors.bg },
              ]}
              onPress={() => navigation.navigate('ResortMap', { pinId: 'playground' })}
            >
              <MaterialCommunityIcons
                name="map-marker-outline"
                size={22}
                color={colors.accent}
                style={{ marginRight: 14 }}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>Location</Text>
                <Text style={styles.rowSubtitle}>By the playground · Activities zone</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={22} color={colors.muted} />
            </Pressable>
          </View>

          <Text style={styles.sectionLabel}>FOR YOUNGER ONES</Text>
          <Pressable
            onPress={() => navigation.navigate('Nursery')}
            style={({ pressed }) => [styles.extraCard, pressed && { opacity: 0.92 }]}
          >
            <ImageBackground
              source={require('../assets/kids-activities.jpg')}
              style={StyleSheet.absoluteFill}
              imageStyle={{ borderRadius: radius.lg }}
            >
              <View style={styles.extraOverlay} />
            </ImageBackground>
            <View style={styles.extraContent}>
              <View style={styles.extraBadge}>
                <MaterialCommunityIcons name="baby-face-outline" size={12} color="#fff" />
                <Text style={styles.extraBadgeText}>UNDER 6</Text>
              </View>
              <Text style={styles.extraTitle}>Nursery</Text>
              <Text style={styles.extraSubtitle}>
                Supervised care for kids under 6 — drop them off, enjoy the resort.
              </Text>
              <View style={styles.extraCta}>
                <Text style={styles.extraCtaText}>Open Nursery</Text>
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
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroBottom: { position: 'absolute', left: 20, right: 20, bottom: 22 },
  heroTitle: { color: '#fff', fontSize: 30, fontWeight: '700' },
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
  rowTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  rowSubtitle: { fontSize: 13, color: colors.subtle, marginTop: 2 },
  sectionLabel: {
    fontSize: 12, letterSpacing: 1.3, fontWeight: '700',
    color: colors.accent,
    marginTop: spacing.xl, marginBottom: spacing.sm,
  },
  extraCard: {
    height: 180,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.bg,
  },
  extraOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: radius.lg,
  },
  extraContent: {
    flex: 1,
    padding: 18,
    justifyContent: 'flex-end',
  },
  extraBadge: {
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
  extraBadgeText: {
    color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 1,
  },
  extraTitle: { color: '#fff', fontSize: 22, fontWeight: '700' },
  extraSubtitle: {
    color: 'rgba(255,255,255,0.92)', fontSize: 13, marginTop: 2,
  },
  extraCta: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10,
  },
  extraCtaText: {
    color: '#fff', fontSize: 13, fontWeight: '700', letterSpacing: 0.3,
  },
});
