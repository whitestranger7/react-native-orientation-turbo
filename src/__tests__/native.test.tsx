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
      onOrientationChange: jest.fn(),
    };

    (TurboModuleRegistry.getEnforcing as jest.Mock).mockReturnValue(mockModule);

    const OrientationTurbo = require('../NativeOrientationTurbo').default;

    expect(TurboModuleRegistry.getEnforcing).toHaveBeenCalledWith(
      'OrientationTurbo'
    );
    expect(OrientationTurbo).toBe(mockModule);
  });
});
