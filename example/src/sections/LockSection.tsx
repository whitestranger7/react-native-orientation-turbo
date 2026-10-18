import { LockButtons } from '../components/LockButtons';
import { Section } from '../components/Section';
import type { RunAction } from '../types';

export function LockSection({ run }: { run: RunAction }) {
  return (
    <Section title="Lock">
      <LockButtons run={run} />
    </Section>
  );
}
