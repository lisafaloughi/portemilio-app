import React, { useEffect, useLayoutEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ImageBackground,
  StyleSheet,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Loading } from '../components/ui';
import { colors, radius } from '../theme';
import { api, API_BASE_URL } from '../api';

const HERO_HEIGHT = 300;
const heroImg = (seed) => `https://picsum.photos/seed/${seed}/1200/700`;

// API_BASE_URL ends in /api — strip it for static asset URLs (/uploads/...)
const HOST = API_BASE_URL.replace(/\/api\/?$/, '');
function absUrl(url) {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;
  return HOST + (url.startsWith('/') ? url : '/' + url);
}
function getHeroSource(f, facilityKey) {
  if (f && f.image_urls) {
    try {
      const urls = JSON.parse(f.image_urls);
      if (urls.length) return { uri: absUrl(urls[0]) };
    } catch (_) { /* fall through */ }
  }
  return { uri: heroImg(facilityKey) };
}

export default function FacilityDetailScreen({ route, navigation }) {
  const { facilityKey, title } = route.params;
  const insets = useSafeAreaInsets();
  const [f, setF] = useState(null);
  const [loading, setLoading] = useState(true);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    api.facility(facilityKey).then(r => { setF(r); setLoading(false); });
  }, [facilityKey]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <Loading />
      </View>
    );
  }
  if (!f) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Not found</Text>
      </View>
    );
  }

  const subtitle = f.category ? prettify(f.category) : '';

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: f.bookable ? 120 : 40 }}
      >
        <ImageBackground
          source={getHeroSource(f, facilityKey)}
          style={styles.hero}
        >
          <View style={styles.heroGradient} />
          <Pressable
            style={[styles.backBtn, { top: insets.top + 8 }]}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
          </Pressable>
          <View style={styles.heroFooter}>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle}>{f.name || title}</Text>
              {subtitle ? <Text style={styles.heroSubtitle}>{subtitle}</Text> : null}
            </View>
            {f.location ? (
              <View style={styles.locationBtn}>
                <MaterialCommunityIcons name="map-marker-outline" size={18} color="#fff" />
              </View>
            ) : null}
          </View>
        </ImageBackground>

        {f.hours ? (
          <View style={styles.block}>
            <View style={styles.timetableRow}>
              <Text style={styles.timetableLabel}>Timetable</Text>
              <Text style={styles.timetableValue}>{f.hours}</Text>
            </View>
            <Text style={styles.link}>See full opening hours</Text>
          </View>
        ) : null}

        <View style={styles.divider} />

        {f.description ? (
          <View style={styles.block}>
            <Text style={styles.description}>{f.description}</Text>
          </View>
        ) : null}

        {f.location ? <InfoRow icon="map-marker-outline" title="Location" subtitle={f.location} /> : null}
        {f.price ? <InfoRow icon="credit-card-outline" title="Price" subtitle={f.price} /> : null}
        {f.phone ? (
          <InfoRow
            icon="phone-outline"
            title="Call"
            subtitle={f.phone}
            onPress={() => Linking.openURL(`tel:${f.phone}`)}
          />
        ) : null}
        {f.extra_info ? <InfoRow icon="information-outline" title="Information" subtitle={f.extra_info} /> : null}
      </ScrollView>

      {f.bookable ? (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
          <Pressable
            style={({ pressed }) => [styles.bookBtn, pressed && { opacity: 0.9 }]}
            onPress={() => navigation.navigate('Booking', {
              resource_type: f.key,
              resource_id: f.id,
              resource_name: f.name,
            })}
          >
            <Text style={styles.bookBtnText}>Reserve</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function InfoRow({ icon, title, subtitle, onPress }) {
  return (
    <Pressable style={styles.infoRow} onPress={onPress} disabled={!onPress}>
      <MaterialCommunityIcons name={icon} size={22} color={colors.accent} style={{ marginRight: 16 }} />
      <View style={{ flex: 1 }}>
        <Text style={styles.infoTitle}>{title}</Text>
        {subtitle ? <Text style={styles.infoSubtitle}>{subtitle}</Text> : null}
      </View>
      {onPress ? <MaterialCommunityIcons name="chevron-right" size={22} color={colors.muted} /> : null}
    </Pressable>
  );
}

function prettify(s) {
  return String(s).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

const styles = StyleSheet.create({
  hero: { height: HERO_HEIGHT, justifyContent: 'flex-end' },
  heroGradient: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.18)' },
  backBtn: {
    position: 'absolute',
    left: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroFooter: { flexDirection: 'row', alignItems: 'flex-end', padding: 20 },
  heroTitle: {
    fontSize: 30,
    fontWeight: '700',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  heroSubtitle: { fontSize: 16, color: 'rgba(255,255,255,0.95)', marginTop: 4 },
  locationBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  block: { paddingHorizontal: 20, paddingVertical: 18 },
  timetableRow: { flexDirection: 'row', alignItems: 'center' },
  timetableLabel: { fontSize: 17, color: colors.text, width: 120 },
  timetableValue: { fontSize: 17, color: colors.text, flex: 1 },
  link: { fontSize: 15, color: colors.accent, marginTop: 14, fontWeight: '500' },
  divider: { height: 1, backgroundColor: colors.border, marginHorizontal: 20 },
  description: { fontSize: 17, color: colors.text, lineHeight: 24 },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  infoTitle: { fontSize: 17, fontWeight: '600', color: colors.text },
  infoSubtitle: { fontSize: 14, color: colors.subtle, marginTop: 2 },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  bookBtn: {
    backgroundColor: colors.accent,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  bookBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
});
