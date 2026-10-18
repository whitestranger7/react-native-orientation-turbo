import type { ModalOrientation, ModalVariant } from './types';

export const MAX_LOG_ENTRIES = 200;

// Orientation changes are applied asynchronously by the OS
export const REFRESH_DELAY_MS = 500;

export const DELAYED_LOCK_MS = 1000;

export const MODAL_ORIENTATIONS: Record<
  ModalVariant,
  ModalOrientation[] | undefined
> = {
  // RN Modal default: portrait only on iOS
  default: undefined,
  all: [
    'portrait',
    'portrait-upside-down',
    'landscape-left',
    'landscape-right',
  ],
};
