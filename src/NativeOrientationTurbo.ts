import {
  TurboModuleRegistry,
  type CodegenTypes,
  type TurboModule,
} from 'react-native';

export interface Spec extends TurboModule {
  lockToPortrait(direction?: string): void;
  lockToLandscape(direction: string): void;
  unlockAllOrientations(): void;
  getCurrentOrientation(): string;
  isLocked(): boolean;
  canLockOrientation(): boolean;

  startOrientationTracking(): void;
  stopOrientationTracking(): void;

  // Android only
  getDeviceAutoRotateStatus(): {
    isAutoRotateEnabled: boolean;
    canDetectOrientation: boolean;
  } | null;

  readonly onLockOrientationChange: CodegenTypes.EventEmitter<{
    orientation: string | null;
    isLocked: boolean;
  }>;

  readonly onOrientationChange: CodegenTypes.EventEmitter<{
    orientation: string;
  }>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('OrientationTurbo');
