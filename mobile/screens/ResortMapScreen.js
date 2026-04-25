import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  TextInput,
  FlatList,
  Keyboard,
} from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme';

const PORTEMILIO = { latitude: 33.98135, longitude: 35.61280 };

const INITIAL_CAMERA = {
  center: PORTEMILIO,
  heading: 108,
  pitch: 0,
  zoom: 18,
  altitude: 775,
};

const TABS = [
  { key: 'food', label: 'Food & Drinks', icon: 'silverware-fork-knife' },
  { key: 'activities', label: 'Activities', icon: 'tennis' },
  { key: 'unwind', label: 'Unwind', icon: 'spa-outline' },
  { key: 'services', label: 'Services', icon: 'bell-outline' },
];

const CATEGORY_LABEL = {
  food: 'Food & Drinks',
  activities: 'Activities',
  unwind: 'Unwind',
  services: 'Services',
  other: 'General',
};

const PINS = [
  // Food & Drinks
  { id: 'la-reserve', category: 'food', name: 'La Réserve', icon: 'silverware-fork-knife', lat: 33.98130, lng: 35.61196 },
  { id: 'pool-bar', category: 'food', name: 'Pool Bar', icon: 'glass-cocktail', lat: 33.98130, lng: 35.61279 },
  { id: 'sunset-bar', category: 'food', name: 'Sunset Bar', icon: 'glass-wine', note: 'Upcoming', lat: 33.98228, lng: 35.61239 },
  { id: 'khuans-bar', category: 'food', name: "Khuan's Bar", icon: 'glass-cocktail', lat: 33.98036, lng: 35.61395 },
  { id: 'fellini', category: 'food', name: 'Fellini', icon: 'pasta', lat: 33.98028, lng: 35.61416 },
  { id: 'la-terrasse', category: 'food', name: 'La Terrasse', icon: 'silverware-fork-knife', lat: 33.98137, lng: 35.61217 },

  // Activities
  { id: 'tennis-1', category: 'activities', name: 'Tennis #1', icon: 'tennis', lat: 33.98203, lng: 35.61247 },
  { id: 'tennis-2', category: 'activities', name: 'Tennis #2', icon: 'tennis', lat: 33.98234, lng: 35.61260 },
  { id: 'multi-sport', category: 'activities', name: 'Multi-Sport', icon: 'soccer', lat: 33.98236, lng: 35.61289 },
  { id: 'petanque', category: 'activities', name: 'Pétanque', icon: 'bowling', lat: 33.98223, lng: 35.61274 },
  { id: 'pilates', category: 'activities', name: 'Pilates', icon: 'yoga', lat: 33.98076, lng: 35.61419 },
  { id: 'playground', category: 'activities', name: 'Playground', icon: 'slide', lat: 33.98226, lng: 35.61316 },
  { id: 'gun-club', category: 'activities', name: 'Kaslik Gun Club', icon: 'target', lat: 33.98112, lng: 35.61411 },
  { id: 'gym', category: 'activities', name: 'Gym', icon: 'dumbbell', lat: 33.98189, lng: 35.61377 },
  { id: 'water-sports', category: 'activities', name: 'Water Sports', icon: 'sail-boat', lat: 33.98199, lng: 35.61211 },
  { id: 'nursery', category: 'activities', name: 'Nursery', icon: 'baby-carriage', lat: 33.98056, lng: 35.61386 },

  // Unwind
  { id: 'olympic-pool', category: 'unwind', name: 'Olympic Pool', icon: 'pool', lat: 33.98165, lng: 35.61270 },
  { id: 'children-pool', category: 'unwind', name: 'Children Pool', icon: 'pool', lat: 33.98156, lng: 35.61230 },
  { id: 'fountain-pool', category: 'unwind', name: 'Fountain Pool', icon: 'fountain', lat: 33.98122, lng: 35.61250 },
  { id: 'beauty-salon', category: 'unwind', name: 'Beauty Salon', icon: 'content-cut', lat: 33.98098, lng: 35.61424 },
  { id: 'le-rodin-spa', category: 'unwind', name: 'Le Rodin Spa', icon: 'spa', lat: 33.98177, lng: 35.61411 },
  { id: 'comedy-theatre', category: 'unwind', name: 'The Retro Theatre', icon: 'drama-masks', lat: 33.98146, lng: 35.61441 },
  { id: 'iview', category: 'unwind', name: 'Iview', icon: 'sofa', lat: 33.98122, lng: 35.61214 },
  { id: 'pavillion', category: 'unwind', name: 'Pavillion', icon: 'party-popper', lat: 33.98111, lng: 35.61222 },

  // Services
  { id: 'reception-chalet', category: 'services', name: 'Reception Chalet', icon: 'bell-outline', lat: 33.98101, lng: 35.61437 },
  { id: 'administration', category: 'services', name: 'Administration', icon: 'clipboard-text-outline', lat: 33.98108, lng: 35.61438 },

  // Always-visible (no category)
  { id: 'restrooms', category: 'other', name: 'Restrooms', icon: 'human-male-female', lat: 33.98108, lng: 35.61240 },
  { id: 'outdoor-parking', category: 'other', name: 'Outdoor Parking', icon: 'parking', lat: 33.98085, lng: 35.61453 },
  { id: 'private-parking', category: 'other', name: 'Private Parking', icon: 'parking', lat: 33.98043, lng: 35.61378 },
  { id: 'hotel', category: 'other', name: 'Hotel', icon: 'bed', lat: 33.98016, lng: 35.61399 },
  { id: 'marina', category: 'other', name: 'Marina', icon: 'anchor', lat: 33.98178, lng: 35.61156 },
  { id: 'mini-market', category: 'other', name: 'Mini-Market', icon: 'cart-outline', lat: 33.98068, lng: 35.61402 },
  { id: 'convenient-store', category: 'other', name: 'Convenient Store', icon: 'store', lat: 33.98100, lng: 35.61417 },
];

