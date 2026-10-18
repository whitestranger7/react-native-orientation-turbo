import { Modal, StyleSheet, Text, View } from 'react-native';
import type { Orientation } from 'react-native-orientation-turbo';

import { MODAL_ORIENTATIONS } from '../constants';
import { colors } from '../theme';
import type { ModalVariant, RunAction } from '../types';
import { ActionButton } from './ActionButton';
import { ButtonRow } from './ButtonRow';
import { Hint } from './Hint';
import { LockButtons } from './LockButtons';

type Props = {
  variant: ModalVariant | null;
  currentOrientation: Orientation | null;
  isLocked: boolean | null;
  run: RunAction;
  onClose: () => void;
};

export function LockTestModal({
  variant,
  currentOrientation,
  isLocked,
  run,
  onClose,
}: Props) {
  return (
    <Modal
      visible={variant !== null}
      animationType="slide"
      supportedOrientations={variant ? MODAL_ORIENTATIONS[variant] : undefined}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <Text style={styles.title}>
          Modal ({variant === 'all' ? 'all orientations' : 'default'})
        </Text>
        <Hint>
          Current: {currentOrientation ?? '–'} · locked: {String(isLocked)}
        </Hint>
        <LockButtons run={run} context={` (in ${variant} Modal)`} />
        <ButtonRow>
          <ActionButton title="Close Modal" onPress={onClose} />
        </ButtonRow>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: colors.surface,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
});
