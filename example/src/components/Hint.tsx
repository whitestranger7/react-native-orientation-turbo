import type { ReactNode } from 'react';
import { StyleSheet, Text } from 'react-native';

import { colors } from '../theme';

export function Hint({ children }: { children: ReactNode }) {
  return <Text style={styles.hint}>{children}</Text>;
}

const styles = StyleSheet.create({
  hint: {
    marginVertical: 4,
    color: colors.textMuted,
  },
});
