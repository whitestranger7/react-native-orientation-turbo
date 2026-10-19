jest.mock('../../src/NativeOrientationTurbo', () => ({
  __esModule: true,
  default: {},
}));

const realApi = require('../../src/index');
const mock = require('../mock');

const HELPERS = [
  '__setDeviceOrientation',
  '__setInterfaceOrientation',
  '__setCanLockOrientation',
  '__reset',
];

describe('jest mock matches the library API', () => {
  it('exports exactly the runtime exports of the library, plus the test helpers', () => {
    const libraryExports = Object.keys(realApi)
      .filter((key) => key !== '__esModule')
      .sort();
    const mockExports = Object.keys(mock)
      .filter((key) => key !== '__esModule' && !HELPERS.includes(key))
      .sort();
    expect(mockExports).toEqual(libraryExports);
  });

  it('uses the same enum values as the library', () => {
    expect(mock.Orientation).toEqual({ ...realApi.Orientation });
    expect(mock.LandscapeDirection).toEqual({ ...realApi.LandscapeDirection });
    expect(mock.PortraitDirection).toEqual({ ...realApi.PortraitDirection });
  });

  it('exposes every API function as a jest.fn()', () => {
    for (const key of Object.keys(realApi)) {
      if (typeof realApi[key] === 'function') {
        expect(jest.isMockFunction(mock[key])).toBe(true);
      }
    }
  });
});

