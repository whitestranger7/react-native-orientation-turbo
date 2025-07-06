import { TurboModuleRegistry, type TurboModule } from 'react-native';
import type { EventEmitter } from 'react-native/Libraries/Types/CodegenTypes';

export interface Spec extends TurboModule {
  lockToPortrait(): void;
  lockToLandscape(direction: string): void;
  unlockAllOrientations(): void;
  getCurrentOrientation(): string;
  isLocked(): boolean;
  readonly onOrientationChange: EventEmitter<{
    orientation: string;
    isLocked: boolean;
  }>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('OrientationTurbo');
