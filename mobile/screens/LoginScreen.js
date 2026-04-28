import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Image,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, ErrorText } from '../components/ui';
import { colors, spacing, radius, font } from '../theme';
import { api } from '../api';
import { useAuth } from '../App';

const SPLASH_BG = '#E8E1CB';
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const { signIn, signInAsGuest } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const logoTranslate = useRef(new Animated.Value(SCREEN_HEIGHT * 0.25)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const formTranslate = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(logoTranslate, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(formOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(formTranslate, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [logoTranslate, formOpacity, formTranslate]);

  const submit = async () => {
    if (!email || !password) {
      setErr('Enter email and password.');
      return;
    }
    setLoading(true);
    setErr('');
    try {
      const { token, user } = await api.login(email.trim().toLowerCase(), password);
      await signIn(token, user);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: SPLASH_BG }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.container}>
          <Animated.View
            style={[
              styles.logoWrap,
              { transform: [{ translateY: logoTranslate }] },
            ]}
          >
            <Image
              source={require('../assets/splash.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </Animated.View>

          <Animated.View
            style={[
              styles.formWrap,
              {
                opacity: formOpacity,
                transform: [{ translateY: formTranslate }],
              },
            ]}
          >
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="you@email.com"
              placeholderTextColor={colors.muted}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={colors.muted}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            <ErrorText>{err}</ErrorText>
            <Button
              title={loading ? 'Signing in…' : 'Sign in'}
              onPress={submit}
              disabled={loading}
              style={{ marginTop: spacing.lg }}
            />
            <Pressable
              onPress={() => navigation.navigate('Register')}
              style={{ marginTop: spacing.md, alignItems: 'center' }}
            >
              <Text style={styles.linkText}>Create an account</Text>
            </Pressable>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <Pressable onPress={signInAsGuest} style={styles.guestBtn}>
              <Text style={styles.guestBtnText}>Continue as guest</Text>
            </Pressable>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: 0,
    marginTop: -20,

  },
  logo: {
    width: 420,
    height: 350,
  },
  formWrap: {
    marginTop: -30,
  },
  label: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.subtle,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  input: {
    borderBottomWidth: 0.75,
    borderBottomColor: colors.muted,
    paddingHorizontal: 0,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: 'transparent',
    color: colors.text,
  },
  linkText: {
    color: colors.accent,
    fontWeight: '600',
    fontSize: 14,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  dividerText: {
    marginHorizontal: spacing.md,
    color: colors.muted,
    fontSize: 14,
    letterSpacing: 1,
  },
  guestBtn: {
    paddingVertical: 14,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.accent,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  guestBtnText: {
    color: colors.accent,
    fontWeight: '600',
    fontSize: 15,
  },
});
