import React, { useEffect, useState } from 'react';
import { View, Text, Linking } from 'react-native';
import { Screen, Card, Button, Loading } from '../components/ui';
import { colors, spacing, font } from '../theme';
import { api } from '../api';

const KEYS = [
  ['welcome_message',  'Welcome'],
  ['address',          'Address'],
  ['front_desk_phone', 'Front desk'],
  ['emergency_phone',  'Emergency'],
  ['wifi_name',        'Wi-Fi network'],
  ['wifi_password',    'Wi-Fi password'],
];

export default function InfoScreen() {
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const results = await Promise.all(KEYS.map(([k]) => api.setting(k).catch(() => ({ value: '' }))));
      const obj = {};
      KEYS.forEach(([k], i) => obj[k] = results[i].value);
      setValues(obj); setLoading(false);
    })();
  }, []);

  if (loading) return <Screen><Loading /></Screen>;

  return (
    <Screen>
      <Card>
        <View style={{ padding: spacing.md }}>
          <Text style={font.h2}>Portemilio Resort</Text>
          <Text style={{ ...font.small, marginTop: 2 }}>Kaslik · Lebanon</Text>
          {KEYS.map(([k, label]) => values[k] ? (
            <View key={k} style={{ marginTop: spacing.md }}>
              <Text style={{ ...font.small, color: colors.muted }}>{label}</Text>
              <Text
                style={{ ...font.body, color: (k.includes('phone') ? colors.accent : colors.text), marginTop: 2 }}
                onPress={k.includes('phone') ? () => Linking.openURL(`tel:${values[k]}`) : undefined}
              >
                {values[k]}
              </Text>
            </View>
          ) : null)}
        </View>
      </Card>
    </Screen>
  );
}
