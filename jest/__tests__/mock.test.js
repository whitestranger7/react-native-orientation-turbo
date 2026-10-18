jest.mock('../../src/NativeOrientationTurbo', () => ({
  __esModule: true,
  default: {},
}));

const realApi = require('../../src/index');
const mock = require('../mock');

const HELPERS = [
  '__setDeviceOrientation',
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
    mock.__setCanLockOrientation(false);
    expect(mock.canLockOrientation()).toBe(false);
  });

  it('records calls and clears them on reset', () => {
    mock.lockToLandscape(mock.LandscapeDirection.RIGHT);
    expect(mock.lockToLandscape).toHaveBeenCalledWith('RIGHT');

    mock.__reset();
    expect(mock.lockToLandscape).not.toHaveBeenCalled();
    expect(mock.isLocked()).toBe(false);
  });
});
