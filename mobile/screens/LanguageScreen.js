import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme';

const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English', enabled: true },
  { code: 'fr', label: 'French', native: 'Français', enabled: false },
  { code: 'ar', label: 'Arabic', native: 'العربية', enabled: false },
];

export default function LanguageScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const selected = 'en';

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <Pressable
        style={[styles.backBtn, { top: insets.top + 10 }]}
        onPress={() => navigation.goBack()}
      >
        <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
      </Pressable>

      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 70,
          paddingHorizontal: 24,
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Language</Text>
        <Text style={styles.intro}>
          Choose your preferred language for the app.
        </Text>

        {LANGUAGES.map((lang) => {
          const isSelected = lang.code === selected;
          return (
            <Pressable
              key={lang.code}
              disabled={!lang.enabled}
              style={({ pressed }) => [
                styles.row,
                pressed && lang.enabled && { opacity: 0.55 },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.rowTitle,
                    !lang.enabled && styles.rowTitleDisabled,
                  ]}
                >
                  {lang.label}
                </Text>
                <Text
                  style={[
                    styles.rowSubtitle,
                    !lang.enabled && styles.rowSubtitleDisabled,
                  ]}
                >
                  {lang.native}
                  {!lang.enabled ? ' · Coming soon' : ''}
                </Text>
              </View>
              {isSelected ? (
                <MaterialCommunityIcons
                  name="check"
                  size={22}
                  color={colors.accent}
                />
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  backBtn: {
    position: 'absolute',
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: colors.accent,
    marginBottom: 6,
  },
  intro: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.subtle,
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  rowTitleDisabled: {
    color: colors.muted,
  },
  rowSubtitle: {
    fontSize: 13,
    color: colors.subtle,
    marginTop: 2,
  },
  rowSubtitleDisabled: {
    color: colors.muted,
  },
});
