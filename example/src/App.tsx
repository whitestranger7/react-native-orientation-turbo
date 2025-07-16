import { useState, useEffect, useRef } from 'react';
import {
  Text,
  View,
  StyleSheet,
  Button,
  type EventSubscription,
} from 'react-native';
import {
  lockToLandscape,
  lockToPortrait,
  unlockAllOrientations,
  LandscapeDirection,
  getCurrentOrientation,
  isLocked,
  onOrientationChange,
  onLockOrientationChange,
  startOrientationTracking,
  stopOrientationTracking,
  getDeviceAutoRotateStatus,
  type OrientationSubscription,
  type LockOrientationSubscription,
  type DeviceAutoRotateStatus,
} from 'react-native-orientation-turbo';

export default function App() {
  const [lockOrientation, setLockOrientation] =
    useState<LockOrientationSubscription | null>(null);
  const [orientation, setOrientation] =
    useState<OrientationSubscription | null>(null);
  const [deviceStatus, setDeviceStatus] =
    useState<DeviceAutoRotateStatus | null>(null);
  const listenerLockSubscription = useRef<EventSubscription | null>(null);
  const listenerOrientationSubscription = useRef<EventSubscription | null>(
    null
  );

  useEffect(() => {
    startOrientationTracking();
    setDeviceStatus(getDeviceAutoRotateStatus());

    listenerLockSubscription.current = onLockOrientationChange(
      (subscription) => {
        setLockOrientation(subscription);
      }
    );
    listenerOrientationSubscription.current = onOrientationChange(
      (subscription) => {
        setOrientation(subscription);
      }
    );

    return () => {
      listenerOrientationSubscription.current?.remove();
      listenerOrientationSubscription.current?.remove();
      listenerOrientationSubscription.current = null;
      listenerLockSubscription.current = null;
      stopOrientationTracking();
    };
  }, []);

  const handleCheckDeviceStatus = () => {
    const status = getDeviceAutoRotateStatus();
    setDeviceStatus(status);
    console.log('Device Auto-Rotate Status:', status);
  };

  console.log(lockOrientation);
  console.log(orientation);

  return (
    <View style={styles.container}>
      <Text>Result: WELCOME</Text>

      {deviceStatus && (
        <View style={styles.statusContainer}>
          <Text style={styles.statusTitle}>Device Status:</Text>
          <Text>
            Auto-Rotate:{' '}
            {deviceStatus.isAutoRotateEnabled ? 'Enabled' : 'Disabled'}
          </Text>
          <Text>
            Can Detect Orientation:{' '}
            {deviceStatus.canDetectOrientation ? 'Yes' : 'No'}
          </Text>
        </View>
      )}

      <View>
        <Button
          title="Check Device Auto-Rotate Status"
          onPress={handleCheckDeviceStatus}
        />
        <Button title="Lock to Portrait" onPress={() => lockToPortrait()} />
        <Button
          title="Lock to Landscape Left"
          onPress={() => lockToLandscape(LandscapeDirection.LEFT)}
        />
        <Button
          title="Lock to Landscape Right"
          onPress={() => lockToLandscape(LandscapeDirection.RIGHT)}
        />
        <Button
          title="Unlock All Orientations"
          onPress={unlockAllOrientations}
        />
        <Button
          title="Get Current Orientation"
          onPress={() => console.log(getCurrentOrientation())}
        />
        <Button title="Is Locked" onPress={() => console.log(isLocked())} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusContainer: {
    marginVertical: 20,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
  },
  statusTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
});
