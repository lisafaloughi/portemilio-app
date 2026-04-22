import React, { useEffect, useRef, useState } from 'react';
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
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius } from '../theme';
import SideDrawer from '../components/SideDrawer';

const { width } = Dimensions.get('window');
const PADDING = 16;
const GAP = 10;
const HALF_WIDTH = (width - PADDING * 2 - GAP) / 2;
const HALF_HEIGHT = HALF_WIDTH / 0.95;

const HERO_IMG = require('../assets/portemilio-home2.png');

const TODAYS_ACT_IMAGES = [
  require('../assets/todays-act-1.jpg'),
  require('../assets/todays-act-2.jpg'),
  require('../assets/todays-act-3.jpg'),
];

const SECTIONS = [
  {
    title: 'Our Hotel',
    rows: [
      [
        { title: 'Rooms', image: require('../assets/rooms.jpg'), target: { name: 'Info' } },
        { title: 'Front Desk', image: require('../assets/front-desk.jpg'), target: { name: 'Info' } },
      ],
      [
        { title: 'Portemilio Heritage', full: true, image: require('../assets/portemilio-heritage.jpg'), target: { name: 'Info' } },
      ],
      [
        { title: 'Breakfast', image: require('../assets/breakfast.jpg'), target: { name: 'Info' } },
        { title: 'Seaside Access', image: require('../assets/seaside-access.png'), target: { name: 'Category', params: { category: 'pool', title: 'Pools' } } },
      ],
    ],
  },
  {
    title: 'Gastronomy',
    rows: [
      [
        { title: 'Restaurants', full: true, image: require('../assets/restaurants.jpg'), target: { name: 'Restaurants' } },
      ],
      [
        { title: 'Bars', image: require('../assets/bars.jpg'), target: { name: 'Restaurants' } },
        { title: 'Celebrate Together', image: require('../assets/special-events.jpg'), target: { name: 'Restaurants' } },
      ],
    ],
  },
  {
    title: 'Hotel Services',
    rows: [
      [
        { title: 'Housekeeping', full: true, image: require('../assets/housekeeping.jpg'), target: { name: 'Info' } },
      ],
      [
        { title: 'Wellness Area', image: require('../assets/wellness-area.jpg'), target: { name: 'FacilityDetail', params: { facilityKey: 'spa', title: 'Wellness' } } },
        { title: 'Room Service', image: require('../assets/room-service.jpg'), target: { name: 'FacilityDetail', params: { facilityKey: 'kids_club', title: 'Kids Club' } } },
      ],
      [
        { title: 'Comedy Theatre', full: true, image: require('../assets/comedy-theatre.jpg'), target: { name: 'FacilityDetail', params: { facilityKey: 'gym', title: 'Gym' } } },
      ],
    ],
  },
  {
    title: 'Entertainment',
    rows: [
      [
        { title: "Today's Activities", images: TODAYS_ACT_IMAGES, target: { name: 'Events' } },
        { title: 'Kids Club', image: require('../assets/kids-activities.jpg'), target: { name: 'Events' } },
      ],
      [
        { title: 'Pools', full: true, image: require('../assets/pools.png'), target: { name: 'Events' } },
      ],
      [
        { title: 'Tennis', image: require('../assets/tennis.jpg'), target: { name: 'FacilityDetail', params: { facilityKey: 'tennis', title: 'Tennis' } } },
        { title: 'Water Sports', image: require('../assets/water-sports.jpg'), target: { name: 'Rentals' } },
      ],
    ],
  },
  {
    title: 'Marina', // rendered title-less; acts as the standalone marina rectangle
    rows: [
      [
        { title: 'Explore The Marina', full: true, image: require('../assets/marina.png'), target: { name: 'Info' } },
      ],
    ],
  },
  {
    title: 'Destination',
    rows: [
      [
        { title: 'Jounieh Guide', image: require('../assets/jounieh-guide.jpg'), target: { name: 'Info' } },
        { title: 'Get to the City', image: require('../assets/transport-to-the-city.png'), target: { name: 'Info' } },
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
        source={card.image}
        style={StyleSheet.absoluteFill}
        imageStyle={{ borderRadius: radius.lg }}
      >
        <View style={styles.cardOverlay} />
      </ImageBackground>
      <Text style={styles.cardTitle}>{card.title}</Text>
    </Pressable>
  );
}

function CarouselCard({ card, onPress }) {
  const [index, setIndex] = useState(0);
  const scrollRef = useRef(null);
  const timerRef = useRef(null);
  const images = card.images;
  const len = images.length;

  const startTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setIndex(prev => {
        const next = (prev + 1) % len;
        scrollRef.current?.scrollTo({ x: next * HALF_WIDTH, animated: true });
        return next;
      });
    }, 2000);
  };

  useEffect(() => {
    startTimer();
    return () => clearInterval(timerRef.current);
  }, [len]);

  return (
    <View style={[styles.card, styles.cardHalf]}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScrollBeginDrag={() => clearInterval(timerRef.current)}
        onMomentumScrollEnd={(e) => {
          const i = Math.round(e.nativeEvent.contentOffset.x / HALF_WIDTH);
          setIndex(i);
          startTimer();
        }}
      >
        {images.map((src, i) => (
          <Pressable key={i} onPress={onPress} style={{ width: HALF_WIDTH, height: HALF_HEIGHT }}>
            <ImageBackground source={src} style={StyleSheet.absoluteFill}>
              <View style={styles.cardOverlay} />
            </ImageBackground>
          </Pressable>
        ))}
      </ScrollView>
      <Text style={[styles.cardTitle, styles.carouselTitle]}>{card.title}</Text>
      <View style={styles.dots} pointerEvents="none">
        {images.map((_, i) => (
          <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>
    </View>
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
          source={HERO_IMG}
          style={[styles.hero, { paddingTop: insets.top + 8 }]}
        >
          <View style={styles.heroOverlay} />
          <View style={styles.heroTopRow}>
            <Pressable style={styles.headerBtn} onPress={() => setDrawerOpen(true)}>
              <MaterialCommunityIcons name="menu" size={20} color="#fff" />
            </Pressable>
            <Pressable style={styles.headerBtn} onPress={() => navigation.navigate('Profile')}>
              <MaterialCommunityIcons name="account-outline" size={20} color="#fff" />
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
              <MaterialCommunityIcons name="bell-ring-outline" size={18} color="#fff" />
              <Text style={styles.pillText}>Live Requests</Text>
            </Pressable>
            <View style={styles.pillDivider} />
            <Pressable style={styles.pillBtn} onPress={() => navigation.navigate('ResortMap')}>
              <MaterialCommunityIcons name="map-outline" size={18} color="#fff" />
              <Text style={styles.pillText}>Resort Map</Text>
            </Pressable>
          </View>
        </View>

        {SECTIONS.map((section, si) => (
          <View key={si} style={[styles.section, section.marina && styles.sectionMarina]}>
            {section.title ? <Text style={styles.sectionTitle}>{section.title}</Text> : null}
            {section.rows.map((row, ri) => (
              <View key={ri} style={styles.row}>
                {row.map((card, ci) =>
                  'images' in card ? (
                    <CarouselCard key={ci} card={card} onPress={() => goTo(card.target)} />
                  ) : (
                    <Card key={ci} card={card} onPress={() => goTo(card.target)} />
                  )
                )}
              </View>
            ))}
          </View>
        ))}
      </ScrollView>

      <Pressable
        style={[styles.fab, { bottom: insets.bottom + 90 }]}
        onPress={() => navigation.navigate('FacilityDetail', { facilityKey: 'spa', title: 'Wellness' })}
      >
        <MaterialCommunityIcons name="spa-outline" size={26} color="#fff" />
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
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
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
  sectionMarina: {
    marginTop: GAP,
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
  carouselTitle: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  dots: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotActive: {
    backgroundColor: '#fff',
    width: 14,
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
});
