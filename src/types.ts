import type { PlatformOSType } from 'react-native';
import type { FaceDirection, Orientation } from './constants';

export type Platforms = Extract<PlatformOSType, 'ios' | 'android'>;

export type LockOrientationSubscription = {
  orientation: Orientation | null;
  isLocked: boolean;
};

export type OrientationSubscription = {
  orientation: Orientation;
  faceDirection: FaceDirection;
  platform: Platforms;
};
