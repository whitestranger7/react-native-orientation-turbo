import OrientationTurbo from './NativeOrientationTurbo';
import {
  LandscapeDirection,
  PortraitDirection,
  Orientation,
} from './constants';
import type {
  LockOrientationSubscription,
  OrientationSubscription,
  DeviceAutoRotateStatus,
} from './types';

/**
 * Starts orientation tracking
 * @platform iOS and Android
 */
export const startOrientationTracking = () => {
  OrientationTurbo.startOrientationTracking();
};

/**
 * Stops orientation tracking
 * @platform iOS and Android
 */
export const stopOrientationTracking = () => {
  OrientationTurbo.stopOrientationTracking();
};

/**
 * Locks to portrait
 * On iOS, `UPSIDE_DOWN` on iPhones without a Home button is ignored (no state change, no event).
 * Info.plist orientations are defaults; the required app delegate callback supplies the runtime mask.
 * Accepted requests update state immediately; UIKit applies rotation asynchronously, subject to controller/system restrictions.
 * @platform iOS and Android
 */
export const lockToPortrait = (direction?: PortraitDirection) => {
  OrientationTurbo.lockToPortrait(direction as string);
};

/**
 * Locks to landscape
 * Records the request immediately; UIKit applies rotation asynchronously, subject to controller/system restrictions.
 * @platform iOS and Android
 */
export const lockToLandscape = (direction: LandscapeDirection) => {
  OrientationTurbo.lockToLandscape(direction as string);
};

/**
 * Unlocks all orientations
 * @platform iOS and Android
 */
export const unlockAllOrientations = () => {
  OrientationTurbo.unlockAllOrientations();
};

/**
 * Gets current orientation
 * @platform iOS and Android
 * @returns Orientation
 */
export const getCurrentOrientation = (): Orientation => {
  return OrientationTurbo.getCurrentOrientation() as Orientation;
};

/**
 * Checks if orientation is locked
 * @platform iOS and Android
 * @returns boolean
 */
export const isLocked = () => {
  return OrientationTurbo.isLocked();
};

/**
 * Checks whether the OS will apply orientation locks for this app
 * Returns false where the system ignores locks: on iPad when the app supports resizing
 * (no `UIRequiresFullScreen` in Info.plist), and on Android 16+ large screens
 * (smallest width >= 600dp) for apps targeting API 36+
 * @platform iOS and Android
 * @returns boolean
 */
export const canLockOrientation = () => {
  return OrientationTurbo.canLockOrientation();
};

/**
 * Gets device auto-rotate status
 * @platform Android only
 * @returns DeviceAutoRotateStatus on Android, null on iOS
 */
export const getDeviceAutoRotateStatus = (): DeviceAutoRotateStatus | null => {
  return OrientationTurbo.getDeviceAutoRotateStatus();
};

/**
 * Subscribes to lock orientation change
 * @platform iOS and Android
 * @returns EventSubscription
 */
export const onLockOrientationChange = (
  callback: (subscription: LockOrientationSubscription) => void
) => {
  return OrientationTurbo.onLockOrientationChange(
    callback as (arg: { orientation: string | null; isLocked: boolean }) => void
  );
};

/**
 * Subscribes to orientation change
 * @platform iOS and Android
 * @returns EventSubscription
 */
export const onOrientationChange = (
  callback: (subscription: OrientationSubscription) => void
) => {
  return OrientationTurbo.onOrientationChange(
    callback as (arg: { orientation: string }) => void
  );
};

export {
  LandscapeDirection,
  PortraitDirection,
  Orientation,
  type LockOrientationSubscription,
  type OrientationSubscription,
  type DeviceAutoRotateStatus,
};
