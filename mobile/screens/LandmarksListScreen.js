import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Image,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius } from '../theme';
import { useLandmarks } from '../data/landmarks';
import { useService } from '../data/services';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'sightseeing', label: 'Sightseeing' },
  { key: 'relevant-services', label: 'Relevant services' },
];

const TYPE_LABEL = {
  sightseeing: 'Sightseeing',
  'relevant-services': 'Relevant services',
};

export default function LandmarksListScreen({ navigation, route }) {
  const initialFilter = route?.params?.filter || 'all';
  const [filter, setFilter] = useState(initialFilter);
  const s = useService('landmarks');
  const { items: all } = useLandmarks();
  const heading = s?.subtitle || s?.name || 'Destination Guide';

  const items = useMemo(
    () =>
      filter === 'all'
        ? all
        : all.filter(l => l.type === filter),
    [filter, all]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>{heading}</Text>
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
        {items.map(l => (
          <Pressable
            key={l.id}
            style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
            onPress={() => navigation.navigate('LandmarkDetail', { id: l.id })}
          >
            <Image source={l.image} style={styles.cardImage} />
            <View style={styles.cardBody}>
              <Text style={styles.cardCategory}>{TYPE_LABEL[l.type]}</Text>
              <Text style={styles.cardName}>{l.name}</Text>
              <Text style={styles.cardSubtitle} numberOfLines={1}>
                {l.subtitle}
              </Text>
            </View>
            <Text style={styles.cardDistance}>{l.distance}</Text>
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
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: colors.bg,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border,
  },
  title: {
    flex: 1, textAlign: 'center', fontSize: 18,
    fontWeight: '700', color: colors.text,
  },
  filtersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  pillActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  pillText: { fontSize: 14, fontWeight: '600', color: colors.text },
  pillTextActive: { color: '#fff' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: 16, marginTop: 12,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border,
    overflow: 'hidden',
  },
  cardImage: { width: 96, height: 96 },
  cardBody: {
    flex: 1, paddingHorizontal: 14, paddingVertical: 14,
    justifyContent: 'center',
  },
  cardCategory: { fontSize: 12, color: colors.subtle, marginBottom: 2 },
  cardName: { fontSize: 16, fontWeight: '700', color: colors.text },
  cardSubtitle: { fontSize: 13, color: colors.subtle, marginTop: 3 },
  cardDistance: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.accent,
    paddingRight: 14,
  },
});
