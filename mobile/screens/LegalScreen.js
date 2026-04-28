import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme';

const SECTIONS = [
  {
    title: 'Terms of Use',
    body:
      'By using the Portemilio Hotel & Resort mobile application, you agree to comply with these terms. The app is provided for guests staying at Portemilio Hotel & Resort, Kaslik, Lebanon, as well as visitors browsing our services. Use of the app is granted at the discretion of the hotel management and may be revoked at any time without prior notice.',
  },
  {
    title: 'Booking & Reservations',
    body:
      'All bookings made through the app are subject to availability and confirmation by the hotel. Reservations are not guaranteed until you receive a written confirmation from our team. Prices displayed in the app are indicative and may change without notice. Final pricing is confirmed at check-in or upon booking confirmation.',
  },
  {
    title: 'Cancellation Policy',
    body:
      'Cancellations made more than 48 hours before the scheduled service or check-in date are eligible for a full refund. Cancellations within 48 hours may incur a charge equivalent to one night\'s stay or the full service fee. No-shows will be charged in full. Specific events, weddings, and group bookings are subject to separate cancellation terms communicated at the time of booking.',
  },
  {
    title: 'Privacy Policy',
    body:
      'Portemilio Hotel & Resort respects your privacy. The personal information you provide — including name, contact details, room number, and order history — is used solely to fulfill your requests and improve your stay. We do not share your data with third parties except where required by law or for payment processing. You may request deletion of your data at any time by contacting reception.',
  },
  {
    title: 'Payment',
    body:
      'Payment for services ordered through the app is made at reception or during check-out unless otherwise stated. The hotel accepts major credit cards, cash (USD and LBP), and bank transfers for select services. All prices are quoted in USD unless specified otherwise.',
  },
  {
    title: 'Resort Rules',
    body:
      'Guests are kindly asked to respect quiet hours between 11:00 PM and 7:00 AM. Pool floats are restricted to designated pools. Pets are allowed only in specific rooms — please confirm at booking. Smoking is prohibited indoors. The hotel reserves the right to ask any guest in violation of these rules to leave the premises.',
  },
  {
    title: 'Liability',
    body:
      'Portemilio Hotel & Resort is not liable for personal belongings left unattended in public areas, the beach, or pool decks. Safe deposit boxes are available in every room and at reception. Use of resort facilities — including pools, marina, gym, and tennis courts — is at the guest\'s own risk.',
  },
  {
    title: 'Contact',
    body:
      'For any questions regarding these terms, please contact us at reservations@portemilio.com or +961 9 636 000.\n\nLast updated: April 2026.',
  },
];

export default function LegalScreen({ navigation }) {
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
          paddingBottom: 60,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Legal</Text>
        <Text style={styles.intro}>
          Terms, privacy, and policies for using the Portemilio Hotel & Resort
          app and services.
        </Text>

        {SECTIONS.map((s) => (
          <View key={s.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{s.title}</Text>
            <Text style={styles.sectionBody}>{s.body}</Text>
          </View>
        ))}

        <Text style={styles.placeholderNote}>
          * This is a placeholder. Final legal text to be reviewed and provided
          by counsel before launch.
        </Text>
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  sectionBody: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.subtle,
  },
  placeholderNote: {
    fontSize: 12,
    color: colors.muted,
    fontStyle: 'italic',
    marginTop: 12,
    lineHeight: 18,
  },
});
