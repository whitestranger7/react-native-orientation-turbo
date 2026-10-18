import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getCurrentOrientation,
  getDeviceAutoRotateStatus,
  isLocked,
  onLockOrientationChange,
  onOrientationChange,
  startOrientationTracking,
  stopOrientationTracking,
  type DeviceAutoRotateStatus,
  type LockOrientationSubscription,
  type Orientation,
} from 'react-native-orientation-turbo';

import { REFRESH_DELAY_MS } from '../constants';
import type { AddLog, RunAction } from '../types';
import { formatValue } from '../utils/format';

export type OrientationState = {
  currentOrientation: Orientation | null;
  isLocked: boolean | null;
  // undefined = not read yet, null = not available on this platform (iOS)
  autoRotateStatus: DeviceAutoRotateStatus | null | undefined;
  lastOrientationEvent: Orientation | null;
  lastLockEvent: LockOrientationSubscription | null;
  isTracking: boolean;
};

// Subscribes to the library events and keeps the live state up to date
export function useOrientationTester(addLog: AddLog) {
  const [currentOrientation, setCurrentOrientation] =
    useState<Orientation | null>(null);
  const [locked, setLocked] = useState<boolean | null>(null);
  const [autoRotateStatus, setAutoRotateStatus] = useState<
    DeviceAutoRotateStatus | null | undefined
  >(undefined);
  const [lastOrientationEvent, setLastOrientationEvent] =
    useState<Orientation | null>(null);
  const [lastLockEvent, setLastLockEvent] =
    useState<LockOrientationSubscription | null>(null);
  const [isTracking, setIsTracking] = useState(false);

  const refreshTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(() => {
    try {
      setCurrentOrientation(getCurrentOrientation());
      setLocked(isLocked());
      setAutoRotateStatus(getDeviceAutoRotateStatus());
    } catch (error) {
      addLog('error', `refresh failed: ${String(error)}`);
    }
  }, [addLog]);

  const scheduleRefresh = useCallback(() => {
    if (refreshTimeout.current) {
      clearTimeout(refreshTimeout.current);
    }
    refreshTimeout.current = setTimeout(refresh, REFRESH_DELAY_MS);
  }, [refresh]);

  const run = useCallback<RunAction>(
    (label, call) => {
      addLog('action', label);
      try {
        const result = call();
        if (result !== undefined) {
          addLog('result', `${label} → ${formatValue(result)}`);
        }
      } catch (error) {
        addLog('error', `${label} threw: ${String(error)}`);
      }
      refresh();
      scheduleRefresh();
    },
    [addLog, refresh, scheduleRefresh]
  );

  const startTracking = useCallback(() => {
    run('startOrientationTracking()', startOrientationTracking);
    setIsTracking(true);
  }, [run]);

  const stopTracking = useCallback(() => {
    run('stopOrientationTracking()', stopOrientationTracking);
    setIsTracking(false);
  }, [run]);

  useEffect(() => {
    const orientationSubscription = onOrientationChange(({ orientation }) => {
      setLastOrientationEvent(orientation);
      addLog('event', `onOrientationChange: ${orientation}`);
      scheduleRefresh();
    });
    const lockSubscription = onLockOrientationChange((event) => {
      setLastLockEvent(event);
      addLog(
        'event',
        `onLockOrientationChange: isLocked=${event.isLocked}, orientation=${event.orientation}`
      );
      scheduleRefresh();
    });

    startOrientationTracking();
    setIsTracking(true);
    addLog('action', 'startOrientationTracking() (on mount)');
    refresh();

    return () => {
      orientationSubscription.remove();
      lockSubscription.remove();
      stopOrientationTracking();
      if (refreshTimeout.current) {
        clearTimeout(refreshTimeout.current);
      }
    };
  }, [addLog, refresh, scheduleRefresh]);

  const state: OrientationState = {
    currentOrientation,
    isLocked: locked,
    autoRotateStatus,
    lastOrientationEvent,
    lastLockEvent,
    isTracking,
  };

  return { state, run, refresh, startTracking, stopTracking };
}
