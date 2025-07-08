import { jest } from '@jest/globals';
import { TurboModuleRegistry } from 'react-native';

jest.mock('react-native', () => ({
  TurboModuleRegistry: {
    getEnforcing: jest.fn(),
  },
}));

describe('Native Module should be bound to the TurboModuleRegistry', () => {
  it('should properly initialize the native module', () => {
    const mockModule = {
      lockToPortrait: jest.fn(),
      lockToLandscape: jest.fn(),
      unlockAllOrientations: jest.fn(),
      getCurrentOrientation: jest.fn(),
      isLocked: jest.fn(),
      onLockOrientationChange: jest.fn(),
      startOrientationTracking: jest.fn(),
      stopOrientationTracking: jest.fn(),
      onOrientationChange: jest.fn(),
    };

    (TurboModuleRegistry.getEnforcing as jest.Mock).mockReturnValue(mockModule);

    const OrientationTurbo = require('../NativeOrientationTurbo').default;

    expect(TurboModuleRegistry.getEnforcing).toHaveBeenCalledWith(
      'OrientationTurbo'
    );
    expect(OrientationTurbo).toBe(mockModule);
  });

  it('should have all required methods in the native module interface', () => {
    const mockModule = {
      lockToPortrait: jest.fn(),
      lockToLandscape: jest.fn(),
      unlockAllOrientations: jest.fn(),
      getCurrentOrientation: jest.fn(),
      isLocked: jest.fn(),
      onLockOrientationChange: jest.fn(),
      startOrientationTracking: jest.fn(),
      stopOrientationTracking: jest.fn(),
      onOrientationChange: jest.fn(),
    };

    (TurboModuleRegistry.getEnforcing as jest.Mock).mockReturnValue(mockModule);

    const OrientationTurbo = require('../NativeOrientationTurbo').default;

    expect(typeof OrientationTurbo.lockToPortrait).toBe('function');
    expect(typeof OrientationTurbo.lockToLandscape).toBe('function');
    expect(typeof OrientationTurbo.unlockAllOrientations).toBe('function');
    expect(typeof OrientationTurbo.getCurrentOrientation).toBe('function');
    expect(typeof OrientationTurbo.isLocked).toBe('function');
    expect(typeof OrientationTurbo.onLockOrientationChange).toBe('function');
    expect(typeof OrientationTurbo.startOrientationTracking).toBe('function');
    expect(typeof OrientationTurbo.stopOrientationTracking).toBe('function');
    expect(typeof OrientationTurbo.onOrientationChange).toBe('function');
  });
});
