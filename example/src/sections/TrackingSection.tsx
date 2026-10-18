import { ActionButton } from '../components/ActionButton';
import { ButtonRow } from '../components/ButtonRow';
import { Section } from '../components/Section';

type Props = {
  isTracking: boolean;
  onStart: () => void;
  onStop: () => void;
};

export function TrackingSection({ isTracking, onStart, onStop }: Props) {
  return (
    <Section title="Tracking">
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
