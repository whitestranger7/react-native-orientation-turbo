import type { Orientation } from 'react-native-orientation-turbo';

export * from 'react-native-orientation-turbo';

type InterfaceOrientation = Exclude<
  Orientation,
  Orientation.FACE_UP | Orientation.FACE_DOWN
>;

/** Simulates physical rotation; emits events while tracking. Cardinal readings update the UI when unlocked or locks are ignored. */
export function __setDeviceOrientation(
  orientation: Orientation | `${Orientation}`
): void;

/** Sets the displayed orientation only; emits no events. Flat readings are not UI orientations. */
export function __setInterfaceOrientation(
  orientation: InterfaceOrientation | `${InterfaceOrientation}`
): void;

/** Sets lock capability; false makes subsequent lock/unlock requests leave the UI unchanged. */
export function __setCanLockOrientation(canLock: boolean): void;

/** Resets state, listeners and recorded calls; call it in beforeEach */
export function __reset(): void;
