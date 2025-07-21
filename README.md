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

- React Native 0.70+ (Turbo Modules support required)
- iOS 11.0+
- Android API level 21+
- **New Architecture enabled** (Turbo Modules)

> **Important**: This library requires the New Architecture (Turbo Modules) to be enabled. It does not support the legacy bridge.

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
cd ios && pod install
```

2. Modify your `AppDelegate.swift` file:

**Add the import statement:**
```swift
import OrientationTurbo
```

**Add the orientation support method:**
```swift
func application(_ application: UIApplication, supportedInterfaceOrientationsFor window: UIWindow?) -> UIInterfaceOrientationMask {
  return OrientationTurbo.shared.getSupportedInterfaceOrientations()
}
```

Your `AppDelegate.swift` should look like this:
```swift
import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import OrientationTurbo  // Add this import

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  // ... other code ...
  
  // Add this method
  func application(_ application: UIApplication, supportedInterfaceOrientationsFor window: UIWindow?) -> UIInterfaceOrientationMask {
    return OrientationTurbo.shared.getSupportedInterfaceOrientations()
  }
}
```

### Android Setup

No additional setup required for Android.

> **Note**: The library automatically syncs with your `AndroidManifest.xml` orientation settings. If you have `android:screenOrientation` set in your manifest, the library will respect and sync with those settings into state on initialization.

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
  UPSIDE_DOWN = 'UPSIDE_DOWN', // iOS only
}
```

#### `Orientation`

```typescript
enum Orientation {
  PORTRAIT = 'PORTRAIT',
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

**iOS - AppDelegate.swift:**
```swift
func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
    // Lock orientation BEFORE React Native loads
    OrientationTurbo.shared.lockToPortrait()
    
    // Your existing setup...
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
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

## Complete Example

Please visit `example` folder on github page.

## Enabling New Architecture

This library requires React Native's New Architecture (Turbo Modules). Please refer to React Native docs on how to enable it.

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
