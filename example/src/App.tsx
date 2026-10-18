import { useState } from 'react';
import {
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { LockTestModal } from './components/LockTestModal';
import { useEventLog } from './hooks/useEventLog';
import { useOrientationTester } from './hooks/useOrientationTester';
import { EventLogSection } from './sections/EventLogSection';
import { LiveStateSection } from './sections/LiveStateSection';
import { LockSection } from './sections/LockSection';
import { QueriesSection } from './sections/QueriesSection';
import { ScenariosSection } from './sections/ScenariosSection';
import { TrackingSection } from './sections/TrackingSection';
import { colors } from './theme';
import type { ModalVariant } from './types';
import { getPlatformLabel } from './utils/platform';

export default function App() {
  const { entries, addLog, clearLog } = useEventLog();
  const { state, run, refresh, startTracking, stopTracking } =
    useOrientationTester(addLog);
  const [modalVariant, setModalVariant] = useState<ModalVariant | null>(null);

  const openModal = (variant: ModalVariant) => {
    addLog('action', `open Modal (${variant} orientations)`);
    setModalVariant(variant);
  };

  const closeModal = () => {
    addLog('action', 'close Modal');
    setModalVariant(null);
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
      >
        <Text style={styles.title}>OrientationTurbo test screen</Text>
        <Text style={styles.subtitle}>{getPlatformLabel()}</Text>

        <LiveStateSection
          state={state}
          onRefresh={() => {
            addLog('action', 'refresh readouts');
            refresh();
          }}
        />
        <LockSection run={run} />
        <TrackingSection
          isTracking={state.isTracking}
          onStart={startTracking}
          onStop={stopTracking}
        />
        <QueriesSection run={run} />
        <ScenariosSection run={run} addLog={addLog} onOpenModal={openModal} />
        <EventLogSection entries={entries} onClear={clearLog} />
      </ScrollView>

      <LockTestModal
        variant={modalVariant}
        currentOrientation={state.currentOrientation}
        isLocked={state.isLocked}
        run={run}
        onClose={closeModal}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    // Android draws edge-to-edge, keep content below the status bar
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  content: {
    padding: 16,
    paddingBottom: 48,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    marginTop: 2,
    color: colors.textMuted,
  },
});
