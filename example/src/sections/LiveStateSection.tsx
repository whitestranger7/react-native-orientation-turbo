import { ActionButton } from '../components/ActionButton';
import { ButtonRow } from '../components/ButtonRow';
import { Readout } from '../components/Readout';
import { Section } from '../components/Section';
import type { OrientationState } from '../hooks/useOrientationTester';
import { formatValue } from '../utils/format';

type Props = {
  state: OrientationState;
  onRefresh: () => void;
};

export function LiveStateSection({ state, onRefresh }: Props) {
  return (
    <Section title="Live state">
      <Readout
        label="getCurrentOrientation()"
        value={state.currentOrientation}
      />
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
        label="Last onOrientationChange"
        value={state.lastOrientationEvent}
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
