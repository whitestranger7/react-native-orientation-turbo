import { Platform } from 'react-native';

import { ActionButton } from '../components/ActionButton';
import { ButtonRow } from '../components/ButtonRow';
import { Hint } from '../components/Hint';
import { Section } from '../components/Section';

type Props = {
  isTracking: boolean;
  onStart: () => void;
  onStop: () => void;
};

export function TrackingSection({ isTracking, onStart, onStop }: Props) {
  return (
    <Section title="Tracking">
      {Platform.OS === 'android' && (
        <Hint>
          Hold the new orientation steady for 200 ms. Leaving its zone or a
          flat/unknown reading restarts the wait.
        </Hint>
      )}
      <ButtonRow>
        <ActionButton
          title="Start tracking"
          onPress={onStart}
          disabled={isTracking}
        />
        <ActionButton
          title="Stop tracking"
          onPress={onStop}
          disabled={!isTracking}
        />
      </ButtonRow>
    </Section>
  );
}
