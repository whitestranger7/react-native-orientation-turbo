import { useWindowDimensions } from 'react-native';

import { ActionButton } from '../components/ActionButton';
import { ButtonRow } from '../components/ButtonRow';
import { Hint } from '../components/Hint';
import { Readout } from '../components/Readout';
import { Section } from '../components/Section';
import type { OrientationState } from '../hooks/useOrientationTester';
import { formatValue } from '../utils/format';

type Props = {
  state: OrientationState;
  onRefresh: () => void;
};

export function LiveStateSection({ state, onRefresh }: Props) {
  const { width, height } = useWindowDimensions();

  return (
    <Section title="Live state">
      <Readout
        label="UI orientation (sampled)"
        value={state.currentOrientation}
      />
      <Readout
        label="Last physical orientation"
        value={state.lastOrientationEvent}
      />
      <Readout
        label="Window size"
        value={`${Math.round(width)} × ${Math.round(height)}`}
      />
      <Hint>
        Physical events can differ from the UI. After rotation finishes, tap
        Refresh to sample getCurrentOrientation().
      </Hint>
      <Readout label="isLocked()" value={state.isLocked} />
      <Readout label="canLockOrientation()" value={state.canLockOrientation} />
      <Readout
        label="getDeviceAutoRotateStatus()"
        value={
          state.autoRotateStatus === undefined
            ? null
            : formatValue(state.autoRotateStatus)
        }
      />
      <Readout
        label="Last onLockOrientationChange"
        value={state.lastLockEvent ? formatValue(state.lastLockEvent) : null}
      />
      <Readout label="Tracking" value={state.isTracking ? 'on' : 'off'} />
      <ButtonRow>
        <ActionButton title="Refresh" onPress={onRefresh} />
      </ButtonRow>
    </Section>
  );
}
