import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, ErrorText } from '../components/ui';
import { colors, spacing, radius, font } from '../theme';
import { api } from '../api';
import { useAuth } from '../App';

export default function RegisterScreen() {
  const { signIn } = useAuth();
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', room_number: '', chalet_number: '',
  });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const set = (k) => (v) => setForm(prev => ({ ...prev, [k]: v }));

  const submit = async () => {
    if (!form.name || !form.email || !form.password) {
      setErr('Name, email, and password are required.'); return;
    }
    setLoading(true); setErr('');
    try {
      const { token, user } = await api.register({ ...form, email: form.email.trim().toLowerCase() });
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

        <Text style={styles.label}>Full name *</Text>
        <TextInput style={styles.input} value={form.name} onChangeText={set('name')} />

        <Text style={styles.label}>Email *</Text>
        <TextInput style={styles.input} autoCapitalize="none" keyboardType="email-address" value={form.email} onChangeText={set('email')} />

        <Text style={styles.label}>Password *</Text>
        <TextInput style={styles.input} secureTextEntry value={form.password} onChangeText={set('password')} />

        <Text style={styles.label}>Phone</Text>
        <TextInput style={styles.input} keyboardType="phone-pad" value={form.phone} onChangeText={set('phone')} />

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
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: 12, fontSize: 15, backgroundColor: '#fff',
  },
});
