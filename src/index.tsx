import OrientationTurbo from './NativeOrientationTurbo';
import { LandscapeDirection, Orientation } from './constants';
import type {
  LockOrientationSubscription,
  OrientationSubscription,
} from './types';

export const startOrientationTracking = () => {
  OrientationTurbo.startOrientationTracking();
};

export const stopOrientationTracking = () => {
  OrientationTurbo.stopOrientationTracking();
};

export const lockToPortrait = () => {
  OrientationTurbo.lockToPortrait();
};

export const lockToLandscape = (direction: LandscapeDirection) => {
  OrientationTurbo.lockToLandscape(direction as string);
};

export const unlockAllOrientations = () => {
  OrientationTurbo.unlockAllOrientations();
};

export const getCurrentOrientation = (): Orientation => {
  return OrientationTurbo.getCurrentOrientation() as Orientation;
};

export const isLocked = () => {
  return OrientationTurbo.isLocked();
};

export const onLockOrientationChange = (
  callback: (subscription: LockOrientationSubscription) => void
) => {
  return OrientationTurbo.onLockOrientationChange(
    callback as (arg: { orientation: string | null; isLocked: boolean }) => void
  );
};

export const onOrientationChange = (
  callback: (subscription: OrientationSubscription) => void
) => {
  return OrientationTurbo.onOrientationChange(
    callback as (arg: { orientation: string }) => void
  );
};

export {
  LandscapeDirection,
  Orientation,
  type LockOrientationSubscription,
  type OrientationSubscription,
};
