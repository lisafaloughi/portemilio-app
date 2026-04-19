import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ImageBackground,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius } from '../theme';
import SideDrawer from '../components/SideDrawer';

const { width } = Dimensions.get('window');
const PADDING = 16;
const GAP = 10;
const HALF_WIDTH = (width - PADDING * 2 - GAP) / 2;

const img = (seed, w = 800, h = 500) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;

const HERO_IMG = img('portemilio-kaslik-hero', 1200, 900);

const SECTIONS = [
  {
    title: 'Our Hotel',
    rows: [
      [
        { title: 'Rooms', image: img('portemilio-rooms'), target: { name: 'Info' } },
        { title: 'About the property', image: img('portemilio-property'), target: { name: 'Info' } },
      ],
      [
        { title: 'Portemilio Privileges', full: true, image: img('portemilio-privileges', 1200, 600), target: { name: 'Info' } },
      ],
      [
        { title: 'Lobby Lounge', image: img('portemilio-lobby'), target: { name: 'Info' } },
        { title: 'Pools', image: img('portemilio-pools'), target: { name: 'Category', params: { category: 'pool', title: 'Pools' } } },
      ],
    ],
  },
  {
    title: 'Gastronomy',
    rows: [
      [
        { title: 'Restaurants', full: true, image: img('portemilio-restaurants', 1200, 600), target: { name: 'Restaurants' } },
      ],
      [
        { title: 'Bars', image: img('portemilio-bars'), target: { name: 'Restaurants' } },
        { title: 'Café', image: img('portemilio-cafe'), target: { name: 'Restaurants' } },
      ],
    ],
  },
  {
    title: 'Hotel Services',
    rows: [
      [
        { title: 'Housekeeping', full: true, image: img('portemilio-housekeeping', 1200, 600), target: { name: 'Info' } },
      ],
      [
        { title: 'Wellness Area', image: img('portemilio-wellness'), target: { name: 'FacilityDetail', params: { facilityKey: 'spa', title: 'Wellness' } } },
        { title: 'Kids Club', image: img('portemilio-kids'), target: { name: 'FacilityDetail', params: { facilityKey: 'kids_club', title: 'Kids Club' } } },
      ],
      [
        { title: 'Gym', full: true, image: img('portemilio-gym', 1200, 600), target: { name: 'FacilityDetail', params: { facilityKey: 'gym', title: 'Gym' } } },
      ],
    ],
  },
  {
    title: 'Entertainment',
    rows: [
      [
        { title: "Today's Activities", image: img('portemilio-activities'), target: { name: 'Events' } },
        { title: 'Kids Activities', image: img('portemilio-kids-act'), target: { name: 'Events' } },
      ],
      [
        { title: "Tonight's Show", full: true, image: img('portemilio-show', 1200, 600), target: { name: 'Events' } },
      ],
      [
        { title: 'Tennis', image: img('portemilio-tennis'), target: { name: 'FacilityDetail', params: { facilityKey: 'tennis', title: 'Tennis' } } },
        { title: 'Water Sports', image: img('portemilio-watersports'), target: { name: 'Rentals' } },
      ],
    ],
  },
  {
    title: 'Destination',
    rows: [
      [
        { title: 'Kaslik Guide', image: img('portemilio-kaslik'), target: { name: 'Info' } },
        { title: 'Transport', image: img('portemilio-transport'), target: { name: 'Info' } },
      ],
    ],
  },
];

function Card({ card, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, card.full ? styles.cardFull : styles.cardHalf]}
    >
      <ImageBackground
        source={{ uri: card.image }}
        style={StyleSheet.absoluteFill}
        imageStyle={{ borderRadius: radius.lg }}
      >
        <View style={styles.cardOverlay} />
      </ImageBackground>
      <Text style={styles.cardTitle}>{card.title}</Text>
    </Pressable>
  );
}

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const goTo = (target) => {
    if (!target) return;
    navigation.navigate(target.name, target.params);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <ImageBackground
          source={{ uri: HERO_IMG }}
          style={[styles.hero, { paddingTop: insets.top + 8 }]}
        >
          <View style={styles.heroOverlay} />
          <View style={styles.heroTopRow}>
            <Pressable style={styles.headerBtn} onPress={() => setDrawerOpen(true)}>
              <Text style={styles.headerIcon}>☰</Text>
            </Pressable>
            <Pressable style={styles.headerBtn} onPress={() => navigation.navigate('Profile')}>
              <Text style={styles.headerIcon}>👤</Text>
            </Pressable>
          </View>
          <View style={styles.heroTitleWrap}>
            <Text style={styles.heroTitle}>PORTEMILIO</Text>
            <Text style={styles.heroSubtitle}>HOTEL & RESORT</Text>
          </View>
        </ImageBackground>

        <View style={styles.pillWrap}>
          <View style={styles.pillRow}>
            <Pressable style={styles.pillBtn} onPress={() => navigation.navigate('Info')}>
              <Text style={styles.pillIcon}>🛎️</Text>
              <Text style={styles.pillText}>Live Requests</Text>
            </Pressable>
            <View style={styles.pillDivider} />
            <Pressable style={styles.pillBtn} onPress={() => navigation.navigate('ResortMap')}>
              <Text style={styles.pillIcon}>🗺️</Text>
              <Text style={styles.pillText}>Resort Map</Text>
            </Pressable>
          </View>
        </View>

        {SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.rows.map((row, ri) => (
              <View key={ri} style={styles.row}>
                {row.map((card, ci) => (
                  <Card key={ci} card={card} onPress={() => goTo(card.target)} />
                ))}
              </View>
            ))}
          </View>
        ))}
      </ScrollView>

      <Pressable
        style={[styles.fab, { bottom: insets.bottom + 90 }]}
        onPress={() => navigation.navigate('FacilityDetail', { facilityKey: 'spa', title: 'Wellness' })}
      >
        <Text style={styles.fabIcon}>💆</Text>
      </Pressable>

      <SideDrawer
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        navigation={navigation}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    height: 340,
    justifyContent: 'space-between',
    paddingHorizontal: PADDING,
    paddingBottom: 56,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIcon: {
    fontSize: 20,
    color: '#fff',
  },
  heroTitleWrap: {
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 5,
  },
  heroSubtitle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.95)',
    letterSpacing: 3,
    marginTop: 6,
  },
  pillWrap: {
    paddingHorizontal: PADDING,
    marginTop: -28,
  },
  pillRow: {
    flexDirection: 'row',
    backgroundColor: colors.accent,
    borderRadius: 32,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  pillBtn: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  pillIcon: {
    fontSize: 18,
  },
  pillText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  pillDivider: {
    width: 1,
    height: 22,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  section: {
    marginTop: 32,
    paddingHorizontal: PADDING,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    gap: GAP,
    marginBottom: GAP,
  },
  card: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  cardHalf: {
    width: HALF_WIDTH,
    aspectRatio: 0.95,
  },
  cardFull: {
    flex: 1,
    aspectRatio: 2.2,
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.22)',
    borderRadius: radius.lg,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    padding: 16,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.accent2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 26,
  },
});
