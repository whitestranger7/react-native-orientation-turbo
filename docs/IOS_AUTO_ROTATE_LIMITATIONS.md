# iOS Auto-Rotate Detection Limitations

This document explains why the `getDeviceAutoRotateStatus()` method is not available on iOS and provides context about iOS platform limitations regarding auto-rotate status detection.

## Motivation

This library was designed to work with authentic iOS and Android SDK capabilities without creating false abstractions. iOS handles orientation in an app-specific manner that is fundamentally different from Android's system-level approach.

### Design Philosophy

**No SDK Functionality Simulation**: This library does not fake or simulate SDK features that don't exist. While iOS provides motion detection through CoreMotion framework, motion sensor availability is **not equivalent** to auto-rotate status detection.

**Platform-Accurate Responses**: All iOS-supported devices that work with React Native's New Architecture are physically capable of rotation, but iOS doesn't expose system-level auto-rotate settings to apps.

#### Why not return `true` for iOS?

Rather than returning a misleading `true` value, the library returns `null` to clearly indicate that this functionality is unavailable on iOS. This approach follows library ideology by:

- Respecting each platform's SDK architecture
- Preventing false assumptions about available data
- Maintaining API consistently and transparently

Since iOS provides no genuine API for auto-rotate status detection, returning `null` is the most honest approach.

## Why iOS Doesn't Support Auto-Rotate Status Detection

The `getDeviceAutoRotateStatus()` method is **Android-only** due to fundamental differences in how iOS and Android handle orientation and auto-rotate settings.

### iOS Platform Limitations

#### 1. No Public API Access
iOS does not provide public APIs to:
- Check if auto-rotate is enabled in device settings
- Detect if the device physically supports orientation changes
- Query system-level rotation preferences

#### 2. Privacy and Security Model
Apple's privacy-focused approach restricts apps from accessing system-level settings that could be used for device fingerprinting or user behavior tracking.

#### 3. App-Centric Orientation Control
iOS orientation control is primarily app-centric rather than system-centric:
- Apps declare supported orientations in `Info.plist`
- Apps control orientation through `UIInterfaceOrientationMask`
- System auto-rotate settings have limited impact on individual apps

## Android vs iOS Comparison

| Feature | Android | iOS |
|---------|---------|-----|
| **System Auto-Rotate Detection** | ✅ Available via `Settings.System.ACCELEROMETER_ROTATION` | ❌ No public API |
| **Orientation Sensor Detection** | ✅ Available via `OrientationEventListener.canDetectOrientation()` | ❌ No equivalent API |
| **App-Level Orientation Control** | ✅ Supported | ✅ Supported |
| **System Settings Integration** | ✅ Apps respect system auto-rotate | 🔶 Limited integration |

## Best Practices for RN apps

### 1. Rely on null response for IOS

Always check the platform before calling `getDeviceAutoRotateStatus()`:

```typescript
import { getDeviceAutoRotateStatus } from 'react-native-orientation-turbo';

const checkAutoRotateStatus = () => {
  const status = getDeviceAutoRotateStatus();
  if (status) {
    // Android: status is available
    console.log('Auto-rotate enabled:', status.isAutoRotateEnabled);
    console.log('Can detect orientation:', status.canDetectOrientation);
  } else {
    // iOS: status is null
    console.log('Auto-rotate status not available on this platform');
  }
};
```

### 2. Platform-specific code

```typescript
import { Platform } from 'react-native';
import { getDeviceAutoRotateStatus } from 'react-native-orientation-turbo';

const checkAutoRotateStatus = () => {
  if (Platform.OS === 'android') {
    const status = getDeviceAutoRotateStatus();
    if (status) {
      console.log('Auto-rotate enabled:', status.isAutoRotateEnabled);
      console.log('Can detect orientation:', status.canDetectOrientation);
    }
  } else {
    console.log('Auto-rotate status detection not available on iOS');
    // Continue with iOS-specific orientation handling
  }
};
```

## Summary

The `getDeviceAutoRotateStatus()` method's iOS limitation reflects a principled approach to cross-platform development:

- **Authenticity**: Returns `null` on iOS because genuine auto-rotate status detection isn't available
- **Clarity**: Prevents developer confusion by avoiding false positive responses  
- **Consistency**: Maintains transparent API behavior across platforms
- **Best Practice**: Encourages proper platform-specific handling in React Native apps

For iOS development, focus on app-level orientation control using the library's other methods like `startOrientationTracking()`, `lockToPortrait()`, and `lockToLandscape()` which work reliably across both platforms.
