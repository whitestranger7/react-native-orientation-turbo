import type { Orientation } from './constants';

export type LockOrientationSubscription = {
  orientation: Orientation;
  isLocked: boolean;
};
