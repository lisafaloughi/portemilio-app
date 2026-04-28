import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Linking, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme';

const HOTEL_PHONE = '+961 9 933 300';
const WHATSAPP_PHONE = '+961 81 697 272';
const HOTEL_EMAIL = 'reservation@portemilio.com';
const INSTAGRAM_URL = 'https://www.instagram.com/portemilio/';
const FACEBOOK_URL = 'https://www.facebook.com/PortemilioHotelResort/';
const WEBSITE_URL = 'https://www.portemilio.com';

const open = (url) =>
  Linking.openURL(url).catch(() =>
    Alert.alert('Unable to open', 'Please try again later.')
  );

const digits = (n) => n.replace(/\D/g, '');

const CONTACTS = [
  {
    icon: 'phone-outline',
    title: 'Call the front desk',
    subtitle: HOTEL_PHONE,
    action: () => open(`tel:+${digits(HOTEL_PHONE)}`),
  },
  {
    icon: 'whatsapp',
    title: 'WhatsApp',
    subtitle: WHATSAPP_PHONE,
    action: () => open(`https://wa.me/${digits(WHATSAPP_PHONE)}`),
  },
  {
    icon: 'email-outline',
    title: 'Email reservations',
    subtitle: HOTEL_EMAIL,
    action: () => open(`mailto:${HOTEL_EMAIL}`),
  },
  {
    icon: 'map-marker-outline',
    title: 'Visit us',
    subtitle: "Kaslik Seaside Road | Jounieh, Lebanon",
    action: () => open('https://maps.google.com/?q=Portemilio+Hotel+Kaslik'),
  },
];

export default function ContactUsScreen({ navigation }) {
  const insets = useSafeAreaInsets();

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
        <Text style={styles.title}>Get in Touch</Text>
        <Text style={styles.intro}>
          We're here to help. Pick the channel that suits you best.
        </Text>

        {CONTACTS.map((item, i) => (
          <Pressable
            key={i}
            style={({ pressed }) => [styles.row, pressed && { opacity: 0.55 }]}
            onPress={item.action}
          >
            <MaterialCommunityIcons
              name={item.icon}
              size={22}
              color={colors.accent}
              style={{ marginRight: 18 }}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{item.title}</Text>
              <Text style={styles.rowSubtitle}>{item.subtitle}</Text>
            </View>
          </Pressable>
        ))}

        <Text style={styles.followLabel}>Follow us</Text>
        <View style={styles.socialRow}>
          <Pressable style={styles.socialBtn} onPress={() => open(INSTAGRAM_URL)}>
            <MaterialCommunityIcons name="instagram" size={28} color="#c9a87bfe" />
          </Pressable>
          <Pressable style={styles.socialBtn} onPress={() => open(FACEBOOK_URL)}>
            <MaterialCommunityIcons name="facebook" size={28} color="#c9a87bfe" />
          </Pressable>
          <Pressable style={styles.socialBtn} onPress={() => open(WEBSITE_URL)}>
            <MaterialCommunityIcons name="web" size={28} color="#c9a87bfe" />
          </Pressable>
        </View>
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
    marginBottom: 28,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  rowSubtitle: {
    fontSize: 13,
    color: colors.subtle,
    marginTop: 2,
  },
  followLabel: {
    fontSize: 12,
    letterSpacing: 1.5,
    fontWeight: '700',
    color: colors.subtle,
    textAlign: 'center',
    marginTop: 44,
    marginBottom: 18,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
  },
  socialBtn: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
