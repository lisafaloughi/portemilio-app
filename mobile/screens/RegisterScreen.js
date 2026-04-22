import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, ErrorText } from '../components/ui';
import { colors, spacing, radius, font } from '../theme';
import { api } from '../api';
import { useAuth } from '../App';

// "DD/MM/YYYY" → "YYYY-MM-DD", returns '' if invalid
function parseBirthday(s) {
  const m = (s || '').trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return '';
  const [, d, mo, y] = m;
  const day = parseInt(d, 10), month = parseInt(mo, 10), year = parseInt(y, 10);
  if (month < 1 || month > 12 || day < 1 || day > 31) return '';
  if (year < 1900 || year > new Date().getFullYear()) return '';
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export default function RegisterScreen() {
  const { signIn } = useAuth();
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '', password: '',
    room_number: '', chalet_number: '', birthday: '',
  });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const set = (k) => (v) => setForm(prev => ({ ...prev, [k]: v }));

  const submit = async () => {
    if (!form.first_name || !form.last_name || !form.email || !form.password) {
      setErr('First name, last name, email, and password are required.'); return;
    }
    let birthdayIso = '';
    if (form.birthday) {
      birthdayIso = parseBirthday(form.birthday);
      if (!birthdayIso) { setErr('Birthday must be DD/MM/YYYY.'); return; }
    }
    setLoading(true); setErr('');
    try {
      const payload = {
        name: `${form.first_name.trim()} ${form.last_name.trim()}`,
        email: form.email.trim().toLowerCase(),
        phone: form.phone, password: form.password,
        room_number: form.room_number, chalet_number: form.chalet_number,
        birthday: birthdayIso || undefined,
      };
      const { token, user } = await api.register(payload);
      await signIn(token, user);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <Text style={{ ...font.h2, marginBottom: spacing.sm }}>Create your account</Text>
        <Text style={{ ...font.small, marginBottom: spacing.lg }}>
          Fill in your room or chalet number so we can deliver to you directly.
        </Text>

        <Text style={styles.label}>First name *</Text>
        <TextInput style={styles.input} value={form.first_name} onChangeText={set('first_name')} />

        <Text style={styles.label}>Last name *</Text>
        <TextInput style={styles.input} value={form.last_name} onChangeText={set('last_name')} />

        <Text style={styles.label}>Email *</Text>
        <TextInput style={styles.input} autoCapitalize="none" keyboardType="email-address" value={form.email} onChangeText={set('email')} />

        <Text style={styles.label}>Password *</Text>
        <TextInput style={styles.input} secureTextEntry value={form.password} onChangeText={set('password')} />

        <Text style={styles.label}>Phone</Text>
        <TextInput style={styles.input} keyboardType="phone-pad" value={form.phone} onChangeText={set('phone')} />

        <Text style={styles.label}>Birthday</Text>
        <TextInput
          style={styles.input}
          placeholder="DD/MM/YYYY"
          placeholderTextColor={colors.muted}
          keyboardType="numbers-and-punctuation"
          value={form.birthday}
          onChangeText={set('birthday')}
        />
        <Text style={styles.hint}>Used to celebrate your big day — can't be changed later.</Text>

        <Text style={styles.label}>Hotel Room #</Text>
        <TextInput style={styles.input} value={form.room_number} onChangeText={set('room_number')} />

        <Text style={styles.label}>Chalet #</Text>
        <TextInput style={styles.input} value={form.chalet_number} onChangeText={set('chalet_number')} />

        <ErrorText>{err}</ErrorText>
        <Button title={loading ? 'Creating…' : 'Create account'} onPress={submit} disabled={loading} style={{ marginTop: spacing.lg }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  label: { ...font.small, marginTop: spacing.md, marginBottom: spacing.xs },
  input: {
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: 12, fontSize: 15, backgroundColor: '#fff',
  },
  hint: { ...font.tiny, marginTop: 4 },
});
