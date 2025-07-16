import { TurboModuleRegistry, type TurboModule } from 'react-native';
import type { EventEmitter } from 'react-native/Libraries/Types/CodegenTypes';

export interface Spec extends TurboModule {
  lockToPortrait(direction?: string): void;
  lockToLandscape(direction: string): void;
  unlockAllOrientations(): void;
  getCurrentOrientation(): string;
  isLocked(): boolean;

  startOrientationTracking(): void;
  stopOrientationTracking(): void;

  // Android only
  getDeviceAutoRotateStatus(): {
    isAutoRotateEnabled: boolean;
    canDetectOrientation: boolean;
  } | null;

  readonly onLockOrientationChange: EventEmitter<{
    orientation: string | null;
    isLocked: boolean;
  }>;

  readonly onOrientationChange: EventEmitter<{
    orientation: string;
  }>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('OrientationTurbo');
