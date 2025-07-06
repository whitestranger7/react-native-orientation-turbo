import OrientationTurbo from './NativeOrientationTurbo';
import { LandscapeDirection, Orientation } from './constants';
import type { OrientationSubscription } from './types';

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

export const onOrientationChange = (
  callback: (subscription: OrientationSubscription) => void
) => {
  return OrientationTurbo.onOrientationChange(
    callback as (arg: { orientation: string; isLocked: boolean }) => void
  );
};

export { LandscapeDirection, Orientation, type OrientationSubscription };
