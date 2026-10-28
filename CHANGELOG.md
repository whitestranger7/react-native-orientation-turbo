# Changelog

All notable changes to this project will be documented in this file.

## [3.0.0-rc.0] - 2026-10-28

Release candidate for 3.0.0, published under the npm `next` tag: `npm install react-native-orientation-turbo@next`.
Upgrading from 2.x: read the [migration guide](https://github.com/whitestranger7/react-native-orientation-turbo/blob/v3/docs/MIGRATION.md#migrating-from-2x-to-30).

### Breaking Changes
- **Minimum React Native version is now 0.80**; tested versions are 0.80 – 0.88 (2.x declared any version). The New Architecture remains required.
- **`LANDSCAPE_LEFT` / `LANDSCAPE_RIGHT` in `onOrientationChange` are swapped compared to 2.x**, on both platforms. They now match the locks: `LANDSCAPE_LEFT` = bottom edge (home indicator / navigation bar) on the left. Remove any 2.x workaround that swapped them back.
- **JavaScript `getCurrentOrientation()` now returns the displayed interface orientation** on both platforms; on Android it used to return the requested lock. Android native callers can use `getCurrentOrientation(activity)`; the no-argument overload keeps its previous behaviour.
- **Invalid directions are ignored** with a warning, instead of falling back to LEFT (Android) / RIGHT (iOS).
#### iOS
- The undocumented `OrientationTurboShared` class is removed; `OrientationTurbo.shared` works as before.
- The undocumented iOS 15 `OrientationSupportDidChange` / `ForceOrientationChange` notifications are no longer posted.
- `OrientationTurboPublicProtocol` has a new requirement, `getSupportedInterfaceOrientations(for:)`. Only relevant if you conform to it yourself, for example in test mocks.
#### Android
- `android/gradle.properties` and its `OrientationTurbo_*` overrides are removed. Your app's `rootProject.ext` values still apply.
- The `Orientation` enum has a new `PORTRAIT_UPSIDE_DOWN` value; an exhaustive Kotlin `when` needs a branch for it.
- The public `com.orientationturbo.constants.AngleRanges` object is removed.

### Added
- **`canLockOrientation()`**: detects known platform restrictions on orientation locking, including resizable iPad apps (without `UIRequiresFullScreen`) and Android 16+ large screens for apps targeting API 36+, accounting for the applicable exemptions (games, and the API 36 opt-out property).
- **Automatic setup**: `npx react-native-orientation-turbo setup [--lock …] [--dry-run]` edits AppDelegate / SceneDelegate / MainActivity. It upgrades a 2.x callback, ignores commented-out code, and prints manual steps when your project doesn't look like the template.
- **Jest mock**: `react-native-orientation-turbo/jest/setup`, with helpers to simulate rotation, the displayed orientation and devices that ignore locks.
- **SceneDelegate apps** (React Native 0.88 template) and iOS 27 SDK builds are supported. AppDelegate-only apps built with the iOS 27 SDK or newer must adopt UIScene before running on iOS 27 or newer; the setup command does not perform that migration. See the [scene migration guide](https://github.com/whitestranger7/react-native-orientation-turbo/blob/v3/docs/IOS_SCENES.md).
#### iOS
- `getSupportedInterfaceOrientations(for: window)`: pass the AppDelegate callback's window so a `<Modal>` only suspends the lock in its own window. The no-argument version is deprecated in Swift.
- Typed `lockToPortrait(_: PortraitDirection)` / `lockToLandscape(_: LandscapeDirection)`; the string versions are deprecated in Swift.
#### Android
- `lockToPortrait(activity, PortraitDirection)`, `getCurrentOrientation(activity)` (what the screen shows) and `canLockOrientation(activity)`.

### Fixed
- **iOS: no crash when a `<Modal>` can't show the locked orientation** (`UIApplicationInvalidInterfaceOrientation`). The lock is suspended while the modal is shown and re-applied when it closes.
- **iOS: no crash when locking on iPad** ([#19](https://github.com/whitestranger7/react-native-orientation-turbo/issues/19)).
- **Android: orientation events no longer flicker** on small tilts or shaking ([#20](https://github.com/whitestranger7/react-native-orientation-turbo/issues/20)). A new orientation is reported after readings stay in it for about 200 ms.
- Locks from native code (`OrientationTurbo.lockTo…`) now emit `onLockOrientationChange`, on both platforms.
#### iOS
- Locks apply in call order and the state is thread-safe; a lock or unlock is no longer one step late.
- The first lock inside a `<Modal>` applies right away.
- The first `getCurrentOrientation()` after a landscape launch returns the displayed orientation, even with tracking stopped.
- Locks apply to every foreground window scene, and the orientation is read from the active one.
- Portrait upside-down on iPhones without a Home button is ignored with a warning instead of silently failing.
#### Android
- Portrait upside-down is locked and reported (`PORTRAIT_UPSIDE_DOWN`; 2.x locked and reported `PORTRAIT`).
- Tablets with a landscape natural orientation, and apps in split screen or a resized window, report correct orientations.
- Locks requested from JS and native code apply in request order, and each lock event describes its own request.
- A lock or unlock requested before the Activity exists is applied once it's available, and again after the Activity is recreated, without overriding orientation changes made by other code.
- Tracking pauses in the background, stops when React Native reloads, and the manifest orientation is read once an Activity exists.

### Known limitations
- `onOrientationChange` reports the **physical device** orientation. It can fire before or after the screen rotates and can differ from the UI under a lock or with auto-rotate off. The UI-synchronization part of #20 isn't implemented; an interface-orientation event is planned for 3.x.
- iOS installation is CocoaPods only; Swift Package Manager is planned for 3.x.

### Technical Improvements
- Built and tested against React Native 0.88 (AGP 9, Gradle 9, Kotlin 2.2, compileSdk 37), with a consumer test matrix for RN 0.80, 0.82, 0.84 and 0.88: Xcode 16.4 / 26.6 / 27.1, static and dynamic frameworks, and AGP 9 defaults.
- Verified 16 KB ELF and APK alignment in the example release build.
- Native unit tests for Android (JUnit) and iOS (XCTest).

## [2.2.0] - 2025-07-28

### Added
#### Android
- **Shared State Architecture**: New `OrientationState.kt` package-private singleton for unified state management across native and React Native contexts
- **Static Status Methods**: Added status checking methods available in static context:
  - `getCurrentOrientation()` - Get current orientation as String
  - `isLocked()` - Check if orientation is currently locked
  - `getLockedOrientation()` - Get the locked orientation as Orientation enum
  - `getDeviceOrientation()` - Get physical device orientation as Orientation enum
- **Perfect State Synchronization**: Immediate consistency between native and React Native contexts without manual synchronization
- **Thread-Safe Operations**: All orientation state operations are now thread-safe and can be called from any context

### Fixed
#### Android
- **Wrong Landscape Direction For Manifest Sync**: After `2.1.2` fix, manifest was still returning wrong landscape type. It's fixed now
- **State Persistence**: Orientation state now properly persists across Activity lifecycle events and React Native reloads
- **Memory Leaks**: Eliminated potential memory leaks in state management by using singleton pattern

### Breaking Changes
#### iOS
- **Public Protocol Changes**: `OrientationTurboImpl.shared` changed to `OrientationTurbo.shared` for native integration
  ```swift
  // Before
  OrientationTurboImpl.shared.lockToPortrait()
  
  // After  
  OrientationTurbo.shared.lockToPortrait()
  ```

### Technical Improvements
#### iOS
- **Codebase Refactoring**: Complete iOS architecture redesign with improved separation of concerns
- **Protocol-Based API**: New `OrientationTurboPublicProtocol` for clean native integration interface
- **Memory Management**: Enhanced memory management and lifecycle handling

#### Android
- **Shared State Pattern**: Replaced multiple state holders with single `OrientationState.kt` source of truth
- **Simplified Architecture**: Eliminated complex synchronization logic by using unified state management
- **Package-Private State**: `OrientationState` is internal to `com.orientationturbo` package ensuring proper encapsulation
- **Eliminated State Duplication**: Removed redundant state properties from `OrientationManager` and other components
- **Simplified OrientationSync**: Removed unnecessary state clearing and intermediate data classes

### Documentation
#### Major Updates
- **Native Usage Guide**: Comprehensive `docs/NATIVE_USAGE.md` rewrite with new Android shared state architecture
- **Updated Code Examples**: All Android examples updated to show Activity context requirements and new status methods
- **Architecture Diagrams**: New architectural flow diagrams showing shared state pattern
- **Migration Instructions**: Clear migration path for breaking changes with before/after code examples

#### Content Improvements
- **Integration Patterns**: Advanced integration patterns showing real-time orientation monitoring
- **Thread Safety**: Documentation of thread-safe operations and context requirements

#### API Documentation
- **Method Signatures**: Updated all Android method signatures with Activity context requirements
- **Status Methods**: Complete documentation of new Android status checking capabilities
- **Import Statements**: Updated import examples with required enum imports

### Example Application
- **Version Bump**: All dependencies updated to latest versions
- **Demo Updates**: Example app updated to demonstrate new status methods and shared state features

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
