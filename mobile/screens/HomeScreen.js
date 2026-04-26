import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ImageBackground,
  StyleSheet,
  Dimensions,
  Modal,
  Alert,
  Linking,
  PanResponder,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius } from '../theme';
import SideDrawer from '../components/SideDrawer';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ServingFoodIcon } from '@hugeicons/core-free-icons';
import { useCart } from '../App';
import { api } from '../api';

const LIVE_ORDER_STATUSES = new Set(['pending', 'preparing']);
const LIVE_BOOKING_STATUSES = new Set(['pending', 'confirmed']);

const PLAT_DU_JOUR = {
  id: 'plat-du-jour',
  restaurant_id: 0,
  name: 'Mloukhiyeh',
  origin: "Today's Lebanese specialty",
  description:
    'A traditional Lebanese stew of jute leaves slow-cooked with tender chicken, served over saffron rice with toasted vermicelli, raw onions and warm pita bread.',
  price: 18,
  eta: '~30 min',
};

const { width } = Dimensions.get('window');
const PADDING = 16;
const GAP = 10;
const HALF_WIDTH = (width - PADDING * 2 - GAP) / 2;
const HALF_HEIGHT = HALF_WIDTH / 0.95;
const FULL_WIDTH = width - PADDING * 2;
const FULL_HEIGHT = FULL_WIDTH / 2.2;

const HERO_IMG = require('../assets/portemilio-home2.png');

const TODAYS_ACT_IMAGES = [
  require('../assets/todays-act-1.jpg'),
  require('../assets/todays-act-2.jpg'),
  require('../assets/todays-act-3.jpg'),
  require('../assets/water-sports.jpg'),
];

