# react-native-orientation-turbo 🚀

A React Native library for controlling device orientation with support for locking to portrait, landscape orientations, and real-time orientation change subscriptions. Built with **Turbo Modules** for optimal performance.

## Features

- **Modern Architecture**: Built with React Native Turbo Modules
- **Cross Platform**: Support for both iOS and Android
- **Orientation Locking**: Lock to portrait or landscape orientations
- **Early Orientation Locking**: Lock orientation before React Native loads (before bootsplash)
- **AndroidManifest.xml Sync**: Automatic synchronization with Android manifest orientation settings
- **State Synchronization**: Seamless state sync between Native and JavaScript contexts
- **Event Subscriptions**: Subscribe to orientation changes with live updates
- **TypeScript**: Full TypeScript support with type definitions
- **Performance**: Native performance with Turbo Module architecture

## Requirements

What your app needs to use this library:

| | Requirement |
|---|---|
| React Native | **0.80 or newer** (supported range: 0.80 – 0.88) |
| Architecture | **New Architecture** (Turbo Modules) |
| iOS | 15.1+ |
| Android | API level 24+ (Android 7.0) |
| Build tools | Whatever your React Native version requires (Xcode, JDK 17+, Gradle, CocoaPods). The library doesn't add requirements of its own. |

> **Important**: This library requires the New Architecture (Turbo Modules). It does not support the legacy bridge.
> The New Architecture is always on from React Native 0.82. On 0.80 and 0.81 it's the default; don't turn it off (`newArchEnabled=false` / `RCT_NEW_ARCH_ENABLED=0`).

