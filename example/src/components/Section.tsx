import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme';

type Props = {
  title: string;
  children: ReactNode;
};

export function Section({ title, children }: Props) {
  return (
    <View style={styles.section}>
      <Text style={styles.title}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  title: {
    marginBottom: 8,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
});
