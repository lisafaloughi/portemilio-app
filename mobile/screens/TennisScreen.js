import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  StyleSheet,
  Linking,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../theme';

const HERO_HEIGHT = Dimensions.get('window').width;
const HERO_IMAGES = [require('../assets/tennis.jpg')];
const COURT_PHONE = '+9619123467';
const SESSION_PRICE = 15;

const COACHES = [
  {
    id: 'oksana',
    name: 'Oksana Belonenko',
    bio: 'Bill Adams International Tennis Academy · Florida, USA',
    phone: '+96171488488',
    photo: null,
  },
  {
    id: 'fabrice',
    name: 'Fabrice Hilaire',
    bio: 'ITF Level II certified · Istanbul, Dubai, Tunis, Abidjan',
    phone: '+2250707177702',
    photo: null,
  },
];

export default function TennisScreen({ navigation }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (HERO_IMAGES.length <= 1) return;
    const id = setInterval(() => {
      setIndex(prev => (prev + 1) % HERO_IMAGES.length);
    }, 4000);
    return () => clearInterval(id);
  }, []);

  const callPhone = (number) => Linking.openURL(`tel:${number.replace(/\s+/g, '')}`);
  const whatsApp = (number) => {
    const clean = number.replace(/\D/g, '');
    Linking.openURL(`https://wa.me/${clean}`).catch(() =>
      Alert.alert('WhatsApp unavailable', 'Could not open WhatsApp. Try calling instead.')
    );
  };
  const openOnMap = () => navigation.navigate('ResortMap', { pinId: 'tennis-1' });

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false} contentContainerStyle={{ paddingBottom: 60 }}>
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
            <Text style={styles.heroTitle}>Tennis</Text>
          </View>
        </View>

        <View style={styles.body}>
          <Text style={styles.description}>
            Two outdoor courts at the resort. Book a session with one of our coaches, or reserve a court for yourself.
          </Text>

          <View style={[styles.rowsCard, { marginTop: spacing.xl }]}>
            <View style={styles.row}>
              <MaterialCommunityIcons name="clock-outline" size={22} color={colors.accent} style={{ marginRight: 14 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>Hours</Text>
                <Text style={styles.rowSubtitle}>7:00 AM – 9:00 PM</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <Pressable style={styles.row} onPress={openOnMap} hitSlop={6}>
              <MaterialCommunityIcons name="map-marker-outline" size={22} color={colors.accent} style={{ marginRight: 14 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>Location</Text>
                <Text style={styles.rowSubtitle}>Two outdoor courts · Activities zone</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={22} color={colors.muted} />
            </Pressable>
          </View>

          <Text style={styles.sectionLabel}>BOOK A COURT</Text>
          <View style={styles.soloCard}>
            <Text style={styles.soloTitle}>Book a court solo</Text>
            <Text style={styles.soloBody}>Reserve a court for yourself or with friends — no coach.</Text>
            <Pressable style={styles.soloBtn} onPress={() => callPhone(COURT_PHONE)}>
              <MaterialCommunityIcons name="phone-outline" size={16} color="#fff" />
              <Text style={styles.soloBtnText}>Call to book</Text>
            </Pressable>
          </View>

          <Text style={styles.sectionLabel}>NEED A COACH?</Text>
          <Text style={styles.sectionHint}>
            Train with one of our internationally certified coaches · ${SESSION_PRICE} per session, court included
          </Text>

          {COACHES.map(c => (
            <View key={c.id} style={styles.coachCard}>
              <View style={styles.photoCircle}>
                {c.photo ? (
                  <Image source={c.photo} style={styles.photo} />
                ) : (
                  <MaterialCommunityIcons name="account" size={36} color={colors.muted} />
                )}
              </View>
              <View style={styles.coachInfo}>
                <Text style={styles.coachName}>{c.name}</Text>
                <Text style={styles.coachBio}>{c.bio}</Text>
                <View style={styles.coachActions}>
                  <Pressable style={styles.actionBtn} onPress={() => callPhone(c.phone)}>
                    <MaterialCommunityIcons name="phone-outline" size={14} color={colors.text} />
                    <Text style={styles.actionText}>Call</Text>
                  </Pressable>
                  <Pressable style={styles.actionBtn} onPress={() => whatsApp(c.phone)}>
                    <MaterialCommunityIcons name="whatsapp" size={14} color={colors.text} />
                    <Text style={styles.actionText}>Text</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ))}
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
  sectionLabel: {
    fontSize: 12,
    letterSpacing: 1.3,
    fontWeight: '700',
    color: colors.accent,
    marginTop: spacing.xl,
    marginBottom: 4,
  },
  sectionHint: {
    fontSize: 13,
    color: colors.subtle,
    marginBottom: spacing.sm,
  },
  coachCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 10,
    gap: 14,
    alignItems: 'center',
  },
  photoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.bg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photo: { width: 64, height: 64, borderRadius: 32 },
  coachInfo: { flex: 1 },
  coachName: { fontSize: 15, fontWeight: '700', color: colors.text },
  coachBio: { fontSize: 12, color: colors.subtle, marginTop: 4, lineHeight: 16 },
  coachActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.bg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  actionText: { fontSize: 12, fontWeight: '600', color: colors.text },
  soloCard: {
    padding: 18,
    backgroundColor: colors.bg,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  soloTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  soloBody: { fontSize: 13, color: colors.subtle, marginTop: 4, lineHeight: 19 },
  soloBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.accent,
    paddingVertical: 12,
    borderRadius: 999,
    marginTop: 12,
  },
  soloBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  rowsCard: {
    marginTop: spacing.xl,
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
    paddingVertical: 16,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: spacing.md + 22 + 14,
  },
  rowTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  rowSubtitle: { fontSize: 13, color: colors.subtle, marginTop: 2 },
});
