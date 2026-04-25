import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  StyleSheet,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing } from '../theme';

const HERO_HEIGHT = 320;

export default function VenueDetailPage({
  navigation,
  title,
  subtitle,
  images = [],
  description,
  highlights = [],
  address,
  phone,
  website,
  menuUrl,
  showMenuButton = false,
  mapPinId,
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const id = setInterval(() => {
      setIndex(prev => (prev + 1) % images.length);
    }, 1000);
    return () => clearInterval(id);
  }, [images.length]);

  const callPhone = () => Linking.openURL(`tel:${phone.replace(/\s+/g, '')}`);
  const openWebsite = () => Linking.openURL(website);
  const openOnMap = () => {
    navigation.navigate('ResortMap', { pinId: mapPinId });
  };
  const openMenu = () => {
    if (menuUrl) {
      Linking.openURL(menuUrl).catch(() =>
        Alert.alert('Unable to open menu', 'Please try again later.')
      );
    } else {
      Alert.alert('Menu coming soon', "We're polishing it. Check back shortly.");
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        <View style={styles.hero}>
          {images.map((src, i) => (
            <Image
              key={i}
              source={src}
              style={[StyleSheet.absoluteFill, { opacity: i === index ? 1 : 0 }]}
              resizeMode="cover"
            />
          ))}
          <View style={styles.heroShade} />
          <SafeAreaView edges={['top']} style={styles.heroSafe}>
            <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
              <MaterialCommunityIcons name="arrow-left" size={20} color="#fff" />
            </Pressable>
          </SafeAreaView>
          <View style={styles.heroBottom}>
            <Text style={styles.heroTitle}>{title}</Text>
            {subtitle ? <Text style={styles.heroSubtitle}>{subtitle}</Text> : null}
            {images.length > 1 && (
              <View style={styles.dots}>
                {images.map((_, i) => (
                  <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
                ))}
              </View>
            )}
          </View>
        </View>

        <View style={styles.body}>
          {description ? <Text style={styles.description}>{description}</Text> : null}

          {showMenuButton && (
            <Pressable style={styles.menuBtn} onPress={openMenu}>
              <MaterialCommunityIcons
                name="silverware-fork-knife"
                size={18}
                color={colors.text}
              />
              <Text style={styles.menuBtnText}>View menu</Text>
              <MaterialCommunityIcons
                name="chevron-right"
                size={18}
                color={colors.muted}
              />
            </Pressable>
          )}

          {highlights.length > 0 && (
            <>
              <View style={styles.divider} />
              {highlights.map((h, i) => (
                <View key={i} style={styles.bulletRow}>
                  <View style={styles.bullet} />
                  <Text style={styles.bulletText}>{h}</Text>
                </View>
              ))}
            </>
          )}

          {address ? (
            <>
              <View style={styles.divider} />
              {mapPinId ? (
                <Pressable
                  style={styles.contactRow}
                  onPress={openOnMap}
                  hitSlop={6}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sectionLabel}>Location</Text>
                    <Text style={[styles.sectionBody, { marginTop: 4 }]}>{address}</Text>
                  </View>
                  <View style={styles.iconCircle}>
                    <MaterialCommunityIcons name="map-marker-outline" size={18} color={colors.text} />
                  </View>
                </Pressable>
              ) : (
                <>
                  <Text style={styles.sectionLabel}>Location</Text>
                  <Text style={styles.sectionBody}>{address}</Text>
                </>
              )}
            </>
          ) : null}

          {phone ? (
            <>
              <View style={styles.divider} />
              <View style={styles.contactRow}>
                <Text style={styles.contactText}>{phone}</Text>
                <Pressable onPress={callPhone} style={styles.iconCircle} hitSlop={6}>
                  <MaterialCommunityIcons name="phone-outline" size={18} color={colors.text} />
                </Pressable>
              </View>
            </>
          ) : null}

          {website ? (
            <>
              <View style={styles.divider} />
              <View style={styles.contactRow}>
                <Text style={styles.contactText}>Website</Text>
                <Pressable onPress={openWebsite} style={styles.iconCircle} hitSlop={6}>
                  <MaterialCommunityIcons name="link-variant" size={18} color={colors.text} />
                </Pressable>
              </View>
            </>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  hero: {
    height: HERO_HEIGHT,
    backgroundColor: colors.bg,
    overflow: 'hidden',
  },
  heroShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.22)',
  },
  heroSafe: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBottom: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 22,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 14,
    marginTop: 4,
  },
  dots: {
    flexDirection: 'row',
    gap: 5,
    marginTop: 10,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotActive: {
    width: 14,
    backgroundColor: '#fff',
  },
  body: {
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 60,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.lg,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  bullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.text,
    marginRight: 14,
    marginLeft: 4,
  },
  bulletText: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  sectionBody: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contactText: {
    fontSize: 15,
    color: colors.text,
    flex: 1,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  menuBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: spacing.lg,
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: colors.surface,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  menuBtnText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 0.2,
  },
});
