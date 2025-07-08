import { jest } from '@jest/globals';
import {
  lockToPortrait,
  lockToLandscape,
  unlockAllOrientations,
  getCurrentOrientation,
  isLocked,
  onLockOrientationChange,
  onOrientationChange,
  startOrientationTracking,
  stopOrientationTracking,
  LandscapeDirection,
  PortraitDirection,
  Orientation,
} from '../index';
import OrientationTurbo from '../NativeOrientationTurbo';

jest.mock('../NativeOrientationTurbo', () => ({
  __esModule: true,
  default: {
    startOrientationTracking: jest.fn(),
    stopOrientationTracking: jest.fn(),
    lockToPortrait: jest.fn(),
    lockToLandscape: jest.fn(),
    unlockAllOrientations: jest.fn(),
    getCurrentOrientation: jest.fn(),
    isLocked: jest.fn(),
    onLockOrientationChange: jest.fn(),
    onOrientationChange: jest.fn(),
  },
}));

describe('Native Module functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('orientation tracking functions', () => {
    it('should call native startOrientationTracking method', () => {
      startOrientationTracking();
      expect(OrientationTurbo.startOrientationTracking).toHaveBeenCalledTimes(
        1
      );
    });

    it('should call native stopOrientationTracking method', () => {
      stopOrientationTracking();
      expect(OrientationTurbo.stopOrientationTracking).toHaveBeenCalledTimes(1);
    });
  });

  describe('lockToPortrait functions', () => {
    it('should call native lockToPortrait method without direction', () => {
      lockToPortrait();
      expect(OrientationTurbo.lockToPortrait).toHaveBeenCalledWith(undefined);
    });

    it('should call native lockToPortrait with UP direction', () => {
      lockToPortrait(PortraitDirection.UP);
      expect(OrientationTurbo.lockToPortrait).toHaveBeenCalledWith(
        PortraitDirection.UP
      );
    });

    it('should call native lockToPortrait with UPSIDE_DOWN direction (iOS only)', () => {
      lockToPortrait(PortraitDirection.UPSIDE_DOWN);
      expect(OrientationTurbo.lockToPortrait).toHaveBeenCalledWith(
        PortraitDirection.UPSIDE_DOWN
      );
    });
  });

  describe('lockToLandscape function', () => {
    it('should call native lockToLandscape with LEFT direction', () => {
      lockToLandscape(LandscapeDirection.LEFT);
      expect(OrientationTurbo.lockToLandscape).toHaveBeenCalledWith(
        LandscapeDirection.LEFT
      );
    });

    it('should call native lockToLandscape with RIGHT direction', () => {
      lockToLandscape(LandscapeDirection.RIGHT);
      expect(OrientationTurbo.lockToLandscape).toHaveBeenCalledWith(
        LandscapeDirection.RIGHT
      );
    });
  });

  describe('unlockAllOrientations function', () => {
    it('should call native unlockAllOrientations method', () => {
      unlockAllOrientations();
      expect(OrientationTurbo.unlockAllOrientations).toHaveBeenCalledTimes(1);
    });
  });

  describe('getCurrentOrientation', () => {
    it('should return current orientation from native module', () => {
      const mockOrientation = Orientation.PORTRAIT;
      (OrientationTurbo.getCurrentOrientation as jest.Mock).mockReturnValue(
        mockOrientation
      );

      const result = getCurrentOrientation();

      expect(OrientationTurbo.getCurrentOrientation).toHaveBeenCalledTimes(1);
      expect(result).toBe(Orientation.PORTRAIT);
    });

    it('should return LANDSCAPE_LEFT orientation', () => {
      const mockOrientation = Orientation.LANDSCAPE_LEFT;
      (OrientationTurbo.getCurrentOrientation as jest.Mock).mockReturnValue(
        mockOrientation
      );

      const result = getCurrentOrientation();

      expect(result).toBe(Orientation.LANDSCAPE_LEFT);
    });

    it('should return LANDSCAPE_RIGHT orientation', () => {
      const mockOrientation = Orientation.LANDSCAPE_RIGHT;
      (OrientationTurbo.getCurrentOrientation as jest.Mock).mockReturnValue(
        mockOrientation
      );

      const result = getCurrentOrientation();

      expect(result).toBe(Orientation.LANDSCAPE_RIGHT);
    });
  });

  describe('isLocked function', () => {
    it('should return true when orientation is locked', () => {
      (OrientationTurbo.isLocked as jest.Mock).mockReturnValue(true);

      const result = isLocked();

      expect(OrientationTurbo.isLocked).toHaveBeenCalledTimes(1);
      expect(result).toBe(true);
    });

    it('should return false when orientation is not locked', () => {
      (OrientationTurbo.isLocked as jest.Mock).mockReturnValue(false);

      const result = isLocked();

      expect(result).toBe(false);
    });
  });

  describe('onOrientationChange subscription function', () => {
    it('should register orientation change listener', () => {
      const mockCallback = jest.fn();

      onOrientationChange(mockCallback);

      expect(OrientationTurbo.onOrientationChange).toHaveBeenCalledWith(
        expect.any(Function)
      );
    });

    it('should call callback with proper subscription format', () => {
      const mockCallback = jest.fn();
      const mockNativeCallback = jest.fn();

      (OrientationTurbo.onOrientationChange as jest.Mock).mockImplementation(
        (callback) => {
          mockNativeCallback.mockImplementation(callback as any);
          return { remove: jest.fn() };
        }
      );

      onOrientationChange(mockCallback);

      mockNativeCallback({ orientation: Orientation.LANDSCAPE_LEFT });

      expect(mockCallback).toHaveBeenCalledWith({
        orientation: Orientation.LANDSCAPE_LEFT,
      });
    });

    it('should handle all orientation values in callback', () => {
      const mockCallback = jest.fn();
      const mockNativeCallback = jest.fn();

      (OrientationTurbo.onOrientationChange as jest.Mock).mockImplementation(
        (callback) => {
          mockNativeCallback.mockImplementation(callback as any);
          return { remove: jest.fn() };
        }
      );

      onOrientationChange(mockCallback);

      const orientations = [
        Orientation.PORTRAIT,
        Orientation.LANDSCAPE_LEFT,
        Orientation.LANDSCAPE_RIGHT,
        Orientation.PORTRAIT_UPSIDE_DOWN,
      ];

      orientations.forEach((orientation) => {
        mockNativeCallback({ orientation });
        expect(mockCallback).toHaveBeenCalledWith({ orientation });
      });

      expect(mockCallback).toHaveBeenCalledTimes(4);
    });
  });

  describe('onLockOrientationChange subscription function', () => {
    it('should register orientation change listener', () => {
      const mockCallback = jest.fn();

      onLockOrientationChange(mockCallback);

      expect(OrientationTurbo.onLockOrientationChange).toHaveBeenCalledWith(
        expect.any(Function)
      );
    });

    it('should call callback with proper subscription format', () => {
      const mockCallback = jest.fn();
      const mockNativeCallback = jest.fn();

      (
        OrientationTurbo.onLockOrientationChange as jest.Mock
      ).mockImplementation((callback) => {
        mockNativeCallback.mockImplementation(callback as any);
        return { remove: jest.fn() };
      });

      onLockOrientationChange(mockCallback);

      mockNativeCallback({ orientation: Orientation.PORTRAIT, isLocked: true });

      expect(mockCallback).toHaveBeenCalledWith({
        orientation: Orientation.PORTRAIT,
        isLocked: true,
      });
    });
  });
});
