import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, ErrorText } from '../components/ui';
import { colors, spacing, radius, font } from '../theme';
import { api } from '../api';
import { useAuth } from '../App';

export default function LoginScreen({ navigation }) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email || !password) { setErr('Enter email and password.'); return; }
    setLoading(true); setErr('');
    try {
      const { token, user } = await api.login(email.trim().toLowerCase(), password);
      await signIn(token, user);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.accent }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing.xl }}>
          <Text style={styles.brand}>PORTEMILIO</Text>
          <Text style={styles.sub}>Kaslik · Lebanon</Text>

          <View style={styles.card}>
            <Text style={{ ...font.h2, marginBottom: spacing.lg }}>Welcome back</Text>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="you@email.com"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            <ErrorText>{err}</ErrorText>
            <Button title={loading ? 'Signing in…' : 'Sign in'} onPress={submit} disabled={loading} style={{ marginTop: spacing.lg }} />
            <Pressable onPress={() => navigation.navigate('Register')} style={{ marginTop: spacing.lg, alignItems: 'center' }}>
              <Text style={{ color: colors.accent, fontWeight: '600' }}>Create an account</Text>
            </Pressable>
          </View>

          <Text style={{ color: '#ffffffaa', textAlign: 'center', marginTop: spacing.lg, fontSize: 12 }}>
            Demo guest · guest@portemilio.com / guest123
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  brand: { color: '#fff', fontSize: 34, fontWeight: '800', textAlign: 'center', letterSpacing: 2 },
  sub: { color: '#ffffffbb', textAlign: 'center', marginBottom: spacing.xxl, letterSpacing: 3, fontSize: 12 },
  card: { backgroundColor: colors.surface, padding: spacing.xl, borderRadius: radius.lg },
  label: { ...font.small, marginTop: spacing.md, marginBottom: spacing.xs },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: 12, fontSize: 15, backgroundColor: '#fff',
  },
});
