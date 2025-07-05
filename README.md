# react-native-orientation-turbo

A React Native library for controlling device orientation with support for locking to portrait, landscape orientations. Built with **Turbo Modules** for optimal performance.

## Features

**Modern Architecture**: Built with React Native Turbo Modules  
**Cross Platform**: Support for both iOS and Android  
**Orientation Locking**: Lock to portrait or landscape orientations  
**Orientation Detection**: Get current device orientation  
**TypeScript**: Full TypeScript support with type definitions  
**Performance**: Native performance with Turbo Module architecture  

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

```sh
cd ios && pod install
```

### Android Setup

No additional setup required for Android.

## Usage

```typescript
import {
  lockToPortrait,
  lockToLandscape,
  unlockAllOrientations,
  getCurrentOrientation,
  isLocked,
  type LandscapeDirection,
  type Orientation,
} from 'react-native-orientation-turbo';
```

### Basic Examples

```typescript
// Lock to portrait orientation
lockToPortrait();

// Lock to landscape left
lockToLandscape(LandscapeDirection.LEFT);

// Lock to landscape right  
lockToLandscape(LandscapeDirection.RIGHT);

// Unlock all orientations (allow rotation)
unlockAllOrientations();

// Get current orientation
const currentOrientation = getCurrentOrientation();
console.log(currentOrientation); // 'PORTRAIT' | 'LANDSCAPE_LEFT' | 'LANDSCAPE_RIGHT'

// Check if orientation is currently locked
const locked = isLocked();
console.log(locked); // true | false
```

## API Reference

### Methods

#### `lockToPortrait(): void`

Locks the device orientation to portrait mode.

```typescript
lockToPortrait();
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

**Returns:** `'PORTRAIT'` | `'LANDSCAPE_LEFT'` | `'LANDSCAPE_RIGHT'`

```typescript
const orientation = getCurrentOrientation();
```

#### `isLocked(): boolean`

Returns whether the orientation is currently locked.

**Returns:** `true` if orientation is locked, `false` if unlocked

```typescript
const locked = isLocked();
```

### Types

#### `LandscapeDirection`

```typescript
enum LandscapeDirection {
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
}
```

#### `Orientation`

```typescript
enum Orientation {
  PORTRAIT = 'PORTRAIT',
  LANDSCAPE_LEFT = 'LANDSCAPE_LEFT',
  LANDSCAPE_RIGHT = 'LANDSCAPE_RIGHT',
}
```

## Complete Example

Please visit `examples` folder on github page.

## Enabling New Architecture

This library requires React Native's New Architecture (Turbo Modules). Here's how to enable it:

### For React Native 0.70+

#### iOS
In your `ios/Podfile`:

```ruby
use_react_native!(
  :path => '../node_modules/react-native',
  :fabric_enabled => true,
  :new_arch_enabled => true,
  :hermes_enabled => true
)
```

#### Android
In your `android/gradle.properties`:

```properties
newArchEnabled=true
```

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