Want to contribute? The development toolchain is described in the [contributing guide](CONTRIBUTING.md#prerequisites).

## Installation

```sh
npm install react-native-orientation-turbo
```

or

```sh
yarn add react-native-orientation-turbo
```

### iOS Setup

1. Install pods:
```sh
cd ios && bundle exec pod install
```

2. Add the orientation support method to your `AppDelegate.swift`. This is required in **every** app, whether or not it uses a `SceneDelegate`:

```swift
import OrientationTurbo  // Add this import

// Inside your AppDelegate class:
func application(_ application: UIApplication, supportedInterfaceOrientationsFor window: UIWindow?) -> UIInterfaceOrientationMask {
  return OrientationTurbo.shared.getSupportedInterfaceOrientations()
}
```

Where React Native starts depends on your app's setup. Both are supported:

**AppDelegate-only apps** (the React Native template up to 0.87). React Native starts in `AppDelegate.swift`:

```swift
import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import OrientationTurbo  // Add this import

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    // ... your existing React Native setup ...
    return true
  }

  // Add this method
  func application(_ application: UIApplication, supportedInterfaceOrientationsFor window: UIWindow?) -> UIInterfaceOrientationMask {
    return OrientationTurbo.shared.getSupportedInterfaceOrientations()
  }
}
```

**SceneDelegate apps** (the React Native template from 0.88). React Native starts in `SceneDelegate.swift`, but the orientation method still goes in `AppDelegate.swift`:

```swift
import UIKit
import OrientationTurbo  // Add this import

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    true
  }

  // Add this method
  func application(_ application: UIApplication, supportedInterfaceOrientationsFor window: UIWindow?) -> UIInterfaceOrientationMask {
    return OrientationTurbo.shared.getSupportedInterfaceOrientations()
  }
}
```

The [example app](example/ios/OrientationTurboExample) uses the SceneDelegate setup.

3. Make sure your `Info.plist` lists every orientation you want to lock to (`UISupportedInterfaceOrientations`, and `UISupportedInterfaceOrientations~ipad` for iPad). The library can only lock to orientations the app declares.

#### iPad

iPadOS **ignores orientation locks for apps that support resizing**, which is the default. To lock orientation on iPad, the app has to opt out of resizing with `UIRequiresFullScreen`:

```xml
<key>UIRequiresFullScreen</key>
<true/>
```

Apple has deprecated this key and recommends supporting all orientations instead ([TN3192](https://developer.apple.com/documentation/technotes/tn3192-migrating-your-app-from-the-deprecated-uirequiresfullscreen-key)). What we measured with a lock applied at launch:

| iPadOS | Without `UIRequiresFullScreen` | With `UIRequiresFullScreen` |
|---|---|---|
| 18 | lock ignored | lock applied |
| 26 | lock ignored | app opens in a window with the locked shape; the screen doesn't rotate |
| 27 | lock ignored | lock applied |

Use [`canLockOrientation()`](#canlockorientation-boolean) to find out at runtime whether locks will apply. Also note that iPhones without a Home button never support portrait upside-down.

### Android Setup

No additional setup required for Android.

> **Note**: The library automatically syncs with your `AndroidManifest.xml` orientation settings. If you have `android:screenOrientation` set in your manifest, the library will respect and sync with those settings into state on initialization.

## Migration Guide

If you're upgrading from a previous version, please check our [Migration Guide](docs/MIGRATION.md) for any breaking changes and upgrade instructions.

**v2.2.0 Breaking Changes**: iOS native API changed from `OrientationTurboImpl.shared` to `OrientationTurbo.shared`. React Native usage remains unchanged.

## Usage

```typescript
import {
  lockToPortrait,
  lockToLandscape,
  unlockAllOrientations,
  getCurrentOrientation,
  isLocked,
  getDeviceAutoRotateStatus,
  onOrientationChange,
  onLockOrientationChange,
  startOrientationTracking,
  stopOrientationTracking,
  PortraitDirection,
  Orientation,
  LandscapeDirection,
  type OrientationSubscription,
  type LockOrientationSubscription,
  type DeviceAutoRotateStatus,
} from 'react-native-orientation-turbo';
```

### Basic Examples

```typescript
// Starts tracking native sensors for onOrientationChange.
startOrientationTracking();

// Stops tracking native sensors.
stopOrientationTracking();

// Lock to portrait orientation
lockToPortrait();

// Lock to portrait UPSIDE_DOWN orientation
lockToPortrait(PortraitDirection.UPSIDE_DOWN);

// Lock to landscape left
lockToLandscape(LandscapeDirection.LEFT);

// Lock to landscape right  
lockToLandscape(LandscapeDirection.RIGHT);

// Unlock all orientations (allow rotation)
unlockAllOrientations();

// Get current orientation. If screen is locked - returns lock state, if not - returns current device orientation
const currentOrientation = getCurrentOrientation();
console.log(currentOrientation); // 'PORTRAIT' | 'LANDSCAPE_LEFT' | 'LANDSCAPE_RIGHT' | 'FACE_UP' | 'FACE_DOWN'

// Check if orientation is currently locked
const locked = isLocked();
console.log(locked); // true | false

// Get device auto-rotate status (Android only). iOS will return null
const autoRotateStatus = getDeviceAutoRotateStatus();
console.log(autoRotateStatus); // { isAutoRotateEnabled: boolean, canDetectOrientation: boolean } | null

// Subscribe to lock orientation changes
onLockOrientationChange(({ orientation, isLocked }) => {
  // Your code there
})

// Subscribe to device orientation changes
onOrientationChange(({ orientation }) => {
  // Your code there
})
```

## API Reference

### Methods

#### `startOrientationTracking(): void`

Starts using native sensors to track device orientation changes.
When device is physically rotates - sensors are detecting changes and expose it via `onOrientationChange` subscription.
Drains battery faster and uses device power resources. 
Recommended to use only when sensors are needed and remove when not needed remove sensors tracking by using `stopOrientationTracking`.

```typescript
startOrientationTracking();
```

#### `stopOrientationTracking(): void`

Stops using native sensors if it's used. Physical devices rotation would no longer be tracked.

```typescript
stopOrientationTracking();
```

#### `lockToPortrait(direction?: PortraitDirection): void`

Locks the device orientation to portrait mode.

**Parameters:**
- `direction?`: `PortraitDirection.UP` or `PortraitDirection.UPSIDE_DOWN` or `undefined`

```typescript
import { PortraitDirection } from 'react-native-orientation-turbo';

lockToPortrait(); // same as lockToPortrait(PortraitDirection.UP)
lockToPortrait(PortraitDirection.UP);
lockToPortrait(PortraitDirection.UPSIDE_DOWN);
```

#### `lockToLandscape(direction: LandscapeDirection): void`

Locks the device orientation to landscape mode in the specified direction.

**Parameters:**
- `direction`: `LandscapeDirection.LEFT` or `LandscapeDirection.RIGHT`

```typescript
import { LandscapeDirection } from 'react-native-orientation-turbo';

lockToLandscape(LandscapeDirection.LEFT);
lockToLandscape(LandscapeDirection.RIGHT);
```

#### `unlockAllOrientations(): void`

Unlocks the orientation, allowing the device to rotate freely based on device rotation.

```typescript
unlockAllOrientations();
```

#### `getCurrentOrientation(): string`

Returns the current device orientation.

**Returns:** `'PORTRAIT'` | `'LANDSCAPE_LEFT'` | `'LANDSCAPE_RIGHT'` | `'FACE_UP'` | `'FACE_DOWN'`

```typescript
const orientation = getCurrentOrientation();
```

#### `isLocked(): boolean`

Returns whether the orientation is currently locked.

**Returns:** `true` if orientation is locked, `false` if unlocked

```typescript
const locked = isLocked();
```

#### `canLockOrientation(): boolean`

Returns whether the OS will apply orientation locks for this app.

**Returns:** `false` where the system ignores locks: on iPad when the app supports resizing (no `UIRequiresFullScreen`, see [iPad](#ipad)). `true` otherwise.

```typescript
if (!canLockOrientation()) {
  // Lay the UI out for any orientation instead of relying on a lock
}
```

#### `getDeviceAutoRotateStatus(): DeviceAutoRotateStatus | null`

**Android only.** Returns information about the device's auto-rotate settings and orientation detection capabilities.

**Returns:** 
- `DeviceAutoRotateStatus` object on Android
- `null` on iOS (not supported)

> **iOS Limitation:** This method is not available on iOS due to platform restrictions. See [iOS Auto-Rotate Detection Limitations](docs/IOS_AUTO_ROTATE_LIMITATIONS.md) for detailed explanation and alternative approaches.

**DeviceAutoRotateStatus Properties:**
- `isAutoRotateEnabled`: `boolean` - Whether auto-rotate is enabled in device settings
- `canDetectOrientation`: `boolean` - Whether the device can detect orientation changes

```typescript
import { getDeviceAutoRotateStatus } from 'react-native-orientation-turbo';

const status = getDeviceAutoRotateStatus();
if (status) {
  console.log('Auto-rotate enabled:', status.isAutoRotateEnabled);
  console.log('Can detect orientation:', status.canDetectOrientation);
} else {
  console.log('Auto-rotate status not supported on this platform');
}
```

### Subscriptions

#### `onLockOrientationChange(callback: (subscription: LockOrientationSubscription) => void)`

Subscribes to orientation changes and receives real-time updates.

**Parameters:**
- `callback`: Function called when lock state orientation changes, receives `LockOrientationSubscription` object

**Returns:** Subscription object with `remove()` method to unsubscribe

```typescript
import { onLockOrientationChange } from 'react-native-orientation-turbo';

const subscription = onLockOrientationChange(({ orientation, isLocked }) => {
  console.log('Current orientation:', orientation);
  console.log('Is locked:', isLocked);
});

// Unsubscribe when no longer needed
subscription.remove();
```

**React Hook Example:**
```typescript
import { useEffect, useRef } from 'react';
import type { EventSubscription } from 'react-native';

import { onLockOrientationChange } from 'react-native-orientation-turbo';

const MyComponent = () => {
  const lockListenerSubscription = useRef<null | EventSubscription>(null);

  useEffect(() => {
    lockListenerSubscription.current = onLockOrientationChange(({ orientation, isLocked }) => {
      // Handle orientation change
      console.log('Orientation:', orientation, 'Locked:', isLocked);
    });

    return () => {
      lockListenerSubscription.current?.remove();
      lockListenerSubscription.current = null;
    }; // Clean up subscription
  }, []);

  return <View>{/* Your component */}</View>;
};
```

#### `onOrientationChange(callback: (subscription: OrientationSubscription) => void)`

Subscribes to orientation changes and receives real-time updates.

**Parameters:**
- `callback`: Function called when device physical orientation changes, receives `OrientationSubscription` object

**Returns:** Subscription object with `remove()` method to unsubscribe

```typescript
import { onOrientationChange } from 'react-native-orientation-turbo';

const subscription = onOrientationChange(({ orientation }) => {
  console.log('Current device orientation:', orientation);
});

// Unsubscribe when no longer needed
subscription.remove();
```

**React Hook Example:**
```typescript
import { useEffect, useRef } from 'react';
import type { EventSubscription } from 'react-native';

import { onOrientationChange } from 'react-native-orientation-turbo';

const MyComponent = () => {
  const listenerSubscription = useRef<null | EventSubscription>(null);

  useEffect(() => {
    listenerSubscription.current = onOrientationChange(({ orientation }) => {
      // Handle orientation change
      console.log('Orientation:', orientation);
    });

    return () => {
      listenerSubscription.current?.remove();
      listenerSubscription.current = null;
    }; // Clean up subscription
  }, []);

  return <View>{/* Your component */}</View>;
};
```

### Types

#### `LandscapeDirection`

```typescript
enum LandscapeDirection {
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
}
```

#### `PortraitDirection`

```typescript
enum PortraitDirection {
  UP = 'UP',
  UPSIDE_DOWN = 'UPSIDE_DOWN', // not supported on iPhones with Face ID
}
```

#### `Orientation`

```typescript
enum Orientation {
  PORTRAIT = 'PORTRAIT',
  PORTRAIT_UPSIDE_DOWN = 'PORTRAIT_UPSIDE_DOWN',
  LANDSCAPE_LEFT = 'LANDSCAPE_LEFT',
  LANDSCAPE_RIGHT = 'LANDSCAPE_RIGHT',
  FACE_UP = 'FACE_UP', // iOS only
  FACE_DOWN = 'FACE_DOWN', // iOS only
}
```

#### `LockOrientationSubscription`

```typescript
type LockOrientationSubscription = {
  orientation: Orientation | null;
  isLocked: boolean;
};
```

#### `OrientationSubscription`

```typescript
type OrientationSubscription = {
  orientation: Orientation;
};
```

#### `DeviceAutoRotateStatus`

```typescript
type DeviceAutoRotateStatus = {
  isAutoRotateEnabled: boolean;
  canDetectOrientation: boolean;
};
```

## Advanced Features

### Early Orientation Locking

Lock orientation before React Native loads (useful for preventing orientation changes during app initialization/bootsplash):

**iOS - AppDelegate-only apps (`AppDelegate.swift`):**
```swift
func application(
  _ application: UIApplication,
  didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
) -> Bool {
  // Lock orientation BEFORE React Native loads
  OrientationTurbo.shared.lockToPortrait()

  // ... your existing React Native setup (factory.startReactNative(...)) ...
  return true
}
```

**iOS - SceneDelegate apps (`SceneDelegate.swift`):**
```swift
func scene(
  _ scene: UIScene,
  willConnectTo session: UISceneSession,
  options connectionOptions: UIScene.ConnectionOptions
) {
  // ... create the window and the React Native factory ...

  // Lock orientation BEFORE React Native loads
  OrientationTurbo.shared.lockToPortrait()

  reactNativeFactory?.startReactNative(
    withModuleName: "YourAppName",
    in: window,
    connectionOptions: connectionOptions
  )
}
```

**Android - MainActivity.kt:**
```kotlin
override fun onCreate(savedInstanceState: Bundle?) {
    // Lock orientation BEFORE React Native loads
    OrientationTurbo.lockToPortrait(this)
    
    super.onCreate(savedInstanceState)
}
```

### AndroidManifest.xml Synchronization

The library automatically syncs with your Android manifest orientation settings:

```xml
<activity android:screenOrientation="portrait">
  <!-- Library will automatically sync to portrait on initialization -->
</activity>
```

### State Synchronization

Early orientation locks are automatically synchronized with your JavaScript context when the library initializes, ensuring consistent state across native and JavaScript.

For comprehensive documentation on advanced features, early orientation locking, state synchronization, and integration patterns, see **[Advanced Usage Guide](docs/ADVANCED_USAGE.md)**.

For detailed information on using the library natively in iOS and Android applications, including architecture, restrictions, and best practices, see **[Native Usage Guide](docs/NATIVE_USAGE.md)**.

## Complete Example

Please visit `example` folder on github page.

## Enabling New Architecture

This library requires React Native's New Architecture (Turbo Modules). It's always enabled from React Native 0.82, and enabled by default on 0.80 and 0.81. If you turned it off there, please refer to the React Native docs on how to enable it again.

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
