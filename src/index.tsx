import OrientationTurbo from './NativeOrientationTurbo';
import { LandscapeDirection, Orientation } from './constants';
import type { LockOrientationSubscription } from './types';

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
    callback as (arg: { orientation: string; isLocked: boolean }) => void
  );
};

export { LandscapeDirection, Orientation, type LockOrientationSubscription };
