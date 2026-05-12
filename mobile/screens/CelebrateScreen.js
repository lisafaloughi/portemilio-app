import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Image,
  ImageBackground,
  StyleSheet,
  Linking,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../theme';
import { EVENT_VENUES } from '../data/eventVenues';
import { useService, serviceImages } from '../data/services';

const HERO_HEIGHT = Dimensions.get('window').width;
const FALLBACK_PHONE = '+9619123466';
const FALLBACK_IMAGES = [
  require('../assets/celebrate1.jpg'),
  require('../assets/celebrate2.jpg'),
  require('../assets/celebrate3.jpg'),
  require('../assets/celebrate4.jpg'),
  require('../assets/celebrate5.jpg'),
  require('../assets/celebrate6.jpg'),
];
const FALLBACK_TITLE = 'Celebrate Together';
const FALLBACK_SUBTITLE = 'Two venues. Endless reasons.';
const FALLBACK_LEAD = "Whatever you're celebrating, we have a place for it.";

const EVENTS = ['Weddings', 'Birthdays', 'Promposals', 'Private moments', 'And more...'];

export default function CelebrateScreen({ navigation }) {
  const [heroIndex, setHeroIndex] = useState(0);
  const s = useService('celebrate');
  const title = s?.name || FALLBACK_TITLE;
  const subtitle = s?.subtitle || FALLBACK_SUBTITLE;
  const lead = s?.description || FALLBACK_LEAD;
  const phone = s?.phone || FALLBACK_PHONE;
  const apiImgs = serviceImages(s);
  const heroImages = apiImgs.length ? apiImgs : FALLBACK_IMAGES;

  useEffect(() => {
    if (heroImages.length <= 1) return;
    const id = setInterval(() => {
      setHeroIndex(prev => (prev + 1) % heroImages.length);
    }, 4000);
    return () => clearInterval(id);
  }, [heroImages.length]);

  const callUs = () => Linking.openURL(`tel:${phone.replace(/\s+/g, '')}`);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        <View style={styles.hero}>
          {heroImages.map((src, i) => (
            <View
              key={i}
              style={[StyleSheet.absoluteFill, { opacity: i === heroIndex ? 1 : 0 }]}
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
            <Text style={styles.heroTitle}>{title}</Text>
            {subtitle ? <Text style={styles.heroSubtitle}>{subtitle}</Text> : null}
          </View>
        </View>

        <View style={styles.body}>
          <Text style={styles.lead}>{lead}</Text>

          <Text style={styles.sectionLabel}>VENUES</Text>
          {EVENT_VENUES.map(v => (
            <View key={v.id} style={styles.venueCard}>
              <ImageBackground
                source={v.image}
                style={StyleSheet.absoluteFill}
                imageStyle={{ borderRadius: radius.lg }}
              >
                <View style={styles.venueShade} />
              </ImageBackground>
              <View style={styles.venueContent}>
                <Text style={styles.venueName}>{v.name}</Text>
                <Text style={styles.venueTagline}>{v.specialty}</Text>
                <View style={styles.capacityChip}>
                  <MaterialCommunityIcons name="account-group-outline" size={13} color="#fff" />
                  <Text style={styles.capacityText}>{v.capacity}</Text>
                </View>
              </View>
            </View>
          ))}

          <Text style={[styles.sectionLabel, { marginTop: spacing.xl }]}>EVENTS WE HOST</Text>
          <View style={styles.chipsRow}>
            {EVENTS.map(e => (
              <View key={e} style={styles.chip}>
                <Text style={styles.chipText}>{e}</Text>
              </View>
            ))}
          </View>

          <View style={styles.ctaCard}>
            <Text style={styles.ctaTitle}>Anything to celebrate?</Text>
            <Text style={styles.ctaBody}>
              Tell us about your event — we've got you covered.
            </Text>
            <Pressable onPress={callUs} style={styles.ctaBtn}>
              <MaterialCommunityIcons name="phone-outline" size={18} color="#fff" />
              <Text style={styles.ctaBtnText}>Call us</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  hero: {
    height: HERO_HEIGHT,
    backgroundColor: colors.bg,
    overflow: 'hidden',
  },
  heroShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  heroSafe: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBottom: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 22,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 13,
    marginTop: 4,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  body: {
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 60,
  },
  lead: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
  },
  sectionLabel: {
    fontSize: 12,
    letterSpacing: 1.3,
    fontWeight: '700',
    color: colors.accent,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  venueCard: {
    height: 150,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: colors.bg,
  },
  venueShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.32)',
  },
  venueContent: {
    flex: 1,
    padding: 18,
    justifyContent: 'flex-end',
  },
  venueName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  venueTagline: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 13,
    marginTop: 2,
  },
  capacityChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    marginTop: 10,
  },
  capacityText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.bg,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  chipText: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '600',
  },
  ctaCard: {
    marginTop: spacing.xl,
    padding: 22,
    backgroundColor: colors.bg,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  ctaTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  ctaBody: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.subtle,
    marginTop: 6,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.accent,
    paddingVertical: 14,
    borderRadius: 999,
    marginTop: 14,
  },
  ctaBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.3,
  },
});
