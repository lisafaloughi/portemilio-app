import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  StyleSheet,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../theme';

const HERO_HEIGHT = 320;
const HERO_IMAGES = [require('../assets/water-sports.jpg')];
const PLACEHOLDER_IMG = require('../assets/water-sports.jpg');
const WS_PHONE = '+9619123468';

const SPORTS = [
  { id: 'jet-ski', name: 'Jet ski', price: '$50 / 15 min', image: PLACEHOLDER_IMG },
  { id: 'kayak', name: 'Kayak', price: '$20 / hr', image: PLACEHOLDER_IMG },
  { id: 'rowboat', name: 'Rowboat', price: '$15 / hr', image: PLACEHOLDER_IMG },
  { id: 'pedalo', name: 'Pedalo', price: '$20 / hr', image: PLACEHOLDER_IMG },
  { id: 'water-skiing', name: 'Water skiing', price: '$40 / 15 min', image: PLACEHOLDER_IMG },
  { id: 'scuba-diving', name: 'Scuba diving', price: '$80 / dive', image: PLACEHOLDER_IMG },
];

export default function WaterSportsScreen({ navigation }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (HERO_IMAGES.length <= 1) return;
    const id = setInterval(() => {
      setIndex(prev => (prev + 1) % HERO_IMAGES.length);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const callDesk = () => Linking.openURL(`tel:${WS_PHONE.replace(/\s+/g, '')}`);
  const openOnMap = () => navigation.navigate('ResortMap', { pinId: 'water-sports' });

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
            <Text style={styles.heroTitle}>Water Sports</Text>
          </View>
        </View>

        <View style={styles.body}>
          <Text style={styles.lead}>
            To book a session, please call us or visit the activity desk by the seafront.
          </Text>

          <View style={styles.actionRow}>
            <Pressable style={styles.actionBtn} onPress={callDesk}>
              <MaterialCommunityIcons name="phone-outline" size={16} color="#fff" />
              <Text style={styles.actionBtnText}>Call</Text>
            </Pressable>
            <Pressable style={[styles.actionBtn, styles.actionBtnAlt]} onPress={openOnMap}>
              <MaterialCommunityIcons name="map-marker-outline" size={16} color={colors.text} />
              <Text style={[styles.actionBtnText, { color: colors.text }]}>View on map</Text>
            </Pressable>
          </View>

          <Text style={styles.sectionLabel}>SPORTS & RATES</Text>

          {SPORTS.map(s => (
            <View key={s.id} style={styles.sportCard}>
              <Image source={s.image} style={styles.sportImage} />
              <View style={styles.sportBody}>
                <Text style={styles.sportName}>{s.name}</Text>
              </View>
              <Text style={styles.sportPrice}>{s.price}</Text>
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
  heroTitle: { color: '#fff', fontSize: 30, fontWeight: '700' },
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
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  sectionLabel: {
    fontSize: 12,
    letterSpacing: 1.3,
    fontWeight: '700',
    color: colors.accent,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  sportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: 10,
  },
  sportImage: {
    width: 76,
    height: 76,
  },
  sportBody: {
    flex: 1,
    paddingHorizontal: 14,
  },
  sportName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  sportPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.accent,
    paddingRight: 16,
  },
});