export default function ResortMapScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const mapRef = useRef(null);
  const [tab, setTab] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const visiblePins = useMemo(() => {
    if (!tab) return PINS;
    return PINS.filter(p => p.category === tab);
  }, [tab]);

  useEffect(() => {
    if (selectedId && !visiblePins.some(p => p.id === selectedId)) {
      setSelectedId(null);
      setExpanded(false);
    }
  }, [visiblePins, selectedId]);

  useEffect(() => {
    const pinId = route?.params?.pinId;
    if (!pinId) return;
    const pin = PINS.find(p => p.id === pinId);
    if (!pin) return;
    setTab(pin.category);
    setSelectedId(pin.id);
    setExpanded(false);
    const t = setTimeout(() => {
      mapRef.current?.animateCamera(
        { center: { latitude: pin.lat, longitude: pin.lng } },
        { duration: 500 }
      );
    }, 350);
    return () => clearTimeout(t);
  }, [route?.params?.pinId]);

  const centerOn = (pin) => {
    if (selectedId === pin.id) {
      setSelectedId(null);
      setExpanded(false);
      return;
    }
    setSelectedId(pin.id);
    setExpanded(false);
    mapRef.current?.animateCamera(
      { center: { latitude: pin.lat, longitude: pin.lng } },
      { duration: 400 }
    );
  };

  const handleTabPress = (key) => {
    setTab(prev => (prev === key ? null : key));
  };

  const handleSearchSelect = (pin) => {
    setSearchOpen(false);
    setQuery('');
    Keyboard.dismiss();
    setTimeout(() => centerOn(pin), 150);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PINS;
    return PINS.filter(p => p.name.toLowerCase().includes(q));
  }, [query]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>Resort Map</Text>
        <Pressable style={styles.iconBtn} onPress={() => setSearchOpen(true)}>
          <MaterialCommunityIcons name="magnify" size={20} color={colors.text} />
        </Pressable>
      </View>

      <View style={styles.tabRow}>
        {TABS.map(t => {
          const active = t.key === tab;
          return (
            <Pressable key={t.key} style={styles.tab} onPress={() => handleTabPress(t.key)}>
              <MaterialCommunityIcons
                name={t.icon}
                size={20}
                color={active ? colors.accent : colors.subtle}
                style={{ marginBottom: 4 }}
              />
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]} numberOfLines={1}>
                {t.label}
              </Text>
              <View style={[styles.tabUnderline, active && styles.tabUnderlineActive]} />
            </Pressable>
          );
        })}
      </View>

      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={{ flex: 1 }}
        initialCamera={INITIAL_CAMERA}
        mapType="hybrid"
        showsCompass
        showsPointsOfInterest={false}
        showsBuildings={false}
      >
        {visiblePins.map(pin => {
          const selected = pin.id === selectedId;
          const fill = selected ? colors.accent2 : BEIGE;
          const iconColor = selected ? '#fff' : colors.accent;
          const circle = selected ? 28 : 22;
          const tail = selected ? 9 : 8;
          const totalHeight = circle + tail - 1;
          return (
            <Marker
              key={pin.id}
              coordinate={{ latitude: pin.lat, longitude: pin.lng }}
              onPress={() => centerOn(pin)}
              anchor={{ x: 0.5, y: 1 }}
              centerOffset={{ x: 0, y: -totalHeight / 2 }}
              tracksViewChanges={selected}
            >
              <View style={styles.pinWrap}>
                <View style={[styles.pinCircle, { width: circle, height: circle, borderRadius: circle / 2, backgroundColor: fill }]}>
                  <MaterialCommunityIcons name={pin.icon} size={Math.round(circle * 0.55)} color={iconColor} />
                </View>
                <View style={{
                  width: 0, height: 0,
                  borderLeftWidth: tail, borderRightWidth: tail, borderTopWidth: tail + 2,
                  borderLeftColor: 'transparent', borderRightColor: 'transparent',
                  borderTopColor: fill,
                  marginTop: -3.5,
                }} />
              </View>
            </Marker>
          );
        })}
      </MapView>

      {selectedId ? (
        <Pressable
          style={[styles.card, { paddingBottom: insets.bottom + 16 }]}
          onPress={() => setExpanded(e => !e)}
        >
          {(() => {
            const p = PINS.find(x => x.id === selectedId);
            if (!p) return null;
            return (
              <>
                <View style={styles.cardHandle} />
                <Text style={styles.cardCategory}>{CATEGORY_LABEL[p.category]}</Text>
                <Text style={styles.cardName}>{p.name}</Text>
                {p.note ? <Text style={styles.cardNote}>{p.note}</Text> : null}
                {expanded ? (
                  <>
                    <View style={styles.cardDivider} />
                    <Text style={styles.cardDetail}>More details coming soon.</Text>
                  </>
                ) : null}
              </>
            );
          })()}
        </Pressable>
      ) : null}

      <Modal visible={searchOpen} animationType="slide" onRequestClose={() => setSearchOpen(false)}>
        <View style={{ flex: 1, backgroundColor: colors.surface, paddingTop: insets.top + 8 }}>
          <View style={styles.searchBar}>
            <MaterialCommunityIcons name="magnify" size={20} color={colors.muted} style={{ marginRight: 8 }} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              autoFocus
              placeholder="Search the resort..."
              placeholderTextColor={colors.muted}
              style={styles.searchInput}
              returnKeyType="search"
            />
            <Pressable
              onPress={() => { setSearchOpen(false); setQuery(''); }}
              style={styles.searchClose}
            >
              <MaterialCommunityIcons name="close" size={16} color={colors.text} />
            </Pressable>
          </View>
          <FlatList
            data={filtered}
            keyExtractor={p => p.id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable style={styles.searchRow} onPress={() => handleSearchSelect(item)}>
                <Text style={styles.searchRowName}>{item.name}</Text>
                <Text style={styles.searchRowCat}>{CATEGORY_LABEL[item.category]}</Text>
              </Pressable>
            )}
            ItemSeparatorComponent={() => <View style={styles.searchSep} />}
            ListEmptyComponent={() => (
              <Text style={styles.searchEmpty}>No matches</Text>
            )}
          />
        </View>
      </Modal>
    </View>
  );
}

