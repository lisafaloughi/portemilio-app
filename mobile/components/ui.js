import React, { useLayoutEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, radius, font, placeholderColor, placeholderIcon } from '../theme';

export function Screen({ children, refreshing, onRefresh, scroll = true }) {
  const Body = scroll ? ScrollView : View;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <Body
        contentContainerStyle={scroll ? { padding: spacing.lg, paddingBottom: spacing.xxl * 2 } : undefined}
        style={{ flex: 1 }}
        refreshControl={scroll && onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} /> : undefined}
      >
        {children}
      </Body>
    </SafeAreaView>
  );
}

// White-background page with circular back button + large navy heading (matches Account info style)
export function HeaderScreen({ title, navigation, children, onRefresh, refreshing, keyboardShouldPersistTaps }) {
  const insets = useSafeAreaInsets();
  useLayoutEffect(() => {
    navigation?.setOptions({ headerShown: false });
  }, [navigation]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xxl }}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} /> : undefined}
      >
        <Pressable style={styles.headerBackBtn} onPress={() => navigation?.goBack()} hitSlop={8}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{title}</Text>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function Card({ children, style, onPress }) {
  const Tag = onPress ? Pressable : View;
  return (
    <Tag onPress={onPress} style={({ pressed }) => [
      styles.card, style, pressed && { opacity: 0.85 }
    ]}>
      {children}
    </Tag>
  );
}

export function PlaceholderImage({ keyName = '', category = '', height = 160, rounded = 'top' }) {
  const bg = placeholderColor(keyName || category);
  const icon = placeholderIcon(category || keyName);
  const borderRadius = rounded === 'top' ? { borderTopLeftRadius: radius.md, borderTopRightRadius: radius.md }
    : rounded === 'all' ? { borderRadius: radius.md }
    : {};
  return (
    <View style={[{ height, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }, borderRadius]}>
      <MaterialCommunityIcons name={icon} size={56} color="#fff" />
    </View>
  );
}

export function Button({ title, onPress, variant = 'primary', disabled, style }) {
  const bg = disabled ? colors.muted : variant === 'primary' ? colors.accent : variant === 'danger' ? colors.danger : colors.surface;
  const color = variant === 'secondary' ? colors.accent : '#fff';
  const borderColor = variant === 'secondary' ? colors.accent : bg;
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        { backgroundColor: bg, borderColor, borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.md, paddingVertical: 12, paddingHorizontal: spacing.lg, alignItems: 'center' },
        pressed && { opacity: 0.85 },
        style,
      ]}
    >
      <Text style={{ color, fontWeight: '600', fontSize: 15 }}>{title}</Text>
    </Pressable>
  );
}

export function SectionTitle({ children, action, style }) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.lg, marginBottom: spacing.md }, style]}>
      <Text style={font.h2}>{children}</Text>
      {action}
    </View>
  );
}

export function Loading() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl }}>
      <ActivityIndicator color={colors.accent} />
    </View>
  );
}

export function ErrorText({ children }) {
  if (!children) return null;
  return <Text style={{ color: colors.danger, marginTop: spacing.sm }}>{children}</Text>;
}

export function Row({ children, style }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center' }, style]}>{children}</View>;
}

export function Chip({ label }) {
  return (
    <View style={{ backgroundColor: colors.accent2 + '22', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start' }}>
      <Text style={{ fontSize: 11, color: colors.accent2, fontWeight: '600' }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  headerBackBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  headerTitle: {
    fontSize: 32, fontWeight: '700', color: colors.accent, marginBottom: spacing.lg,
  },
});
