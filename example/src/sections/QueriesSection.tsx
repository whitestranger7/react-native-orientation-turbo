import {
  getCurrentOrientation,
  getDeviceAutoRotateStatus,
  isLocked,
} from 'react-native-orientation-turbo';

import { ActionButton } from '../components/ActionButton';
import { ButtonRow } from '../components/ButtonRow';
import { Section } from '../components/Section';
import type { RunAction } from '../types';
import { formatValue } from '../utils/format';

export function QueriesSection({ run }: { run: RunAction }) {
  return (
    <Section title="Queries">
      <ButtonRow>
        <ActionButton
          title="getCurrentOrientation"
          onPress={() => run('getCurrentOrientation()', getCurrentOrientation)}
        />
        <ActionButton
          title="isLocked"
          onPress={() => run('isLocked()', isLocked)}
        />
        <ActionButton
          title="getDeviceAutoRotateStatus"
          onPress={() =>
            run('getDeviceAutoRotateStatus()', () =>
              // Log null explicitly (iOS returns null)
              formatValue(getDeviceAutoRotateStatus())
            )
          }
        />
      </ButtonRow>
    </Section>
  );
}
