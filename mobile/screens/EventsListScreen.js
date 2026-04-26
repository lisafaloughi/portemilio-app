import React from 'react';
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

const EVENTS = [
  {
    id: 'comedy-show',
    type: 'Comedy show',
    name: 'Comedy Show',
    subtitle: 'On weekends · The Sheraka Retro Theatre',
    image: require('../assets/comedy-theatre.jpg'),
    target: 'ComedyShow',
  },
  {
    id: 'match-day',
    type: 'Match day',
    name: 'Germany vs Spain',
    subtitle: '2026 FIFA World Cup · Pool Bar',
    image: require('../assets/fifa.jpg'),
    target: 'MatchDay',
  },
];

export default function EventsListScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>Tonight's Events</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 40, paddingTop: 6 }}
        showsVerticalScrollIndicator={false}
      >
        {EVENTS.map(e => (
          <Pressable
            key={e.id}
            style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
            onPress={() => navigation.navigate(e.target)}
          >
            <Image source={e.image} style={styles.cardImage} />
            <View style={styles.cardBody}>
              <Text style={styles.cardCategory}>{e.type}</Text>
              <Text style={styles.cardName}>{e.name}</Text>
              <Text style={styles.cardSubtitle} numberOfLines={1}>
                {e.subtitle}
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
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: colors.bg,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border,
  },
  title: {
    flex: 1, textAlign: 'center', fontSize: 18,
    fontWeight: '700', color: colors.text,
  },
  card: {
    flexDirection: 'row',
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
});
