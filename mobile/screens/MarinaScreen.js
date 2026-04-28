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
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../theme';

const HERO_HEIGHT = Dimensions.get('window').width;
const HERO_IMAGES = [require('../assets/marina.png')];
const PLACEHOLDER = require('../assets/marina.png');
const MARINA_PHONE = '+961 9 123 470';

const FACILITIES = [
  { id: 'docking', name: 'Boat docking', subtitle: 'Private and visitor slips' },
  { id: 'tours', name: 'Coastal tours', subtitle: 'For couples & groups' },
  { id: 'dining', name: 'Boat dining experiences', subtitle: 'Onboard meals at sea' },
  { id: 'taxi', name: 'Taxi boat service', subtitle: 'To coastal restaurants' },
];

export default function MarinaScreen({ navigation }) {
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
            <Text style={styles.heroTitle}>Marina</Text>
          </View>
        </View>

        <View style={styles.body}>
          <Text style={styles.lead}>
            Explore the marina — docking, coastal tours, dining at sea, and certified cruise training.
          </Text>

          <View style={styles.actionRow}>
            <Pressable
              style={styles.actionBtn}
              onPress={() =>
                Linking.openURL(`tel:${MARINA_PHONE.replace(/\s+/g, '')}`)
              }
            >
              <MaterialCommunityIcons name="phone-outline" size={16} color="#fff" />
              <Text style={styles.actionBtnText}>Call for info</Text>
            </Pressable>
            <Pressable
              style={[styles.actionBtn, styles.actionBtnAlt]}
              onPress={() => navigation.navigate('ResortMap', { pinId: 'marina' })}
            >
              <MaterialCommunityIcons name="map-marker-outline" size={16} color={colors.text} />
              <Text style={[styles.actionBtnText, { color: colors.text }]}>View on map</Text>
            </Pressable>
          </View>

          <Text style={styles.sectionLabel}>EXPLORE THE MARINA</Text>
          {FACILITIES.map(f => (
            <View key={f.id} style={styles.serviceRow}>
              <View style={styles.serviceBullet} />
              <View style={{ flex: 1 }}>
                <Text style={styles.serviceName}>{f.name}</Text>
                {f.subtitle ? (
                  <Text style={styles.serviceSubtitle}>{f.subtitle}</Text>
                ) : null}
              </View>
            </View>
          ))}

          <Text style={styles.sectionLabel}>TRAINING</Text>
          <Pressable
            onPress={() => navigation.navigate('MaritimeAcademy')}
            style={({ pressed }) => [styles.extraCard, pressed && { opacity: 0.92 }]}
          >
            <ImageBackground
              source={PLACEHOLDER}
              style={StyleSheet.absoluteFill}
              imageStyle={{ borderRadius: radius.lg }}
            >
              <View style={styles.extraOverlay} />
            </ImageBackground>
            <View style={styles.extraContent}>
              <View style={styles.extraBadge}>
                <MaterialCommunityIcons name="school-outline" size={12} color="#fff" />
                <Text style={styles.extraBadgeText}>ACADEMY</Text>
              </View>
              <Text style={styles.extraTitle}>Maritime Academy</Text>
              <Text style={styles.extraSubtitle}>
                Professional maritime education & training
              </Text>
              <View style={styles.extraCta}>
                <Text style={styles.extraCtaText}>Open Maritime Academy</Text>
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
  heroTitle: { color: '#fff', fontSize: 22, fontWeight: '700', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  body: { paddingHorizontal: 22, paddingTop: 24 },
  lead: { fontSize: 15, lineHeight: 22, color: colors.text },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: spacing.lg,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    backgroundColor: colors.accent,
    borderRadius: 999,
  },
  actionBtnAlt: {
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  actionBtnText: {
    color: '#fff', fontSize: 14, fontWeight: '700', letterSpacing: 0.2,
  },
  sectionLabel: {
    fontSize: 12, letterSpacing: 1.3, fontWeight: '700',
    color: colors.accent,
    marginTop: spacing.xl, marginBottom: spacing.sm,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  serviceBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
    marginTop: 8,
    marginRight: 14,
  },
  serviceName: { fontSize: 16, fontWeight: '700', color: colors.text },
  serviceSubtitle: { fontSize: 13, color: colors.subtle, marginTop: 4 },
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
  extraContent: { flex: 1, padding: 18, justifyContent: 'flex-end' },
  extraBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 9, paddingVertical: 4,
    backgroundColor: colors.accent, borderRadius: 999,
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
