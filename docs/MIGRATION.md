# Migration Guide

- [2.x → 3.0](#migrating-from-2x-to-30)
- [2.1.x → 2.2.0](#migrating-from-21x-to-220)

## Migrating from 2.x to 3.0

3.0 modernizes the toolchain and fixes how orientations are named, reported and locked. Most apps only need the [Requirements](#requirements) and [Behaviour changes](#behaviour-changes) sections. If you call the library from native code, also read [Native API changes](#native-api-changes).

### Quick checklist

- [ ] Your app runs React Native **0.80 or newer** with the **New Architecture**.
- [ ] Code that branches on `LANDSCAPE_LEFT` / `LANDSCAPE_RIGHT` from `onOrientationChange` is checked against the [new meaning](#landscape_left--landscape_right-are-swapped-in-orientation-events).
- [ ] Android: `OrientationTurbo_*` entries are removed from `gradle.properties`.
- [ ] Android: exhaustive Kotlin `when` over `Orientation` handles `PORTRAIT_UPSIDE_DOWN`.
- [ ] iPad apps that need locks set `UIRequiresFullScreen` ([iPad](../README.md#ipad)).
- [ ] Clean rebuild: `cd ios && pod install`, `cd android && ./gradlew clean`.

### Requirements

| | 2.x | 3.0 |
|---|---|---|
| React Native | any (`*`) | **0.80 – 0.88** |
| Architecture | New Architecture | New Architecture (unchanged; the legacy bridge was never supported) |
| iOS | 15.1+ | 15.1+ |
| Android | API 24+ | API 24+ |
| iOS installation | CocoaPods | CocoaPods (Swift Package Manager is planned for a later 3.x release) |

On React Native 0.80 and 0.81, don't turn the New Architecture off (`newArchEnabled=false` / `RCT_NEW_ARCH_ENABLED=0`).

### Behaviour changes

#### `LANDSCAPE_LEFT` / `LANDSCAPE_RIGHT` are swapped in orientation events

3.0 uses one definition on both platforms, for locks and events alike:

- **`LANDSCAPE_LEFT`**: the bottom edge of the device (home indicator / navigation bar) is on the **left**, i.e. the device is turned 90° clockwise from portrait.
- **`LANDSCAPE_RIGHT`**: the bottom edge is on the **right**, i.e. the device is turned 90° counter-clockwise.

Locks already worked this way in 2.x (`lockToLandscape(LandscapeDirection.LEFT)` puts the bottom edge on the left). The events from `onOrientationChange` did not: they reported the opposite value on both platforms. 3.0 reports the same value as the matching lock.

If your app relied on the old event values (for example, swapping them back by hand), remove that workaround:

```tsx
// 2.x workaround: no longer needed
const actual =
  orientation === Orientation.LANDSCAPE_LEFT
    ? Orientation.LANDSCAPE_RIGHT
    : Orientation.LANDSCAPE_LEFT;
```

Android tablets whose natural orientation is landscape now report every orientation correctly; 2.x mapped their angles as if they were phones.

#### `getCurrentOrientation()` returns what the screen shows

On both platforms it returns the orientation of the UI. In 2.x on Android it returned the requested lock, even when the system hadn't applied it (or never would).

#### Invalid directions are ignored

`lockToLandscape('UP')` or `lockToPortrait('SIDEWAYS')` no longer lock to a fallback (LEFT on Android, RIGHT on iOS). The call does nothing and logs a warning. With TypeScript and the `LandscapeDirection` / `PortraitDirection` enums this can't happen.

#### Android: portrait upside-down works

- `lockToPortrait(PortraitDirection.UPSIDE_DOWN)` now locks upside-down (2.x locked to normal portrait).
- `onOrientationChange` and `getCurrentOrientation()` report `PORTRAIT_UPSIDE_DOWN` (2.x reported `PORTRAIT`).

Upside-down still depends on the device: iPhones without a Home button never rotate upside-down, and some Android phones don't either.

#### Android: orientation events are debounced

`onOrientationChange` fires about 200 ms after the device settles in a new orientation, instead of on every sensor reading near a boundary ([#20](https://github.com/whitestranger7/react-native-orientation-turbo/issues/20)). Small tilts and shaking no longer emit events.

#### Locks made from native code emit `onLockOrientationChange`

`OrientationTurbo.lockTo…` calls from Kotlin/Swift made after React Native started now notify JS listeners, on both platforms.

#### iOS: locks to unsupported orientations are ignored

If the target orientation isn't in your Info.plist `UISupportedInterfaceOrientations` (or the device can't show it, such as upside-down on iPhones without a Home button), the lock is ignored with a warning. In 2.x it could crash with `UIApplicationInvalidInterfaceOrientation`.

#### iOS: `<Modal>` while locked

React Native's `<Modal>` only supports portrait. While a modal that can't show the locked orientation is on screen, the lock is suspended and re-applied when the modal closes. 2.x could crash in this case. See [Using `<Modal>` with a lock](../README.md#using-modal-with-a-lock-ios).

#### iPad and Android 16+ large screens

Both systems can ignore orientation locks:

- **iPadOS**: resizable (multitasking) apps ignore locks. Set `UIRequiresFullScreen` to make them work ([iPad](../README.md#ipad)).
- **Android 16+**: apps targeting API 36+ can't lock orientation on screens 600dp wide or wider ([Android 16+ large screens](../README.md#android-16-large-screens)).

On these devices 3.0 doesn't report a lock that wasn't applied: `isLocked()` stays `false` and no `onLockOrientationChange` event fires. Use the new `canLockOrientation()` to adapt your UI.

### New features

- **`canLockOrientation()`**: tells you whether the system will apply locks on this device ([API](../README.md#canlockorientation-boolean)).
- **Automatic setup**: `npx react-native-orientation-turbo setup` edits your native project for you ([Automatic setup](../README.md#automatic-setup)).
- **Jest mock**: `react-native-orientation-turbo/jest/setup` ([Testing with Jest](../README.md#testing-with-jest)).
- **Typed native APIs**: `PortraitDirection` / `LandscapeDirection` overloads in Swift and Kotlin (below).

### Native API changes

Only relevant if you call the library from Swift, Objective-C, Kotlin or Java.

#### iOS

- **Typed overloads**: `lockToPortrait(_: PortraitDirection)` and `lockToLandscape(_: LandscapeDirection)`. The string versions are deprecated in Swift (they still work; Objective-C is unaffected):

  ```swift
  // 2.x
  OrientationTurbo.shared.lockToLandscape("LEFT")
  // 3.0
  OrientationTurbo.shared.lockToLandscape(.left)
  OrientationTurbo.shared.lockToPortrait(.upsideDown)
  ```

- **`canLockOrientation()`** is available on `OrientationTurbo.shared`.
- **Removed**: the undocumented `OrientationTurboShared` class. `OrientationTurbo.shared` works as before.
- **Removed (iOS 15)**: the undocumented `OrientationSupportDidChange` / `ForceOrientationChange` notifications are no longer posted.
- **SceneDelegate**: apps on the SceneDelegate template (React Native 0.88) are supported. See [iOS Setup](../README.md#ios-setup).

#### Android

- **Removed**: `android/gradle.properties` and the `OrientationTurbo_*` property overrides (`OrientationTurbo_compileSdkVersion` etc.). The library still uses your app's `rootProject.ext` values (`compileSdkVersion`, `minSdkVersion`, …).
- **New enum value**: `Orientation.PORTRAIT_UPSIDE_DOWN`. An exhaustive Kotlin `when` over `Orientation` needs a branch for it.
- **Removed**: the public `com.orientationturbo.constants.AngleRanges` object.
- **New**:

  ```kotlin
  OrientationTurbo.lockToPortrait(activity, PortraitDirection.UPSIDE_DOWN)
  OrientationTurbo.getCurrentOrientation(activity) // what the screen shows
  OrientationTurbo.canLockOrientation(activity)
  ```

  `getCurrentOrientation()` without an activity still returns the stored state (the lock if locked, otherwise the last tracked orientation).

See the [Native Usage Guide](NATIVE_USAGE.md) for full examples.

### Troubleshooting

- **`unrecognized selector` / `OrientationTurboShared` not found**: use `OrientationTurbo.shared`.
- **iOS build error in `fmt/base.h` (`consteval`) on React Native ≤ 0.83 with Xcode 26.4+**: a React Native issue, not this library. See the [fmt note](../README.md#ios-setup) in the README.
- **Locks don't work on iPad / Android tablets**: expected without the setup above. Check `canLockOrientation()`.
- **Landscape events look reversed**: remove 2.x workarounds (see above).

---

## Migrating from 2.1.x to 2.2.0

This guide helps you migrate from any previous version to v2.2.0, which introduces significant iOS architecture improvements and API changes.

### Overview of Changes

Version 2.2.0 introduces a major refactor of the iOS codebase with breaking changes for native iOS usage, while **React Native usage remains unchanged**.

#### What's Changed:
- **iOS Native API**: `OrientationTurboImpl.shared` changed to `OrientationTurbo.shared`
- **React Native**: No changes required for JavaScript usage
- **Android**: No changes required

---

### Migration Instructions

#### iOS Native Usage (Breaking Changes)

If you're using native iOS methods in your `AppDelegate.swift` or other iOS code, you need to update the API calls.

##### Before v2.2.0:
```swift
import OrientationTurbo

// ❌ Old API (no longer works)
func application(_ application: UIApplication, supportedInterfaceOrientationsFor window: UIWindow?) -> UIInterfaceOrientationMask {
    return OrientationTurboImpl.shared.getSupportedInterfaceOrientations()
}

// ❌ Old early locking
OrientationTurboImpl.shared.lockToPortrait()
OrientationTurboImpl.shared.lockToLandscape("LEFT")
```

##### After v2.2.0:
```swift
import OrientationTurbo

// ✅ New API
func application(_ application: UIApplication, supportedInterfaceOrientationsFor window: UIWindow?) -> UIInterfaceOrientationMask {
    return OrientationTurbo.shared.getSupportedInterfaceOrientations()
}

// ✅ New early locking
OrientationTurbo.shared.lockToPortrait()
OrientationTurbo.shared.lockToLandscape("LEFT")
```

##### Complete Migration Example:

**Old AppDelegate.swift (v2.1.x and earlier):**
```swift
import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import OrientationTurbo

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  
  func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
    
    // ❌ Old early locking API
    OrientationTurboImpl.shared.lockToPortrait()
    
    // React Native setup...
    return true
  }
  
  // ❌ Old orientation support API
  func application(_ application: UIApplication, supportedInterfaceOrientationsFor window: UIWindow?) -> UIInterfaceOrientationMask {
    return OrientationTurboImpl.shared.getSupportedInterfaceOrientations()
  }
}
```

**New AppDelegate.swift (v2.2.0+):**
```swift
import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import OrientationTurbo

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  
  func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
    
    // ✅ New early locking API
    OrientationTurbo.shared.lockToPortrait()
    
    // React Native setup...
    return true
  }
  
  // ✅ New orientation support API
  func application(_ application: UIApplication, supportedInterfaceOrientationsFor window: UIWindow?) -> UIInterfaceOrientationMask {
    return OrientationTurbo.shared.getSupportedInterfaceOrientations()
  }
}
```

### Quick Migration Checklist

#### For React Native Usage:
- No changes required - your code continues to work

#### For iOS Native Usage:
- Search your iOS code for `OrientationTurboImpl.shared`
- Replace all instances with `OrientationTurbo.shared`
- Test that orientation locking still works in your app
- Clean and rebuild your iOS app

#### For Android Native Usage:
- No changes required - your code continues to work

### Troubleshooting

#### Common Issues:

##### 1. "Unrecognized selector sent to class" Error
```
+[OrientationTurboImpl shared]: unrecognized selector sent to class
```
**Solution**: Update your iOS code to use `OrientationTurbo.shared` instead of `OrientationTurboImpl.shared`

##### 2. Build Errors After Migration
**Solution**: 
1. Clean your iOS build: `cd ios && xcodebuild clean`
2. Remove Pods: `cd ios && rm -rf Pods Podfile.lock`
3. Reinstall: `pod install`
4. Clean React Native cache: `npx react-native start --reset-cache`

##### 3. Orientation Not Working After Migration
**Solution**: Verify you've updated all instances in your `AppDelegate.swift`:
- Updated `getSupportedInterfaceOrientations()` call
- Updated any early locking calls
- Imported `OrientationTurbo` (not `OrientationTurboImpl`)

#### Need Help?

If you encounter issues during migration:
1. Check this migration guide again
2. Review the [Native Usage Guide](NATIVE_USAGE.md)
3. Check our [Advanced Usage documentation](ADVANCED_USAGE.md)
4. Open an issue on GitHub with your specific problem

### Summary

The migration is straightforward and the new architecture provides a much cleaner foundation for future development! 