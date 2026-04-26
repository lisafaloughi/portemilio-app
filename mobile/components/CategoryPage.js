import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../theme';

const HERO_HEIGHT = 320;

export default function CategoryPage({
  navigation,
  title,
  images = [],
  description,
  rows = [],
  extra,
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const id = setInterval(() => {
      setIndex(prev => (prev + 1) % images.length);
    }, 1000);
    return () => clearInterval(id);
  }, [images.length]);

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
        bounces={false}
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
          {extra ? <View style={{ marginTop: spacing.lg }}>{extra}</View> : null}
          {rows.length > 0 && (
            <View style={styles.rowsCard}>
              {rows.map((row, i) => (
                <React.Fragment key={i}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.row,
                      pressed && row.onPress && { backgroundColor: colors.bg },
                    ]}
                    onPress={row.onPress}
                    disabled={!row.onPress}
                  >
                    {row.image ? (
                      <Image source={row.image} style={styles.rowImage} />
                    ) : row.icon ? (
                      <MaterialCommunityIcons
                        name={row.icon}
                        size={22}
                        color={colors.accent}
                        style={{ marginRight: 14 }}
                      />
                    ) : null}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowTitle}>{row.title}</Text>
                      {row.subtitle ? <Text style={styles.rowSubtitle}>{row.subtitle}</Text> : null}
                    </View>
                    {row.onPress ? (
                      <MaterialCommunityIcons name="chevron-right" size={22} color={colors.muted} />
                    ) : null}
                  </Pressable>
                  {i < rows.length - 1 ? <View style={styles.divider} /> : null}
                </React.Fragment>
              ))}
            </View>
          )}
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
    backgroundColor: 'rgba(0,0,0,0.18)',
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
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: 0.3,
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
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
  },
  rowsCard: {
    marginTop: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 16,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: spacing.md + 22 + 14,
  },
  rowImage: {
    width: 60,
    height: 60,
    borderRadius: radius.sm,
    marginRight: 14,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  rowSubtitle: {
    fontSize: 13,
    color: colors.subtle,
    marginTop: 2,
  },
});
