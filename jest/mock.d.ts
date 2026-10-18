import type { Orientation } from 'react-native-orientation-turbo';

export * from 'react-native-orientation-turbo';

/** Simulates the device rotating; notifies onOrientationChange listeners while tracking is on */
export function __setDeviceOrientation(
  orientation: Orientation | `${Orientation}`
): void;

/** Sets what canLockOrientation() returns (e.g. false to simulate an iPad or Android large screen) */
export function __setCanLockOrientation(canLock: boolean): void;

/** Resets state, listeners and recorded calls; call it in beforeEach */
export function __reset(): void;
