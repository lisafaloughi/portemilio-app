import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
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
  { key: 'food', label: 'Food & Drinks', icon: '🍽️' },
  { key: 'activities', label: 'Activities', icon: '🎾' },
  { key: 'unwind', label: 'Unwind', icon: '💆' },
  { key: 'services', label: 'Services', icon: '🛎️' },
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
  { id: 'la-reserve', category: 'food', name: 'La Réserve', lat: 33.98130, lng: 35.61196 },
  { id: 'pool-bar', category: 'food', name: 'Pool Bar', lat: 33.98130, lng: 35.61279 },
  { id: 'sunset-bar', category: 'food', name: 'Sunset Bar', note: 'Upcoming', lat: 33.98228, lng: 35.61239 },

  // Activities
  { id: 'tennis-1', category: 'activities', name: 'Tennis Court #1', lat: 33.98203, lng: 35.61247 },
  { id: 'tennis-2', category: 'activities', name: 'Tennis Court #2', lat: 33.98234, lng: 35.61260 },
  { id: 'multi-sport', category: 'activities', name: 'Multi-Sport Court', lat: 33.98236, lng: 35.61289 },
  { id: 'petanque', category: 'activities', name: 'Pétanque Court', lat: 33.98223, lng: 35.61274 },
  { id: 'playground', category: 'activities', name: 'Playground', lat: 33.98226, lng: 35.61316 },
  { id: 'gun-club', category: 'activities', name: 'Kaslik Gun Club', lat: 33.98112, lng: 35.61411 },
  { id: 'gym', category: 'activities', name: 'Gym', lat: 33.98189, lng: 35.61377 },

  // Unwind
  { id: 'olympic-pool', category: 'unwind', name: 'Olympic Pool', lat: 33.98165, lng: 35.61270 },
  { id: 'children-pool', category: 'unwind', name: 'Children Pool', lat: 33.98156, lng: 35.61230 },
  { id: 'fountain-pool', category: 'unwind', name: 'Fountain Pool', lat: 33.98122, lng: 35.61250 },
  { id: 'le-rodin-spa', category: 'unwind', name: 'Le Rodin Spa', lat: 33.98177, lng: 35.61411 },
  { id: 'comedy-theatre', category: 'unwind', name: 'Comedy Theatre', lat: 33.98146, lng: 35.61441 },
  { id: 'iview-lounge', category: 'unwind', name: 'Iview Lounge', lat: 33.98122, lng: 35.61214 },
  { id: 'event-pavilion', category: 'unwind', name: 'Event Pavilion', lat: 33.98111, lng: 35.61222 },

  // Services
  { id: 'reception-chalet', category: 'services', name: 'Reception Chalet', lat: 33.98101, lng: 35.61437 },
  { id: 'administration', category: 'services', name: 'Administration', lat: 33.98108, lng: 35.61438 },

  // Always-visible (no category)
  { id: 'restrooms', category: 'other', name: 'Restrooms', lat: 33.98108, lng: 35.61240 },
  { id: 'outdoor-parking', category: 'other', name: 'Outdoor Parking', lat: 33.98085, lng: 35.61453 },
  { id: 'private-parking', category: 'other', name: 'Private Parking', lat: 33.98043, lng: 35.61378 },
  { id: 'hotel', category: 'other', name: 'Hotel', lat: 33.98016, lng: 35.61399 },
  { id: 'marina', category: 'other', name: 'Marina', lat: 33.98178, lng: 35.61156 },
];

export default function ResortMapScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const mapRef = useRef(null);
  const [tab, setTab] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const visiblePins = useMemo(() => {
    if (!tab) return PINS;
    return PINS.filter(p => p.category === tab || p.category === 'other');
  }, [tab]);

  const centerOn = (pin) => {
    setSelectedId(pin.id);
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
          <Text style={styles.iconText}>←</Text>
        </Pressable>
        <Text style={styles.title}>Resort Map</Text>
        <Pressable style={styles.iconBtn} onPress={() => setSearchOpen(true)}>
          <Text style={styles.iconText}>🔍</Text>
        </Pressable>
      </View>

      <View style={styles.tabRow}>
        {TABS.map(t => {
          const active = t.key === tab;
          return (
            <Pressable key={t.key} style={styles.tab} onPress={() => handleTabPress(t.key)}>
              <Text style={styles.tabIcon}>{t.icon}</Text>
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
      >
        {visiblePins.map(pin => {
          const selected = pin.id === selectedId;
          return (
            <Marker
              key={`${pin.id}-${selected ? 'sel' : 'def'}`}
              coordinate={{ latitude: pin.lat, longitude: pin.lng }}
              onPress={() => centerOn(pin)}
              anchor={{ x: 0.5, y: 1 }}
              tracksViewChanges={false}
            >
              <View style={selected ? styles.pinSelected : styles.pin}>
                <View style={selected ? styles.pinDotSelected : styles.pinDot} />
              </View>
            </Marker>
          );
        })}
      </MapView>

      {selectedId ? (
        <View style={[styles.card, { paddingBottom: insets.bottom + 16 }]}>
          {(() => {
            const p = PINS.find(x => x.id === selectedId);
            if (!p) return null;
            return (
              <>
                <Text style={styles.cardCategory}>{CATEGORY_LABEL[p.category]}</Text>
                <Text style={styles.cardName}>{p.name}</Text>
                {p.note ? <Text style={styles.cardNote}>{p.note}</Text> : null}
              </>
            );
          })()}
        </View>
      ) : null}

      <Modal visible={searchOpen} animationType="slide" onRequestClose={() => setSearchOpen(false)}>
        <View style={{ flex: 1, backgroundColor: colors.surface, paddingTop: insets.top + 8 }}>
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>🔍</Text>
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
              <Text style={styles.searchCloseText}>✕</Text>
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconText: { fontSize: 18, color: colors.text },
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
  tabIcon: { fontSize: 20, marginBottom: 4 },
  tabLabel: { fontSize: 12, color: colors.subtle, fontWeight: '500' },
  tabLabelActive: { color: colors.accent, fontWeight: '700' },
  tabUnderline: { height: 3, width: '70%', marginTop: 6, backgroundColor: 'transparent', borderRadius: 2 },
  tabUnderlineActive: { backgroundColor: colors.accent },

  pin: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: BEIGE,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  pinDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  pinSelected: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accent2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
  },
  pinDotSelected: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff' },

  card: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 0,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardCategory: { fontSize: 13, color: colors.subtle, fontWeight: '500' },
  cardName: { fontSize: 20, fontWeight: '700', color: colors.text, marginTop: 2 },
  cardNote: { fontSize: 13, color: colors.accent2, fontWeight: '600', marginTop: 4 },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchIcon: { fontSize: 18, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 17, color: colors.text, paddingVertical: 8 },
  searchClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchCloseText: { fontSize: 14, color: colors.text },
  searchRow: { paddingHorizontal: 20, paddingVertical: 16 },
  searchRowName: { fontSize: 16, color: colors.text, fontWeight: '500' },
  searchRowCat: { fontSize: 13, color: colors.subtle, marginTop: 2 },
  searchSep: { height: 1, backgroundColor: colors.border, marginHorizontal: 20 },
  searchEmpty: { textAlign: 'center', color: colors.muted, marginTop: 40 },
});
