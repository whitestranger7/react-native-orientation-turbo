import { Platform } from 'react-native';

import { Hint } from '../components/Hint';
import { LockButtons } from '../components/LockButtons';
import { Section } from '../components/Section';
import type { RunAction } from '../types';

export function LockSection({ run }: { run: RunAction }) {
  return (
    <Section title="Lock">
      <LockButtons run={run} />
      {Platform.OS === 'ios' && (
        <Hint>
          Info.plist orientations are defaults. Locks use the app delegate;
          UIKit also checks controller and device restrictions.
        </Hint>
      )}
    </Section>
  );
}
