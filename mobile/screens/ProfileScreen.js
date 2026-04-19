import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, ScrollView } from 'react-native';
import { Screen, Card, Button } from '../components/ui';
import { colors, spacing, radius, font } from '../theme';
import { api } from '../api';
import { useAuth } from '../App';

export default function ProfileScreen() {
  const { user, setUser, signOut } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [room, setRoom] = useState(user?.room_number || '');
  const [chalet, setChalet] = useState(user?.chalet_number || '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const { user: u } = await api.updateMe({
        name, phone, room_number: room, chalet_number: chalet,
      });
      setUser(u);
      Alert.alert('Saved', 'Profile updated.');
    } catch (e) { Alert.alert('Error', e.message); }
    finally { setSaving(false); }
  };

  return (
    <Screen>
      <Card>
        <View style={{ padding: spacing.md }}>
          <Text style={font.h2}>{user?.name}</Text>
          <Text style={font.small}>{user?.email}</Text>
        </View>
      </Card>

      <Text style={styles.label}>Full name</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} />

      <Text style={styles.label}>Phone</Text>
      <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

      <Text style={styles.label}>Hotel room #</Text>
      <TextInput style={styles.input} value={room} onChangeText={setRoom} />

      <Text style={styles.label}>Chalet #</Text>
      <TextInput style={styles.input} value={chalet} onChangeText={setChalet} />

      <Button title={saving ? 'Saving…' : 'Save changes'} onPress={save} disabled={saving} style={{ marginTop: spacing.lg }} />

      <Button title="Sign out" variant="danger" onPress={signOut} style={{ marginTop: spacing.md }} />
    </Screen>
  );
}
const styles = StyleSheet.create({
  label: { ...font.small, marginTop: spacing.md, marginBottom: spacing.xs },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: 12, fontSize: 15, backgroundColor: '#fff',
  },
});
