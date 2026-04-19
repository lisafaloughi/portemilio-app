import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, ErrorText } from '../components/ui';
import { colors, spacing, radius, font } from '../theme';
import { api } from '../api';

export default function BookingScreen({ route, navigation }) {
  const { resource_type, resource_id, resource_name, preset_start, preset_end } = route.params || {};

  const defaultStart = preset_start ? toLocal(preset_start) : roundedNowPlus(2);
  const defaultEnd   = preset_end   ? toLocal(preset_end)   : addHours(defaultStart, 1);

  const [start, setStart] = useState(defaultStart);
  const [end, setEnd]     = useState(defaultEnd);
  const [party, setParty] = useState('2');
  const [notes, setNotes] = useState('');
  const [err, setErr]     = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setErr(''); setLoading(true);
    try {
      await api.createBooking({
        resource_type, resource_id, resource_name,
        start_time: toISO(start),
        end_time: toISO(end),
        party_size: Number(party) || 1,
        notes,
      });
      Alert.alert('Booking requested', 'Our team will confirm it shortly. You can track it under Bookings.');
      navigation.goBack();
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <Text style={font.h2}>Book {resource_name || resource_type}</Text>
        <Text style={{ ...font.small, marginTop: 4, marginBottom: spacing.lg }}>
          Pick your preferred time. Reception will confirm within minutes.
        </Text>

        <Text style={styles.label}>Start date & time</Text>
        <TextInput style={styles.input} value={start} onChangeText={setStart} placeholder="YYYY-MM-DD HH:MM" />

        <Text style={styles.label}>End date & time</Text>
        <TextInput style={styles.input} value={end} onChangeText={setEnd} placeholder="YYYY-MM-DD HH:MM" />

        <Text style={styles.label}>Party size</Text>
        <TextInput style={styles.input} value={party} onChangeText={setParty} keyboardType="number-pad" />

        <Text style={styles.label}>Notes (optional)</Text>
        <TextInput
          style={[styles.input, { height: 90, textAlignVertical: 'top' }]}
          value={notes} onChangeText={setNotes} multiline
          placeholder="Special requests, equipment, allergies…"
        />

        <ErrorText>{err}</ErrorText>
        <Button title={loading ? 'Sending…' : 'Confirm request'} onPress={submit} disabled={loading} style={{ marginTop: spacing.lg }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function pad(n) { return String(n).padStart(2, '0'); }
function roundedNowPlus(hours) {
  const d = new Date();
  d.setHours(d.getHours() + hours, 0, 0, 0);
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function addHours(localStr, hours) {
  const d = fromLocal(localStr); d.setHours(d.getHours() + hours);
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function fromLocal(s) {
  const [date, time] = s.split(' ');
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = (time || '00:00').split(':').map(Number);
  return new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0);
}
function toISO(localStr) {
  const d = fromLocal(localStr);
  return d.toISOString();
}
function toLocal(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const styles = StyleSheet.create({
  label: { ...font.small, marginTop: spacing.md, marginBottom: spacing.xs },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: 12, fontSize: 15, backgroundColor: '#fff',
  },
});
