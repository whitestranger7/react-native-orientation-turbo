'use strict';

/* global jest */

/**
 * Jest mock for react-native-orientation-turbo.
 *
 * Usage (jest.config.js):
 *   setupFiles: ['react-native-orientation-turbo/jest/setup']
 * or in a test file:
 *   jest.mock('react-native-orientation-turbo', () => require('react-native-orientation-turbo/jest/mock'));
 *
 * Every API is a jest.fn(). Requested locks, physical orientation and displayed orientation are separate.
 * The default simulation applies supported locks and unlocked cardinal rotations immediately.
 * Helpers can override the displayed orientation or simulate a system that ignores locks.
 */

const LandscapeDirection = Object.freeze({
  LEFT: 'LEFT',
  RIGHT: 'RIGHT',
});

const PortraitDirection = Object.freeze({
  UP: 'UP',
  UPSIDE_DOWN: 'UPSIDE_DOWN',
});

const Orientation = Object.freeze({
  PORTRAIT: 'PORTRAIT',
  LANDSCAPE_LEFT: 'LANDSCAPE_LEFT',
  LANDSCAPE_RIGHT: 'LANDSCAPE_RIGHT',
  PORTRAIT_UPSIDE_DOWN: 'PORTRAIT_UPSIDE_DOWN',
  FACE_UP: 'FACE_UP',
  FACE_DOWN: 'FACE_DOWN',
});

const fn = (implementation) =>
  typeof jest !== 'undefined' ? jest.fn(implementation) : implementation;

const INTERFACE_ORIENTATIONS = new Set([
  Orientation.PORTRAIT,
  Orientation.PORTRAIT_UPSIDE_DOWN,
  Orientation.LANDSCAPE_LEFT,
  Orientation.LANDSCAPE_RIGHT,
]);

const initialState = () => ({
  lockedOrientation: null,
  deviceOrientation: Orientation.PORTRAIT,
  interfaceOrientation: Orientation.PORTRAIT,
  isTracking: false,
  canLock: true,
});

let state = initialState();
const lockListeners = new Set();
const orientationListeners = new Set();

function subscribe(listeners, callback) {
  listeners.add(callback);
  return { remove: () => listeners.delete(callback) };
}

function setLock(lockedOrientation) {
  state.lockedOrientation = lockedOrientation;
  if (state.canLock) {
    const orientation = lockedOrientation ?? state.deviceOrientation;
    if (INTERFACE_ORIENTATIONS.has(orientation)) {
      state.interfaceOrientation = orientation;
    }
  }
  const event = {
    orientation: lockedOrientation,
    isLocked: lockedOrientation != null,
  };
  lockListeners.forEach((listener) => listener(event));
}

const PORTRAIT_LOCKS = {
  [PortraitDirection.UP]: Orientation.PORTRAIT,
  [PortraitDirection.UPSIDE_DOWN]: Orientation.PORTRAIT_UPSIDE_DOWN,
};

const LANDSCAPE_LOCKS = {
  [LandscapeDirection.LEFT]: Orientation.LANDSCAPE_LEFT,
  [LandscapeDirection.RIGHT]: Orientation.LANDSCAPE_RIGHT,
};

const api = {
  startOrientationTracking: fn(() => {
    state.isTracking = true;
  }),
  stopOrientationTracking: fn(() => {
    state.isTracking = false;
  }),
  // Invalid directions are ignored, like in the native code
  lockToPortrait: fn((direction) => {
    const orientation = PORTRAIT_LOCKS[direction ?? PortraitDirection.UP];
    if (INTERFACE_ORIENTATIONS.has(orientation)) {
      setLock(orientation);
    }
  }),
  lockToLandscape: fn((direction) => {
    const orientation = LANDSCAPE_LOCKS[direction];
    if (INTERFACE_ORIENTATIONS.has(orientation)) {
      setLock(orientation);
    }
  }),
  unlockAllOrientations: fn(() => setLock(null)),
  getCurrentOrientation: fn(() => state.interfaceOrientation),
  isLocked: fn(() => state.lockedOrientation != null),
  canLockOrientation: fn(() => state.canLock),
  getDeviceAutoRotateStatus: fn(() => null),
  onLockOrientationChange: fn((callback) => subscribe(lockListeners, callback)),
  onOrientationChange: fn((callback) =>
    subscribe(orientationListeners, callback)
  ),
};

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

/** Simulates the device rotating; notifies onOrientationChange listeners while tracking is on */
function __setDeviceOrientation(orientation) {
  state.deviceOrientation = orientation;
  if (
    (state.lockedOrientation == null || !state.canLock) &&
    INTERFACE_ORIENTATIONS.has(orientation)
  ) {
    state.interfaceOrientation = orientation;
  }
  if (state.isTracking) {
    orientationListeners.forEach((listener) => listener({ orientation }));
  }
}

/** Sets the displayed UI orientation without changing physical orientation, locks or events. */
function __setInterfaceOrientation(orientation) {
  if (!INTERFACE_ORIENTATIONS.has(orientation)) {
    throw new RangeError('Interface orientation must be portrait or landscape');
  }
  state.interfaceOrientation = orientation;
}

/** Sets what canLockOrientation() returns (e.g. false to simulate an iPad or Android large screen) */
function __setCanLockOrientation(canLock) {
  state.canLock = canLock;
}

/** Resets state, listeners and recorded calls; call it in beforeEach */
function __reset() {
  state = initialState();
  lockListeners.clear();
  orientationListeners.clear();
  Object.values(api).forEach((mock) => mock.mockClear?.());
}

module.exports = {
  __esModule: true,
  ...api,
  LandscapeDirection,
  PortraitDirection,
  Orientation,
  __setDeviceOrientation,
  __setInterfaceOrientation,
  __setCanLockOrientation,
  __reset,
};
