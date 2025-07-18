# Changelog

All notable changes to this project will be documented in this file.

## [2.1.2] - 2025-07-18

### Fixed
#### Android
- **Landscape reverse issue**: `LANDSCAPE_RIGHT` & `LANDSCAPE_LEFT` now no longer locks in reverse

### Added
#### Android
- **Device Auto-Rotate Status**: `getDeviceAutoRotateStatus()` method to check device auto-rotate settings and orientation detection capabilities
- **DeviceAutoRotateStatus Type**: New TypeScript type for auto-rotate status information

### Documentation
- **iOS Auto-Rotate Limitations Guide**: New `docs/IOS_AUTO_ROTATE_LIMITATIONS.md` explaining iOS platform restrictions for auto-rotate detection and providing alternative approaches
- **API documentation improved**: Typescript annotations were added to API functions

### Technical
- **Android codebase improvements**: Codebase for Android was redesigned and improved

## [2.1.1] - 2025-07-11

### Added
#### iOS
- **FACE_UP & FACE_DOWN orientation support**: `FACE_UP` and `FACE_DOWN` support. Enum `Orientation` type was updated

## [2.1.0] - 2025-07-10

### Added
#### Early Orientation Locking
- **Pre-React Native Orientation Control**: Lock orientation before React Native loads (before bootsplash screen)
- **iOS Early Locking**: `OrientationTurboImpl.shared.lockToPortrait()` and `OrientationTurboImpl.shared.lockToLandscape()` methods for AppDelegate integration
- **Android Early Locking**: `OrientationTurbo.lockToPortrait()` and `OrientationTurbo.lockToLandscape()` static methods for MainActivity integration
- **State Synchronization**: Automatic sync between early native orientation locks and JavaScript context on library initialization

#### Android
- **Native Static Class**: `OrientationTurbo` singleton class with static methods for early orientation control
- **OrientationSync Utility**: `OrientationSync.kt` utility class for state management and synchronization
- **AndroidManifest.xml Sync**: Automatic synchronization with `android:screenOrientation` manifest settings on initialization
- **State Persistence**: Shared state management between early native locks and OrientationTurboModule

### Fixes
#### iOS
- **unlockAllOrientations functionality fix**: Redundant dispatch was removed and execution order corrected
- **getLockCurrentOrientation fix**: Function now properly returns locked orientation state vs device orientation
- **null state for onLockOrientationChange**: `onLockOrientationChange` `orientation` now returns null for iOS when orientation is not locked

### Docs
- **Advanced Usage Guide**: Comprehensive `docs/ADVANCED_USAGE.md` with early locking examples, state synchronization, and integration patterns
- **README.md Enhanced**: Added advanced features section with early locking examples and AndroidManifest.xml sync information
- **Documentation Structure**: Organized documentation with clear separation between basic and advanced usage

## [2.0.0] - 2025-07-07

### Added
- **Physical Device Orientation Tracking**: `startOrientationTracking()` and `stopOrientationTracking()` - Control native sensor tracking for device orientation changes
- **Enhanced Orientation Subscription**: Physical device orientation changes now detected via native sensors when tracking is enabled
- **IOS UPSIDE_DOWN orientation support**: Portrait enum now have `UPSIDE_DOWN` that's can be detected only by iOS devices
- **Battery Optimization**: Orientation tracking can be started/stopped as needed to conserve battery and device resources

### Fixed
- **iOS Lock Functionality**: Resolved orientation locking issues on iOS platform for improved reliability

### Changed
- **Orientation Lock Subscription**: now runs with `onLockOrientationChange`. `onOrientationChange` now tracking device orientation
- **Orientation Change Detection**: `onOrientationChange` now added and requires `startOrientationTracking()` to be called first for physical device rotation detection
- **Performance Improvements**: More efficient orientation change handling with optional sensor tracking

#### Documentation
- README.md updated with iOS setup instructions including AppDelegate.swift configuration
- Added `startOrientationTracking()` and `stopOrientationTracking()` API documentation
- Added `onLockOrientationChange` API documentation
- Changed `onOrientationChange` API documentation
- Types and Enums documentation is enhanced 
- Enhanced setup guide with detailed iOS integration steps

## [1.0.0] - 2025-07-06

### Added
- **Orientation Change Subscription**: `onOrientationChange(callback: { callback: (subscription: LockOrientationSubscription) => void })` - Subscribe to real-time orientation changes

#### Documentation
- README.md updated with new `onOrientationChange(callback)`
- `/example` is updated to demonstrate `onOrientationChange(callback)` usage

## [0.1.0] - 2025-07-05

### Initial Release

#### Features

##### Core Orientation Control
- **Lock to Portrait**: `lockToPortrait()` - Lock device to portrait orientation
- **Lock to Landscape**: `lockToLandscape(direction)` - Lock to landscape left or right
- **Unlock All Orientations**: `unlockAllOrientations()` - Allow free rotation
- **Get Current Orientation**: `getCurrentOrientation()` - Retrieve current device orientation
- **Check Lock Status**: `isLocked()` - Determine if orientation is currently locked

##### TypeScript Support
- **Full TypeScript definitions** with complete type safety
- **Enum exports**: `LandscapeDirection` and `Orientation` enums
- **Type-safe API** with proper return types and parameter validation

##### Platform Support
- **iOS 11.0+** - Native implementation using iOS orientation APIs
- **Android API 21+** - Native implementation using Android orientation APIs
- **Turbo Module Architecture** - Built with React Native's New Architecture

#### Technical Specifications

##### Architecture Requirements
- **React Native 0.70+** required
- **New Architecture (Turbo Modules)** - No legacy bridge support

##### Package Contents
- Native iOS implementation (Objective-C/Swift)
- Native Android implementation (Kotlin)
- TypeScript definitions
- Complete documentation with examples

#### Installation & Setup

```bash
npm install react-native-orientation-turbo
# or
yarn add react-native-orientation-turbo
```

**New Architecture Setup Required:**
- iOS: Enable New Architecture in Podfile
- Android: Set `newArchEnabled=true` in gradle.properties

#### API Overview

```typescript
import {
  lockToPortrait,
  lockToLandscape,
  unlockAllOrientations,
  getCurrentOrientation,
  isLocked,
  LandscapeDirection,
  Orientation,
} from 'react-native-orientation-turbo';

// Lock orientations
lockToPortrait();
lockToLandscape(LandscapeDirection.LEFT);
lockToLandscape(LandscapeDirection.RIGHT);

// Unlock
unlockAllOrientations();

// Check status
const orientation = getCurrentOrientation(); // 'PORTRAIT' | 'LANDSCAPE_LEFT' | 'LANDSCAPE_RIGHT'
const locked = isLocked(); // boolean
```

#### Documentation

- Complete README with setup instructions
- API reference with all methods documented
- Real-world usage examples
- New Architecture enablement guide
- Platform-specific setup instructions

#### Important Notes

- **New Architecture Only**: This library requires Turbo Modules enabled
- **No Legacy Bridge Support**: Not compatible with old React Native architecture
