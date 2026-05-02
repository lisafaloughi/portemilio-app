import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius } from '../theme';
import { useVenues } from '../data/venues';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'restaurants', label: 'Restaurants' },
  { key: 'bars', label: 'Bars' },
];

const CATEGORY_LABEL = {
  restaurants: 'Restaurant',
  bars: 'Bar',
};

const labelFor = (venue) =>
  venue.categories.map(c => CATEGORY_LABEL[c]).join(' & ');

export default function RestaurantsScreen({ navigation, route }) {
  const initialFilter = route?.params?.filter || 'all';
  const [filter, setFilter] = useState(initialFilter);
  const { venues: allVenues, loading } = useVenues();

  const venues = useMemo(
    () => (filter === 'all' ? allVenues : allVenues.filter(v => v.categories.includes(filter))),
    [filter, allVenues]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>Gastronomy</Text>
        <View style={{ width: 38 }} />
      </View>

      <View style={styles.filtersRow}>
        {FILTERS.map(f => {
          const active = f.key === filter;
          return (
            <Pressable
              key={f.key}
              style={[styles.pill, active && styles.pillActive]}
              onPress={() => setFilter(f.key)}
            >
              <Text style={[styles.pillText, active && styles.pillTextActive]}>{f.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 40, paddingTop: 4 }}
        showsVerticalScrollIndicator={false}
      >
        {loading && !venues.length ? (
          <View style={{ paddingVertical: 60, alignItems: 'center' }}>
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : null}
        {venues.map(v => (
          <Pressable
            key={v.id}
            style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
            onPress={() => navigation.navigate('RestaurantDetail', { id: v.id, title: v.name })}
          >
            <Image source={v.image} style={styles.cardImage} />
            <View style={styles.cardBody}>
              <Text style={styles.cardCategory}>{labelFor(v)}</Text>
              <Text style={styles.cardName}>{v.name}</Text>
              <Text style={styles.cardSpecialty} numberOfLines={1}>
                {v.specialty}
              </Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
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
  filtersRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  pill: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  pillActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  pillTextActive: {
    color: '#fff',
  },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cardImage: {
    width: 96,
    height: 96,
  },
  cardBody: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    justifyContent: 'center',
  },
  cardCategory: {
    fontSize: 12,
    color: colors.subtle,
    marginBottom: 2,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  cardSpecialty: {
    fontSize: 13,
    color: colors.subtle,
    marginTop: 3,
  },
});