const BEIGE = '#e8dfcf';

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: colors.surface,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: { flex: 1, paddingTop: 6, alignItems: 'center' },
  tabLabel: { fontSize: 12, color: colors.subtle, fontWeight: '500' },
  tabLabelActive: { color: colors.accent, fontWeight: '700' },
  tabUnderline: { height: 3, width: '70%', marginTop: 6, backgroundColor: 'transparent', borderRadius: 2 },
  tabUnderlineActive: { backgroundColor: colors.accent },

  pinWrap: {
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  pinCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  card: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    paddingHorizontal: 20,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 8,
  },
  cardHandle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: 10,
  },
  cardCategory: { fontSize: 13, color: colors.subtle, fontWeight: '500' },
  cardName: { fontSize: 20, fontWeight: '700', color: colors.text, marginTop: 2 },
  cardNote: { fontSize: 13, color: colors.accent2, fontWeight: '600', marginTop: 4 },
  cardDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginTop: 14,
  },
  cardDetail: {
    fontSize: 14,
    color: colors.muted,
    marginTop: 14,
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchInput: { flex: 1, fontSize: 17, color: colors.text, paddingVertical: 8 },
  searchClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  searchRow: { paddingHorizontal: 20, paddingVertical: 16 },
  searchRowName: { fontSize: 16, color: colors.text, fontWeight: '500' },
  searchRowCat: { fontSize: 13, color: colors.subtle, marginTop: 2 },
  searchSep: { height: 1, backgroundColor: colors.border, marginHorizontal: 20 },
  searchEmpty: { textAlign: 'center', color: colors.muted, marginTop: 40 },
});