describe('jest mock behaviour', () => {
  beforeEach(() => mock.__reset());

  it('starts unlocked in portrait', () => {
    expect(mock.isLocked()).toBe(false);
    expect(mock.getCurrentOrientation()).toBe('PORTRAIT');
    expect(mock.canLockOrientation()).toBe(true);
    expect(mock.getDeviceAutoRotateStatus()).toBeNull();
  });

  it('locks, notifies lock listeners and unlocks', () => {
    const listener = jest.fn();
    mock.onLockOrientationChange(listener);

    mock.lockToLandscape(mock.LandscapeDirection.LEFT);
    expect(mock.isLocked()).toBe(true);
    expect(mock.getCurrentOrientation()).toBe('LANDSCAPE_LEFT');
    expect(listener).toHaveBeenLastCalledWith({
      orientation: 'LANDSCAPE_LEFT',
      isLocked: true,
    });

    mock.lockToPortrait(mock.PortraitDirection.UPSIDE_DOWN);
    expect(mock.getCurrentOrientation()).toBe('PORTRAIT_UPSIDE_DOWN');

    mock.unlockAllOrientations();
    expect(mock.isLocked()).toBe(false);
    expect(listener).toHaveBeenLastCalledWith({
      orientation: null,
      isLocked: false,
    });
    expect(listener).toHaveBeenCalledTimes(3);
  });

  it('ignores invalid directions like the native code', () => {
    const listener = jest.fn();
    mock.onLockOrientationChange(listener);

    mock.lockToLandscape('UP');
    mock.lockToPortrait('SIDEWAYS');

    expect(mock.isLocked()).toBe(false);
    expect(listener).not.toHaveBeenCalled();
  });

  it('simulates device rotation only while tracking', () => {
    const listener = jest.fn();
    const subscription = mock.onOrientationChange(listener);

    mock.__setDeviceOrientation('LANDSCAPE_RIGHT');
    expect(listener).not.toHaveBeenCalled();
    expect(mock.getCurrentOrientation()).toBe('LANDSCAPE_RIGHT');

    mock.startOrientationTracking();
    mock.__setDeviceOrientation('PORTRAIT');
    expect(listener).toHaveBeenCalledWith({ orientation: 'PORTRAIT' });

    subscription.remove();
    mock.__setDeviceOrientation('LANDSCAPE_LEFT');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('can simulate devices that ignore locks', () => {
    const listener = jest.fn();
    mock.onLockOrientationChange(listener);
    mock.__setCanLockOrientation(false);
    expect(mock.canLockOrientation()).toBe(false);
    mock.lockToLandscape(mock.LandscapeDirection.LEFT);

    expect(mock.isLocked()).toBe(true);
    expect(mock.getCurrentOrientation()).toBe('PORTRAIT');
    expect(listener).toHaveBeenLastCalledWith({
      orientation: 'LANDSCAPE_LEFT',
      isLocked: true,
    });
    mock.__setDeviceOrientation('LANDSCAPE_RIGHT');
    expect(mock.getCurrentOrientation()).toBe('LANDSCAPE_RIGHT');
    mock.unlockAllOrientations();
    expect(mock.isLocked()).toBe(false);
    expect(mock.getCurrentOrientation()).toBe('LANDSCAPE_RIGHT');
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('reports physical rotation while a supported lock keeps the UI fixed', () => {
    const listener = jest.fn();
    mock.onOrientationChange(listener);
    mock.lockToPortrait();
    mock.startOrientationTracking();
    mock.__setDeviceOrientation('LANDSCAPE_LEFT');

    expect(listener).toHaveBeenLastCalledWith({
      orientation: 'LANDSCAPE_LEFT',
    });
    expect(mock.getCurrentOrientation()).toBe('PORTRAIT');
    mock.unlockAllOrientations();
    expect(mock.getCurrentOrientation()).toBe('LANDSCAPE_LEFT');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('keeps flat readings out of the displayed orientation, including on unlock', () => {
    const listener = jest.fn();
    mock.onOrientationChange(listener);
    mock.startOrientationTracking();
    mock.__setDeviceOrientation('LANDSCAPE_RIGHT');
    mock.__setDeviceOrientation('FACE_UP');
    expect(mock.getCurrentOrientation()).toBe('LANDSCAPE_RIGHT');
    mock.lockToPortrait();
    mock.__setDeviceOrientation('FACE_DOWN');
    mock.unlockAllOrientations();

    expect(mock.getCurrentOrientation()).toBe('PORTRAIT');
    expect(listener.mock.calls.map(([event]) => event.orientation)).toEqual([
      'LANDSCAPE_RIGHT',
      'FACE_UP',
      'FACE_DOWN',
    ]);
  });

  it('changes the displayed orientation independently without physical or lock events', () => {
    const orientationListener = jest.fn();
    const lockListener = jest.fn();
    mock.onOrientationChange(orientationListener);
    mock.onLockOrientationChange(lockListener);
    mock.__setDeviceOrientation('LANDSCAPE_RIGHT');
    mock.startOrientationTracking();
    mock.lockToLandscape(mock.LandscapeDirection.LEFT);
    lockListener.mockClear();
    mock.__setInterfaceOrientation('PORTRAIT');

    expect(mock.getCurrentOrientation()).toBe('PORTRAIT');
    expect(mock.isLocked()).toBe(true);
    expect(orientationListener).not.toHaveBeenCalled();
    expect(lockListener).not.toHaveBeenCalled();
    mock.unlockAllOrientations();
    expect(mock.getCurrentOrientation()).toBe('LANDSCAPE_RIGHT');
  });

  it('does not replace explicit UI state with a physical reading when locks are ignored', () => {
    mock.__setCanLockOrientation(false);
    mock.__setDeviceOrientation('PORTRAIT');
    mock.__setInterfaceOrientation('LANDSCAPE_RIGHT');
    mock.lockToPortrait();
    expect(mock.getCurrentOrientation()).toBe('LANDSCAPE_RIGHT');
    mock.unlockAllOrientations();
    expect(mock.getCurrentOrientation()).toBe('LANDSCAPE_RIGHT');
  });

  it.each(['FACE_UP', 'FACE_DOWN', 'UNKNOWN', null])(
    'rejects invalid UI orientation %s without changing state',
    (orientation) => {
      mock.__setInterfaceOrientation('LANDSCAPE_LEFT');
      expect(() => mock.__setInterfaceOrientation(orientation)).toThrow(
        RangeError
      );
      expect(mock.getCurrentOrientation()).toBe('LANDSCAPE_LEFT');
    }
  );

  it('changes capability without retroactively rotating the UI or emitting lock events', () => {
    const listener = jest.fn();
    mock.onLockOrientationChange(listener);
    mock.__setCanLockOrientation(false);
    mock.lockToLandscape(mock.LandscapeDirection.LEFT);
    mock.__setCanLockOrientation(true);

    expect(mock.getCurrentOrientation()).toBe('PORTRAIT');
    expect(mock.isLocked()).toBe(true);
    expect(listener).toHaveBeenCalledTimes(1);
    mock.lockToLandscape(mock.LandscapeDirection.LEFT);
    expect(mock.getCurrentOrientation()).toBe('LANDSCAPE_LEFT');
  });

  it('keeps default lock event delivery synchronous and emits no physical rotation event for a lock', () => {
    const orientationListener = jest.fn();
    const lockListener = jest.fn(() => {
      expect(mock.isLocked()).toBe(true);
      expect(mock.getCurrentOrientation()).toBe('LANDSCAPE_LEFT');
    });
    mock.startOrientationTracking();
    mock.onOrientationChange(orientationListener);
    mock.onLockOrientationChange(lockListener);
    mock.lockToLandscape(mock.LandscapeDirection.LEFT);

    expect(lockListener).toHaveBeenCalledTimes(1);
    expect(orientationListener).not.toHaveBeenCalled();
  });

  it('ignores inherited object properties as invalid lock directions', () => {
    const listener = jest.fn();
    mock.onLockOrientationChange(listener);
    for (const direction of ['constructor', 'toString', '__proto__']) {
      mock.lockToPortrait(direction);
      mock.lockToLandscape(direction);
    }
    expect(mock.isLocked()).toBe(false);
    expect(mock.getCurrentOrientation()).toBe('PORTRAIT');
    expect(listener).not.toHaveBeenCalled();
  });

  it('records calls and clears them on reset', () => {
    const listener = jest.fn();
    mock.onOrientationChange(listener);
    mock.onLockOrientationChange(listener);
    mock.__setDeviceOrientation('LANDSCAPE_LEFT');
    mock.__setInterfaceOrientation('LANDSCAPE_RIGHT');
    mock.__setCanLockOrientation(false);
    mock.startOrientationTracking();
    mock.lockToLandscape(mock.LandscapeDirection.RIGHT);
    expect(mock.lockToLandscape).toHaveBeenCalledWith('RIGHT');

    mock.__reset();
    expect(mock.lockToLandscape).not.toHaveBeenCalled();
    expect(mock.isLocked()).toBe(false);
    expect(mock.getCurrentOrientation()).toBe('PORTRAIT');
    expect(mock.canLockOrientation()).toBe(true);
    listener.mockClear();
    mock.__setDeviceOrientation('LANDSCAPE_RIGHT');
    mock.lockToPortrait();
    mock.unlockAllOrientations();
    expect(listener).not.toHaveBeenCalled();
    expect(mock.getCurrentOrientation()).toBe('LANDSCAPE_RIGHT');
  });
});
