import React, { useLayoutEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Image,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, ErrorText } from '../components/ui';
import { colors, spacing, radius } from '../theme';
import { api } from '../api';
import { useAuth } from '../context';

const SPLASH_BG = '#E8E1CB';

// "DD/MM/YYYY" → "YYYY-MM-DD", returns '' if invalid
function parseBirthday(s) {
  const m = (s || '').trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return '';
  const [, d, mo, y] = m;
  const day = parseInt(d, 10),
    month = parseInt(mo, 10),
    year = parseInt(y, 10);
  if (month < 1 || month > 12 || day < 1 || day > 31) return '';
  if (year < 1900 || year > new Date().getFullYear()) return '';
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export default function RegisterScreen({ navigation }) {
  const { signIn } = useAuth();
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
    unit_type: 'room', // 'room' | 'chalet'
    unit_number: '',
    birthday: '',
  });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingMessage, setPendingMessage] = useState('');
  const set = (k) => (v) => setForm((prev) => ({ ...prev, [k]: v }));

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const submit = async () => {
    if (!form.first_name || !form.last_name || !form.email || !form.password) {
      setErr('First name, last name, email, and password are required.');
      return;
    }
    if (form.password !== form.confirm_password) {
      setErr('Passwords do not match.');
      return;
    }
    let birthdayIso = '';
    if (form.birthday) {
      birthdayIso = parseBirthday(form.birthday);
      if (!birthdayIso) {
        setErr('Birthday must be DD/MM/YYYY.');
        return;
      }
    }
    setLoading(true);
    setErr('');
    try {
      const payload = {
        name: `${form.first_name.trim()} ${form.last_name.trim()}`,
        email: form.email.trim().toLowerCase(),
        phone: form.phone,
        password: form.password,
        room_number: form.unit_type === 'room' ? form.unit_number : '',
        chalet_number: form.unit_type === 'chalet' ? form.unit_number : '',
        birthday: birthdayIso || undefined,
      };
      const result = await api.register(payload);
      if (result?.pending) {
        setPendingMessage(
          result.message ||
            'Your account is awaiting verification by reception. You will be able to sign in once approved.'
        );
        return;
      }
      await signIn(result.token, result.user);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: SPLASH_BG }}>
      <Modal
        transparent
        animationType="fade"
        visible={!!pendingMessage}
        onRequestClose={() => {
          setPendingMessage('');
          navigation.goBack();
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.pendingCard}>
            <MaterialCommunityIcons
              name="email-check-outline"
              size={42}
              color={colors.accent}
              style={{ marginBottom: 12 }}
            />
            <Text style={styles.pendingTitle}>Account submitted</Text>
            <Text style={styles.pendingBody}>{pendingMessage}</Text>
            <Pressable
              style={styles.pendingBtn}
              onPress={() => {
                setPendingMessage('');
                navigation.goBack();
              }}
            >
              <Text style={styles.pendingBtnText}>Back to sign in</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={10}
        >
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
        </Pressable>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoWrap}>
            <Image
              source={require('../assets/splash.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.title}>Create account</Text>
       

          <View style={styles.formRow}>
            <View style={styles.col}>
              <Text style={styles.label}>First name *</Text>
              <TextInput
                style={styles.input}
                value={form.first_name}
                onChangeText={set('first_name')}
              />
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Last name *</Text>
              <TextInput
                style={styles.input}
                value={form.last_name}
                onChangeText={set('last_name')}
              />
            </View>
          </View>

          <Text style={styles.label}>Email *</Text>
          <TextInput
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@email.com"
            placeholderTextColor={colors.muted}
            value={form.email}
            onChangeText={set('email')}
          />

          <Text style={styles.label}>Password *</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor={colors.muted}
            secureTextEntry
            value={form.password}
            onChangeText={set('password')}
          />

          <Text style={styles.label}>Confirm password *</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor={colors.muted}
            secureTextEntry
            value={form.confirm_password}
            onChangeText={set('confirm_password')}
          />

          <Text style={styles.label}>Phone</Text>
          <TextInput
            style={styles.input}
            keyboardType="phone-pad"
            placeholder="+961 ..."
            placeholderTextColor={colors.muted}
            value={form.phone}
            onChangeText={set('phone')}
          />

          <Text style={styles.label}>Birthday</Text>
          <TextInput
            style={styles.input}
            placeholder="DD/MM/YYYY"
            placeholderTextColor={colors.muted}
            keyboardType="numbers-and-punctuation"
            value={form.birthday}
            onChangeText={set('birthday')}
          />
          <Text style={styles.hint}>
            Used to celebrate your big day — can't be changed later.
          </Text>

          <Text style={styles.label}>Where are you staying?</Text>
          <View style={styles.unitToggle}>
            <Pressable
              style={[
                styles.unitPill,
                form.unit_type === 'room' && styles.unitPillActive,
              ]}
              onPress={() => set('unit_type')('room')}
            >
              <Text
                style={[
                  styles.unitPillText,
                  form.unit_type === 'room' && styles.unitPillTextActive,
                ]}
              >
                Hotel room
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.unitPill,
                form.unit_type === 'chalet' && styles.unitPillActive,
              ]}
              onPress={() => set('unit_type')('chalet')}
            >
              <Text
                style={[
                  styles.unitPillText,
                  form.unit_type === 'chalet' && styles.unitPillTextActive,
                ]}
              >
                Chalet
              </Text>
            </Pressable>
          </View>

          <Text style={styles.label}>
            {form.unit_type === 'room' ? 'Room number' : 'Chalet number'}
          </Text>
          <TextInput
            style={[styles.input, styles.inputShort]}
            autoCapitalize="characters"
            maxLength={6}
            value={form.unit_number}
            onChangeText={set('unit_number')}
          />

          <ErrorText>{err}</ErrorText>
          <Button
            title={loading ? 'Creating…' : 'Create account'}
            onPress={submit}
            disabled={loading}
            style={{ marginTop: spacing.lg, borderRadius: radius.md }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  backBtn: {
    position: 'absolute',
    top: 12,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SPLASH_BG,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingTop: 8,
    paddingBottom: 60,
  },
  logoWrap: {
    alignItems: 'center',
    marginTop: -50,
    marginBottom: -65,
  },
  logo: {
    width: 420,
    height: 320,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.accent,
    marginTop: 0,
    marginBottom: 10,
  },
  intro: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.subtle,
    marginTop: 4,
    marginBottom: 8,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  col: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.subtle,
    marginTop: spacing.md,
    marginBottom: 2,
  },
  input: {
    borderBottomWidth: 0.75,
    borderBottomColor: colors.muted,
    paddingHorizontal: 0,
    paddingVertical: 10,
    fontSize: 17,
    backgroundColor: 'transparent',
    color: colors.text,
  },
  inputShort: {
    width: 110,
    textAlign: 'center',
    alignSelf: 'flex-start',
  },
  hint: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 6,
  },
  unitToggle: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  unitPill: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.muted,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  unitPillActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  unitPillText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  unitPillTextActive: {
    color: '#fff',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  pendingCard: {
    backgroundColor: SPLASH_BG,
    borderRadius: 18,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
  },
  pendingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.accent,
    marginBottom: 10,
    textAlign: 'center',
  },
  pendingBody: {
    fontSize: 15,
    lineHeight: 21,
    color: colors.subtle,
    textAlign: 'center',
    marginBottom: 22,
  },
  pendingBtn: {
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
  },
  pendingBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
});
