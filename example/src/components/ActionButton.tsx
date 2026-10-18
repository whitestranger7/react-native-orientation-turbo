import { Pressable, StyleSheet, Text } from 'react-native';

import { colors } from '../theme';

type Props = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
};

export function ActionButton({ title, onPress, disabled = false }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Text style={styles.text}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  pressed: {
    backgroundColor: colors.primaryPressed,
  },
  disabled: {
    backgroundColor: colors.disabled,
  },
  text: {
    color: colors.onPrimary,
    fontWeight: '600',
  },
});