const SECTIONS = [
  {
    title: 'Our Hotel',
    rows: [
      [
        { title: 'Rooms', image: require('../assets/rooms.jpg'), url: 'https://portemiliohotelandresort.bookingmystay.com' },
        { title: 'Front Desk', image: require('../assets/front-desk.jpg'), target: { name: 'FrontDesk' } },
      ],
      [
        { title: 'Portemilio Heritage', full: true, image: require('../assets/portemilio_vintage.jpg'), target: { name: 'Heritage' } },
      ],
      [
        { title: 'Breakfast', image: require('../assets/breakfast.jpg'), target: { name: 'Breakfast' } },
        { title: 'Seaside Access', image: require('../assets/seaside-access.png'), target: { name: 'SeasideAccess' } },
      ],
    ],
  },
  {
    title: 'Gastronomy',
    rows: [
      [
        { title: 'Restaurants & Bars', full: true, image: require('../assets/restaurants.jpg'), target: { name: 'Restaurants' } },
      ],
      [
        { title: 'Catering by Portemilio', image: require('../assets/portemilio-catering.jpg'), target: { name: 'Catering' } },
        { title: 'Celebrate Together', image: require('../assets/special-events.jpg'), target: { name: 'Celebrate' } },
      ],
    ],
  },
  {
    title: 'Hotel Services',
    rows: [
      [
        { title: 'Housekeeping', full: true, image: require('../assets/housekeeping.jpg'), target: { name: 'Housekeeping' } },
      ],
      [
        { title: 'Wellness Area', image: require('../assets/wellness-area.jpg'), target: { name: 'Wellness' } },
        { title: 'Room Service', image: require('../assets/room-service.jpg'), target: { name: 'RoomService' } },
      ],
      [
        { title: 'Pools', full: true, image: require('../assets/pools.png'), target: { name: 'Pools' } },
      ],
    ],
  },
  {
    title: 'Entertainment',
    rows: [
      [
        {
          title: "Today's Activities",
          images: TODAYS_ACT_IMAGES,
          target: { name: 'TodaysActivitiesList' },
        },
        { title: 'Kids Club', image: require('../assets/kids-activities.jpg'), target: { name: 'KidsClub' } },
      ],
      [
        {
          title: "Tonight's Events",
          full: true,
          interval: 4000,
          images: [
            {
              src: require('../assets/comedy-theatre.jpg'),
              title: 'Comedy Evening',
              subtitle: 'Every weekend · Fady Raidy live',
            },
            {
              src: require('../assets/fifa.jpg'),
              title: 'Match Day',
              subtitle: 'Germany vs Spain · 2026 FIFA World Cup',
            },
          ],
          target: { name: 'EventsList' },
        },
      ],
      [
        { title: 'Tennis', image: require('../assets/tennis.jpg'), target: { name: 'Tennis' } },
        { title: 'Water Sports', image: require('../assets/water-sports.jpg'), target: { name: 'WaterSports' } },
      ],
    ],
  },
  {
    title: 'By the Water', // rendered title-less; acts as the standalone marina rectangle
    rows: [
      [
        { title: 'Marina Experience', full: true, image: require('../assets/marina.png'), target: { name: 'Marina' } },
      ],
    ],
  },
  {
    title: 'Destinations',
    rows: [
      [
        { title: 'Explore Landmarks', image: require('../assets/jounieh-guide.jpg'), target: { name: 'LandmarksList' } },
        { title: 'Get to the City', image: require('../assets/transport-to-the-city.png'), target: { name: 'GetToCity' } },
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

  const items = card.images.map(img =>
    img && typeof img === 'object' && 'src' in img ? img : { src: img }
  );
  const len = items.length;
  const cardWidth = card.full ? FULL_WIDTH : HALF_WIDTH;
  const cardHeight = card.full ? FULL_HEIGHT : HALF_HEIGHT;

  const current = items[index] || items[0];
  const displayTitle = current.title || card.title;
  const displaySubtitle = current.subtitle;

  const intervalMs = card.interval || 2000;

  const startTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setIndex(prev => {
        const next = (prev + 1) % len;
        scrollRef.current?.scrollTo({ x: next * cardWidth, animated: true });
        return next;
      });
    }, intervalMs);
  };

  useEffect(() => {
    startTimer();
    return () => clearInterval(timerRef.current);
  }, [len]);

  return (
    <View style={[styles.card, card.full ? styles.cardFull : styles.cardHalf]}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScrollBeginDrag={() => clearInterval(timerRef.current)}
        onMomentumScrollEnd={(e) => {
          const i = Math.round(e.nativeEvent.contentOffset.x / cardWidth);
          setIndex(i);
          startTimer();
        }}
      >
        {items.map((item, i) => (
          <Pressable key={i} onPress={onPress} style={{ width: cardWidth, height: cardHeight }}>
            <ImageBackground source={item.src} style={StyleSheet.absoluteFill}>
              <View style={styles.cardOverlay} />
            </ImageBackground>
          </Pressable>
        ))}
      </ScrollView>
      {card.full ? (
        <View style={styles.carouselFullText} pointerEvents="none">
          <Text style={styles.carouselFullTitle}>{displayTitle}</Text>
          {displaySubtitle ? (
            <Text style={styles.carouselFullSubtitle}>{displaySubtitle}</Text>
          ) : null}
        </View>
      ) : (
        <Text style={[styles.cardTitle, styles.carouselTitle]}>{displayTitle}</Text>
      )}
      <View style={[styles.dots, card.full && styles.dotsFull]} pointerEvents="none">
        {items.map((_, i) => (
          <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [platOpen, setPlatOpen] = useState(false);
  const [platQty, setPlatQty] = useState(1);
  const [hasLiveRequests, setHasLiveRequests] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewDismissed, setReviewDismissed] = useState(false);
  const { cart, addToCart } = useCart();
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  const startXRef = useRef(0);
  const edgeSwipeResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponderCapture: (evt) => {
          startXRef.current = evt.nativeEvent.pageX;
          return false;
        },
        onMoveShouldSetPanResponder: (_, g) =>
          startXRef.current < 28 &&
          g.dx > 10 &&
          Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
        onPanResponderRelease: (_, g) => {
          if (g.dx > 50) setDrawerOpen(true);
        },
      }),
    []
  );

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const [orders, bookings] = await Promise.all([
          api.myDeliveries().catch(() => []),
          api.myBookings().catch(() => []),
        ]);
        const live =
          orders.some(o => LIVE_ORDER_STATUSES.has(o.status)) ||
          bookings.some(b => LIVE_BOOKING_STATUSES.has(b.status));
        setHasLiveRequests(live);
      })();
    }, [])
  );

  const goTo = (target) => {
    if (!target) return;
    navigation.navigate(target.name, target.params);
  };

  const handleCardPress = (card) => {
    if (card.url) {
      Linking.openURL(card.url).catch(() =>
        Alert.alert('Unable to open link', 'Please try again later.')
      );
      return;
    }
    goTo(card.target);
  };

  const openPlat = () => {
    setPlatQty(1);
    setPlatOpen(true);
  };

  const openReview = (initialRating = 0) => {
    setReviewRating(initialRating);
    setReviewComment('');
    setReviewOpen(true);
  };

  const submitReview = () => {
    setReviewOpen(false);
    setReviewDismissed(true);
    setTimeout(() => {
      Alert.alert('Thank you!', 'We appreciate your feedback.');
    }, 200);
  };

  const closeReview = () => {
    setReviewOpen(false);
    setReviewDismissed(true);
  };

  const handleAddToCart = () => {
    addToCart(
      {
        id: PLAT_DU_JOUR.id,
        restaurant_id: PLAT_DU_JOUR.restaurant_id,
        name: PLAT_DU_JOUR.name,
        price: PLAT_DU_JOUR.price,
      },
      platQty
    );
    setPlatOpen(false);
    setTimeout(() => {
      Alert.alert(
        'Added to cart',
        `${platQty} × ${PLAT_DU_JOUR.name} added to your cart.`
      );
    }, 200);
  };

  return (
    <View
      style={{ flex: 1, backgroundColor: colors.bg }}
      {...edgeSwipeResponder.panHandlers}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: (reviewDismissed ? 40 : 180) + insets.bottom,
        }}
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
            <View style={styles.heroTopRight}>
              <Pressable style={styles.headerBtn} onPress={() => navigation.navigate('Cart')}>
                <MaterialCommunityIcons name="cart-outline" size={20} color="#fff" />
                {cartCount > 0 && (
                  <View style={styles.cartBadge}>
                    <Text style={styles.cartBadgeText}>{cartCount}</Text>
                  </View>
                )}
              </Pressable>
              <Pressable style={styles.headerBtn} onPress={() => navigation.navigate('Profile')}>
                <MaterialCommunityIcons name="account-outline" size={20} color="#fff" />
              </Pressable>
            </View>
          </View>
          <View style={styles.heroTitleWrap}>
            <Text style={styles.heroTitle}>PORTEMILIO</Text>
            <Text style={styles.heroSubtitle}>HOTEL & RESORT</Text>
          </View>
        </ImageBackground>

        <View style={styles.pillWrap}>
          <View style={styles.pillRow}>
            <Pressable style={styles.pillBtn} onPress={() => navigation.navigate('Info')}>
              <View>
                <MaterialCommunityIcons name="bell-ring-outline" size={18} color="#fff" />
                {hasLiveRequests && <View style={styles.liveDot} />}
              </View>
              <Text style={styles.pillText}>Active Requests</Text>
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
                    <CarouselCard key={ci} card={card} onPress={() => handleCardPress(card)} />
                  ) : (
                    <Card key={ci} card={card} onPress={() => handleCardPress(card)} />
                  )
                )}
              </View>
            ))}
          </View>
        ))}
      </ScrollView>

      {!reviewDismissed && (
        <Pressable
          style={[styles.reviewWidget, { paddingBottom: 22 + insets.bottom }]}
          onPress={() => openReview(0)}
        >
          <Text style={styles.reviewWidgetTitle}>How's your stay going?</Text>
          <View style={styles.reviewStarsRow}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Pressable
                key={n}
                onPress={() => openReview(n)}
                hitSlop={6}
                style={styles.reviewStarBtn}
              >
                <MaterialCommunityIcons
                  name="star"
                  size={32}
                  color={colors.border}
                />
              </Pressable>
            ))}
          </View>
        </Pressable>
      )}

      <Pressable
        style={[
          styles.platFab,
          { bottom: insets.bottom + (reviewDismissed ? 30 : 110) },
        ]}
        onPress={openPlat}
      >
        <HugeiconsIcon icon={ServingFoodIcon} size={30} color={colors.accent} strokeWidth={1.6} />
      </Pressable>

      <Modal
        visible={platOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setPlatOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setPlatOpen(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalEyebrow}>PLAT DU JOUR</Text>
                <Text style={styles.modalTitle}>{PLAT_DU_JOUR.name}</Text>
                <Text style={styles.modalSubtitle}>{PLAT_DU_JOUR.origin}</Text>
              </View>
              <Pressable onPress={() => setPlatOpen(false)} hitSlop={10} style={styles.modalClose}>
                <MaterialCommunityIcons name="close" size={20} color={colors.text} />
              </Pressable>
            </View>

            <ImageBackground
              source={require('../assets/mloukhiyeh.jpg')}
              style={styles.modalImage}
              imageStyle={{ borderRadius: radius.lg }}
            />


            <Text style={styles.modalDescription}>{PLAT_DU_JOUR.description}</Text>

            <View style={styles.modalMetaRow}>
              <View style={styles.metaChip}>
                <MaterialCommunityIcons name="clock-outline" size={14} color={colors.subtle} />
                <Text style={styles.metaText}>{PLAT_DU_JOUR.eta}</Text>
              </View>
              <View style={styles.priceGroup}>
                <View style={styles.qtyStepper}>
                  <Pressable
                    onPress={() => setPlatQty(q => Math.max(1, q - 1))}
                    style={[styles.qtyStepBtn, platQty <= 1 && styles.qtyStepBtnDisabled]}
                    disabled={platQty <= 1}
                    hitSlop={6}
                  >
                    <MaterialCommunityIcons
                      name="minus"
                      size={18}
                      color={platQty <= 1 ? colors.muted : colors.accent}
                    />
                  </Pressable>
                  <Text style={styles.qtyNum}>{platQty}</Text>
                  <Pressable
                    onPress={() => setPlatQty(q => q + 1)}
                    style={styles.qtyStepBtn}
                    hitSlop={6}
                  >
                    <MaterialCommunityIcons name="plus" size={18} color={colors.accent} />
                  </Pressable>
                </View>
                <Text style={styles.modalPrice}>${(PLAT_DU_JOUR.price * platQty).toFixed(0)}</Text>
              </View>
            </View>

            <Pressable style={styles.orderBtn} onPress={handleAddToCart}>
              <MaterialCommunityIcons name="cart-plus" size={18} color="#fff" />
              <Text style={styles.orderBtnText}>Add to cart</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={reviewOpen}
        transparent
        animationType="slide"
        onRequestClose={closeReview}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <Pressable style={styles.modalBackdrop} onPress={closeReview}>
            <Pressable style={styles.reviewModalCard} onPress={() => {}}>
              <View style={styles.reviewModalHeader}>
                <View style={{ width: 34 }} />
                <Text style={styles.reviewProgress}>Question 1 / 1</Text>
                <Pressable onPress={closeReview} hitSlop={10} style={styles.modalClose}>
                  <MaterialCommunityIcons name="close" size={20} color={colors.text} />
                </Pressable>
              </View>

              <Text style={styles.reviewQuestion}>
                How's your stay going? <Text style={styles.required}>*</Text>
              </Text>

              <View style={styles.reviewModalStarsRow}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Pressable
                    key={n}
                    onPress={() => setReviewRating(n)}
                    hitSlop={6}
                    style={styles.reviewModalStarBtn}
                  >
                    <MaterialCommunityIcons
                      name="star"
                      size={42}
                      color={n <= reviewRating ? colors.accent2 : colors.border}
                    />
                  </Pressable>
                ))}
              </View>

              <Text style={styles.reviewLabel}>Comment</Text>
              <View style={styles.reviewInputWrap}>
                <TextInput
                  style={styles.reviewInput}
                  placeholder="Type here..."
                  placeholderTextColor={colors.muted}
                  value={reviewComment}
                  onChangeText={(t) => setReviewComment(t.slice(0, 250))}
                  multiline
                  maxLength={250}
                />
                <Text style={styles.reviewCounter}>
                  {reviewComment.length} / 250
                </Text>
              </View>

              <Pressable
                style={[
                  styles.reviewContinueBtn,
                  reviewRating === 0 && styles.reviewContinueBtnDisabled,
                ]}
                onPress={submitReview}
                disabled={reviewRating === 0}
              >
                <Text style={styles.reviewContinueText}>Continue</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

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
  heroTopRight: {
    flexDirection: 'row',
    gap: 10,
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    backgroundColor: colors.accent2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
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
  liveDot: {
    position: 'absolute',
    top: -2,
    right: -3,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger,
    borderWidth: 1.5,
    borderColor: colors.accent,
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
  carouselFullText: {
    position: 'absolute',
    top: 18,
    left: 18,
    right: 18,
  },
  carouselFullTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  carouselFullSubtitle: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 13,
    marginTop: 4,
    letterSpacing: 0.2,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  dotsFull: {
    bottom: 14,
    left: undefined,
    right: 16,
    justifyContent: 'flex-end',
  },
  dots: {
    position: 'absolute',
    bottom: 12,
    right: 14,
    flexDirection: 'row',
    justifyContent: 'flex-end',
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
  platFab: {
    position: 'absolute',
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8E1CB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  modalEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    color: colors.accent2,
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text,
  },
  modalSubtitle: {
    fontSize: 13,
    color: colors.subtle,
    marginTop: 2,
  },
  modalClose: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalImage: {
    height: 180,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginTop: 18,
  },
  modalDescription: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.subtle,
    marginTop: 16,
  },
  modalMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colors.bg,
    borderRadius: 999,
  },
  metaText: {
    fontSize: 12,
    color: colors.subtle,
    fontWeight: '600',
  },
  modalPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  priceGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  qtyStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  qtyStepBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  qtyStepBtnDisabled: {
    opacity: 0.5,
  },
  qtyNum: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    minWidth: 18,
    textAlign: 'center',
  },
  orderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 22,
    paddingVertical: 16,
    borderRadius: 999,
    backgroundColor: colors.accent,
  },
  orderBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  reviewWidget: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 22,
    paddingHorizontal: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 8,
  },
  reviewWidgetTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  reviewStarsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  reviewStarBtn: {
    padding: 2,
  },
  reviewModalCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
  },
  reviewModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  reviewProgress: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  reviewQuestion: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 14,
  },
  required: {
    color: colors.danger,
  },
  reviewModalStarsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  reviewModalStarBtn: {
    padding: 2,
  },
  reviewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  reviewInputWrap: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 12,
    minHeight: 110,
  },
  reviewInput: {
    fontSize: 14,
    color: colors.text,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  reviewCounter: {
    alignSelf: 'flex-end',
    fontSize: 12,
    color: colors.muted,
    marginTop: 6,
  },
  reviewContinueBtn: {
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 999,
    backgroundColor: colors.accent,
    alignItems: 'center',
  },
  reviewContinueBtnDisabled: {
    backgroundColor: '#A8C7D2',
  },
  reviewContinueText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
