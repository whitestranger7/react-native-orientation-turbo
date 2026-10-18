import {
  LandscapeDirection,
  lockToLandscape,
} from 'react-native-orientation-turbo';

import { ActionButton } from '../components/ActionButton';
import { ButtonRow } from '../components/ButtonRow';
import { Hint } from '../components/Hint';
import { Section } from '../components/Section';
import { DELAYED_LOCK_MS } from '../constants';
import type { AddLog, ModalVariant, RunAction } from '../types';

type Props = {
  run: RunAction;
  addLog: AddLog;
  onOpenModal: (variant: ModalVariant) => void;
};

export function ScenariosSection({ run, addLog, onOpenModal }: Props) {
  const lockLandscapeDelayed = () => {
    addLog(
      'action',
      `lockToLandscape(RIGHT) scheduled in ${DELAYED_LOCK_MS}ms`
    );
    setTimeout(
      () =>
        run('lockToLandscape(RIGHT) (delayed)', () =>
          lockToLandscape(LandscapeDirection.RIGHT)
        ),
      DELAYED_LOCK_MS
    );
  };

  return (
    <Section title="Scenarios">
      <Hint>
        #19: lock while a Modal is open (iPad crash report). The default RN
        Modal is portrait-only on iOS.
      </Hint>
      <ButtonRow>
        <ActionButton
          title="Open Modal (default orientations)"
          onPress={() => onOpenModal('default')}
        />
        <ActionButton
          title="Open Modal (all orientations)"
          onPress={() => onOpenModal('all')}
        />
      </ButtonRow>
      <Hint>
        Lock after a delay, like a lock fired from an effect during app startup.
      </Hint>
      <ButtonRow>
        <ActionButton
          title={`Landscape right in ${DELAYED_LOCK_MS / 1000}s`}
          onPress={lockLandscapeDelayed}
        />
      </ButtonRow>
    </Section>
  );
}
