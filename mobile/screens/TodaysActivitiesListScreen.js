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

const ACTIVITIES = [
  {
    id: 'gun-club',
    type: 'Sports',
    name: 'Kaslik Gun Club',
    subtitle: 'Indoor shooting range',
    image: require('../assets/todays-act-1.jpg'),
    target: 'GunClub',
  },
  {
    id: 'pilates',
    type: 'Wellness',
    name: 'Rove Pilates',
    subtitle: 'Reformer classes & private sessions',
    image: require('../assets/todays-act-2.jpg'),
    target: 'RovePilates',
  },
  {
    id: 'gym',
    type: 'Fitness',
    name: 'Gym',
    subtitle: 'At SEArenity Club · Cardio, weights, classes',
    image: require('../assets/todays-act-3.jpg'),
    target: 'SEArenityClub',
  },
  {
    id: 'scuba',
    type: 'Water sports',
    name: 'Scuba Diving',
    subtitle: 'Discover the Mediterranean',
    image: require('../assets/water-sports.jpg'),
    target: 'WaterSports',
  },
];

export default function TodaysActivitiesListScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>Today's Activities</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 40, paddingTop: 6 }}
        showsVerticalScrollIndicator={false}
      >
        {ACTIVITIES.map(a => (
          <Pressable
            key={a.id}
            style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
            onPress={() => navigation.navigate(a.target)}
          >
            <Image source={a.image} style={styles.cardImage} />
            <View style={styles.cardBody}>
              <Text style={styles.cardCategory}>{a.type}</Text>
              <Text style={styles.cardName}>{a.name}</Text>
              <Text style={styles.cardSubtitle} numberOfLines={1}>
                {a.subtitle}
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
