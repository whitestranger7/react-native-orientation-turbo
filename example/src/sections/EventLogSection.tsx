import { StyleSheet, Text } from 'react-native';

import { ActionButton } from '../components/ActionButton';
import { ButtonRow } from '../components/ButtonRow';
import { Hint } from '../components/Hint';
import { Section } from '../components/Section';
import { logColors, monospaceFont } from '../theme';
import type { LogEntry } from '../types';

type Props = {
  entries: LogEntry[];
  onClear: () => void;
};

export function EventLogSection({ entries, onClear }: Props) {
  return (
    <Section title={`Event log (${entries.length})`}>
      <ButtonRow>
        <ActionButton title="Clear log" onPress={onClear} />
      </ButtonRow>
      {entries.length === 0 ? (
        <Hint>No entries yet.</Hint>
      ) : (
        entries.map((entry) => (
          <Text
            key={entry.id}
            style={[styles.line, { color: logColors[entry.kind] }]}
          >
            {entry.time} {entry.kind.padEnd(6)} {entry.text}
          </Text>
        ))
      )}
    </Section>
  );
}

const styles = StyleSheet.create({
  line: {
    fontFamily: monospaceFont,
    fontSize: 11,
    paddingVertical: 1,
  },
});
