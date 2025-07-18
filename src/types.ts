import type { Orientation } from './constants';

export type LockOrientationSubscription = {
  orientation: Orientation | null;
  isLocked: boolean;
};

export type OrientationSubscription = {
  orientation: Orientation;
};

export type DeviceAutoRotateStatus = {
  isAutoRotateEnabled: boolean;
  canDetectOrientation: boolean;
};
