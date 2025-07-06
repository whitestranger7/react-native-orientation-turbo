import type { Orientation } from './constants';

export type OrientationSubscription = {
  orientation: Orientation;
  isLocked: boolean;
};
