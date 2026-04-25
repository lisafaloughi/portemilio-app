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
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../theme';

const HERO_HEIGHT = 320;
const BODY_PADDING = 22;
const GRID_GAP = 10;
const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_CARD_WIDTH = (SCREEN_WIDTH - BODY_PADDING * 2 - GRID_GAP) / 2;

export default function ServiceListPage({
  navigation,
  title,
  images = [],
  description,
  phone,
  mapPinId,
  instagramUrl,
  whatsappUrl,
  appStoreUrl,
  services = [],
  showPrices = true,
  showImages = true,
  priceNote,
  columns = 1,
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const id = setInterval(() => {
      setIndex(prev => (prev + 1) % images.length);
    }, 1000);
    return () => clearInterval(id);
  }, [images.length]);

  const open = (url) =>
    Linking.openURL(url).catch(() =>
      Alert.alert('Cannot open link', 'Please try again later.')
    );
  const callPhone = () => phone && Linking.openURL(`tel:${phone.replace(/\s+/g, '')}`);
  const openOnMap = () => mapPinId && navigation.navigate('ResortMap', { pinId: mapPinId });

  const hasSocial = instagramUrl || whatsappUrl || appStoreUrl;

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={false}
        contentContainerStyle={{ paddingBottom: 60 }}
      >
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
          </View>
        </View>

        <View style={styles.body}>
          {description ? <Text style={styles.lead}>{description}</Text> : null}

          {(phone || mapPinId) && (
            <View style={styles.actionRow}>
              {phone ? (
                <Pressable style={styles.actionBtn} onPress={callPhone}>
                  <MaterialCommunityIcons name="phone-outline" size={16} color="#fff" />
                  <Text style={styles.actionBtnText}>Call</Text>
                </Pressable>
              ) : null}
              {mapPinId ? (
                <Pressable style={[styles.actionBtn, styles.actionBtnAlt]} onPress={openOnMap}>
                  <MaterialCommunityIcons name="map-marker-outline" size={16} color={colors.text} />
                  <Text style={[styles.actionBtnText, { color: colors.text }]}>View on map</Text>
                </Pressable>
              ) : null}
            </View>
          )}

          {hasSocial && (
            <View style={styles.socialRow}>
              {instagramUrl ? (
                <Pressable style={styles.socialBtn} onPress={() => open(instagramUrl)}>
                  <MaterialCommunityIcons name="instagram" size={20} color={colors.text} />
                </Pressable>
              ) : null}
              {whatsappUrl ? (
                <Pressable style={styles.socialBtn} onPress={() => open(whatsappUrl)}>
                  <MaterialCommunityIcons name="whatsapp" size={20} color={colors.text} />
                </Pressable>
              ) : null}
              {appStoreUrl ? (
                <Pressable style={styles.socialBtn} onPress={() => open(appStoreUrl)}>
                  <MaterialCommunityIcons name="apple" size={20} color={colors.text} />
                </Pressable>
              ) : null}
            </View>
          )}

          {services.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>
                {showPrices ? 'SERVICES & RATES' : 'SERVICES'}
              </Text>
              {priceNote ? <Text style={styles.priceNote}>{priceNote}</Text> : null}
              {columns === 2 ? (
                <View style={styles.grid}>
                  {services.map(s => (
                    <View key={s.id} style={styles.gridCard}>
                      <Image source={s.image} style={styles.gridImage} />
                      <View style={styles.gridBody}>
                        <Text style={styles.gridName} numberOfLines={2}>{s.name}</Text>
                        {showPrices && s.price ? (
                          <Text style={styles.gridPrice}>{s.price}</Text>
                        ) : null}
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                services.map(s => (
                  <View
                    key={s.id}
                    style={[
                      styles.serviceCard,
                      s.items?.length ? styles.serviceCardTop : null,
                    ]}
                  >
                    {showImages ? (
                      <Image source={s.image} style={styles.serviceImage} />
                    ) : null}
                    <View
                      style={[
                        styles.serviceBody,
                        !showImages && { paddingLeft: 16, paddingVertical: 16 },
                        s.items?.length && { paddingVertical: 12 },
                      ]}
                    >
                      <Text style={styles.serviceName}>{s.name}</Text>
                      {s.items?.length ? (
                        <View style={styles.serviceItems}>
                          {s.items.map((item, i) => (
                            <Text key={i} style={styles.serviceItemText}>
                              • {item}
                            </Text>
                          ))}
                        </View>
                      ) : null}
                    </View>
                    {showPrices && s.price ? (
                      <Text
                        style={[
                          styles.servicePrice,
                          s.items?.length && { alignSelf: 'flex-start', paddingTop: 14 },
                        ]}
                      >
                        {s.price}
                      </Text>
                    ) : null}
                  </View>
                ))
              )}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  hero: { height: HERO_HEIGHT, backgroundColor: colors.bg, overflow: 'hidden' },
  heroShade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.18)' },
  heroSafe: { paddingHorizontal: 16, paddingTop: 8 },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroBottom: { position: 'absolute', left: 20, right: 20, bottom: 22 },
  heroTitle: { color: '#fff', fontSize: 30, fontWeight: '700' },
  body: { paddingHorizontal: 22, paddingTop: 24 },
  lead: { fontSize: 15, lineHeight: 22, color: colors.text },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: spacing.lg },
  actionBtn: {
    flex: 1, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 13, backgroundColor: colors.accent, borderRadius: 999,
  },
  actionBtnAlt: {
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border,
  },
  actionBtnText: {
    color: '#fff', fontSize: 14, fontWeight: '700', letterSpacing: 0.2,
  },
  socialRow: {
    flexDirection: 'row', gap: 10, marginTop: 10,
  },
  socialBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  sectionLabel: {
    fontSize: 12, letterSpacing: 1.3, fontWeight: '700',
    color: colors.accent,
    marginTop: spacing.xl, marginBottom: spacing.sm,
  },
  priceNote: {
    fontSize: 12, color: colors.subtle,
    marginTop: -4, marginBottom: spacing.sm, fontStyle: 'italic',
  },
  serviceCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border,
    overflow: 'hidden', marginBottom: 10,
  },
  serviceImage: { width: 76, height: 76 },
  serviceBody: { flex: 1, paddingHorizontal: 14 },
  serviceName: { fontSize: 16, fontWeight: '700', color: colors.text },
  servicePrice: {
    fontSize: 14, fontWeight: '700', color: colors.accent,
    paddingRight: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
  gridCard: {
    width: GRID_CARD_WIDTH,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  gridImage: {
    width: '100%',
    height: 96,
  },
  gridBody: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  gridName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 18,
  },
  gridPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.accent,
    marginTop: 4,
  },
});
