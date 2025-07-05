import OrientationController from './NativeOrientationTurbo';
import { LandscapeDirection, Orientation } from './constants';

export const lockToPortrait = () => {
  OrientationController.lockToPortrait();
};

export const lockToLandscape = (direction: LandscapeDirection) => {
  OrientationController.lockToLandscape(direction as string);
};

export const unlockAllOrientations = () => {
  OrientationController.unlockAllOrientations();
};

export const getCurrentOrientation = (): Orientation => {
  return OrientationController.getCurrentOrientation() as Orientation;
};

export const isLocked = () => {
  return OrientationController.isLocked();
};

export { LandscapeDirection, Orientation };
