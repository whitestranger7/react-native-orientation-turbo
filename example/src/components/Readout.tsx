import { StyleSheet, Text, View } from 'react-native';

import { colors, monospaceFont } from '../theme';

type Props = {
  label: string;
  value: string | boolean | null;
};

export function Readout({ label, value }: Props) {
  return (
    <View style={styles.readout}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value === null ? '–' : String(value)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  readout: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 3,
  },
  label: {
    color: colors.textMuted,
    fontFamily: monospaceFont,
    fontSize: 12,
  },
  value: {
    flexShrink: 1,
    color: colors.text,
    fontWeight: '600',
    textAlign: 'right',
  },
});
