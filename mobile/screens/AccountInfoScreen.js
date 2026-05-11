import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, Pressable } from 'react-native';
import { HeaderScreen, Button } from '../components/ui';
import { colors, spacing, font } from '../theme';
import { api } from '../api';
import { useAuth } from '../context';

function splitName(full = '') {
  const parts = full.trim().split(/\s+/);
  if (parts.length === 0) return ['', ''];
  if (parts.length === 1) return [parts[0], ''];
  return [parts[0], parts.slice(1).join(' ')];
}

// "YYYY-MM-DD" → "DD/MM/YYYY" for display
function formatBirthday(iso) {
  if (!iso) return '';
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return iso;
  const [, y, mo, d] = m;
  return `${d}/${mo}/${y}`;
}

export default function AccountInfoScreen({ navigation }) {
  const { user, setUser } = useAuth();
  const [first, last] = splitName(user?.name || '');
  const [firstName, setFirstName] = useState(first);
  const [lastName, setLastName] = useState(last);
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const { user: u } = await api.updateMe({
        name: `${firstName.trim()} ${lastName.trim()}`.trim(),
        phone,
      });
      setUser(u);
      Alert.alert('Saved', 'Account info updated.');
    } catch (e) { Alert.alert('Error', e.message); }
    finally { setSaving(false); }
  };

  return (
    <HeaderScreen title="Account info" navigation={navigation} keyboardShouldPersistTaps="handled">
      <Field label="First name" value={firstName} onChangeText={setFirstName} />
      <Field label="Last name" value={lastName} onChangeText={setLastName} />
      <Field label="Email" value={user?.email || ''} disabled />

      <View style={styles.passwordField}>
        <Text style={[styles.label, { color: colors.muted }]}>Password</Text>
        <View style={styles.passwordRow}>
          <Text style={styles.passwordDots}>••••••••</Text>
          <Pressable
            onPress={() => Alert.alert('Change password', 'Password change is coming soon. Contact the front desk if you need help.')}
            hitSlop={8}
          >
            <Text style={styles.changePasswordLink}>Change password</Text>
          </Pressable>
        </View>
      </View>

      <Field label="Phone number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <Field label="Birthday" value={formatBirthday(user?.birthday) || '—'} disabled />
      <Field label="Hotel room #" value={user?.room_number || '—'} disabled />
      <Field label="Chalet #" value={user?.chalet_number || '—'} disabled />

      <Button
        title={saving ? 'Saving…' : 'Save changes'}
        onPress={save}
        disabled={saving}
        style={{ marginTop: spacing.xl }}
      />

      <Text style={styles.hint}>
        Email, birthday, room and chalet are set at registration. Contact the front desk to change them.
      </Text>
    </HeaderScreen>
  );
}

function Field({ label, value, onChangeText, disabled, keyboardType }) {
  return (
    <View style={{ marginTop: spacing.lg }}>
      <Text style={[styles.label, disabled && { color: colors.muted }]}>{label}</Text>
      <TextInput
        style={[styles.input, disabled && styles.inputDisabled]}
        value={value}
        onChangeText={onChangeText}
        editable={!disabled}
        keyboardType={keyboardType}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  label: { ...font.small, marginBottom: 4 },
  input: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    paddingVertical: 10,
    fontSize: 17,
    color: colors.text,
    backgroundColor: 'transparent',
  },
  inputDisabled: { color: colors.muted },
  passwordField: {
    marginTop: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  passwordDots: {
    fontSize: 17,
    color: colors.muted,
    paddingVertical: 10,
    letterSpacing: 2,
  },
  changePasswordLink: {
    fontSize: 12,
    color: colors.accent,
    fontWeight: '600',
  },
  hint: { ...font.tiny, marginTop: spacing.md },
});
