import { TurboModuleRegistry, type TurboModule } from 'react-native';

export interface Spec extends TurboModule {
  lockToPortrait(): void;
  lockToLandscape(direction: string): void;
  unlockAllOrientations(): void;
  getCurrentOrientation(): string;
  isLocked(): boolean;
}

export default TurboModuleRegistry.getEnforcing<Spec>('OrientationTurbo');
