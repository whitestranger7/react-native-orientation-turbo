import { Navigation } from './navigation/Navigation';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useEffect, useRef, useState } from 'react';
import {
  onLockOrientationChange,
  onOrientationChange,
  startOrientationTracking,
  stopOrientationTracking,
  type LockOrientationSubscription,
  type OrientationSubscription,
} from 'react-native-orientation-turbo';
import type { EventSubscription } from 'react-native';

export const App = () => {
  const [lockOrientation, setLockOrientation] =
    useState<LockOrientationSubscription | null>(null);
  const [orientation, setOrientation] =
    useState<OrientationSubscription | null>(null);
  const listenerLockSubscription = useRef<EventSubscription | null>(null);
  const listenerOrientationSubscription = useRef<EventSubscription | null>(
    null
  );

  useEffect(() => {
    startOrientationTracking();
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

  console.log(lockOrientation);
  console.log(orientation);

  return (
    <GestureHandlerRootView>
      <SafeAreaProvider>
        <Navigation />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};
