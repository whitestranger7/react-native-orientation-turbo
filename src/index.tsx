import OrientationTurbo from './NativeOrientationTurbo';
import { LandscapeDirection, Orientation } from './constants';

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

export { LandscapeDirection, Orientation };
