# Advanced Usage Guide

This guide covers advanced orientation control scenarios including early locking before bootsplash, state synchronization, and platform-specific configurations.

## Early Orientation Locking (Before Bootsplash)

### iOS - AppDelegate Integration

You can lock orientation before React Native loads using `OrientationTurbo.shared` in your AppDelegate:

```swift
import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import OrientationTurbo

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  
  func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
    
    // Lock orientation BEFORE React Native loads (before bootsplash)
    OrientationTurbo.shared.lockToPortrait()
    
    // Other locking options:
    // OrientationTurbo.shared.lockToLandscape("LEFT")
    // OrientationTurbo.shared.lockToLandscape("RIGHT")
    // OrientationTurbo.shared.unlockAllOrientations()
    
    // Your existing React Native setup...
    factory.startReactNative(
      withModuleName: "OrientationTurboExample",
      in: window,
      launchOptions: launchOptions
    )
    
    return true
  }
  
  // Required for orientation control
  func application(_ application: UIApplication, supportedInterfaceOrientationsFor window: UIWindow?) -> UIInterfaceOrientationMask {
    return OrientationTurbo.shared.getSupportedInterfaceOrientations()
  }
}
```

**State Synchronization**: When you call `OrientationTurbo.shared` methods in AppDelegate, the orientation state is automatically maintained in the singleton and will be accessible when your React Native JavaScript code loads.

### Android - MainActivity Integration

You can lock orientation before React Native loads using the `OrientationTurbo` static class:

```kotlin
package your.package.name

import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.orientationturbo.OrientationTurbo

class MainActivity : ReactActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        // Lock orientation BEFORE React Native loads (before bootsplash)
        OrientationTurbo.lockToPortrait(this)
        
        // Other locking options:
        // OrientationTurbo.lockToLandscape(this, "LEFT")
        // OrientationTurbo.lockToLandscape(this, "RIGHT")
        // OrientationTurbo.unlockAllOrientations(this)
        
        super.onCreate(savedInstanceState)
    }

    override fun getMainComponentName(): String = "YourAppName"

    override fun createReactActivityDelegate(): ReactActivityDelegate =
        DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}
```

**State Synchronization**: When you call `OrientationTurbo` static methods in MainActivity, the state is stored in `OrientationTurbo.sharedState` and automatically synced with `OrientationTurboModule` when React Native initializes.

## State Synchronization Mechanisms

### How Synchronization Works

#### iOS Synchronization
```swift
// 1. AppDelegate calls (before React Native)
OrientationTurbo.shared.lockToPortrait()

// 2. Singleton maintains state across app lifecycle
// 3. JavaScript calls read from the same singleton instance
// 4. State is always consistent between native and JavaScript
```

#### Android Synchronization
```kotlin
// 1. MainActivity calls (before React Native)
OrientationTurbo.lockToPortrait(this)
// Creates: OrientationTurbo.sharedState = OrientationState(PORTRAIT, true)

// 2. OrientationTurboModule initialization
init {
    val (orientation, isLocked) = OrientationTurbo.getInitialOrientationState(reactContext)
    currentLockedOrientation = orientation  // PORTRAIT
    isOrientationLocked = isLocked         // true
}

// 3. State cleared after sync to prevent memory leaks
OrientationTurbo.clearSharedState()
```

### JavaScript Integration

Once React Native loads, the orientation state is automatically available:

```typescript
import { 
  onLockOrientationChange, 
  isLocked, 
  getCurrentOrientation 
} from 'react-native-orientation-turbo';

useEffect(() => {
  // State is already synced from native calls!
  console.log('Is locked:', isLocked()); // true (from native)
  console.log('Orientation:', getCurrentOrientation()); // "PORTRAIT"
  
  const subscription = onLockOrientationChange(({ orientation, isLocked }) => {
    console.log('Lock state:', { orientation, isLocked });
    // Shows the state that was set in native code
  });

  return () => subscription.remove();
}, []);
```

## AndroidManifest.xml Synchronization

The library automatically detects and syncs with AndroidManifest.xml orientation settings:

### Supported Manifest Configurations

```xml
<!-- Locked orientations (detected as locked=true) -->
<activity android:screenOrientation="portrait">          <!-- → PORTRAIT, locked -->
<activity android:screenOrientation="landscape">         <!-- → LANDSCAPE_LEFT, locked -->
<activity android:screenOrientation="reversePortrait">   <!-- → PORTRAIT, locked -->
<activity android:screenOrientation="reverseLandscape">  <!-- → LANDSCAPE_RIGHT, locked -->
<activity android:screenOrientation="sensorPortrait">    <!-- → PORTRAIT, locked -->
<activity android:screenOrientation="sensorLandscape">   <!-- → LANDSCAPE_LEFT, locked -->

<!-- Unlocked orientations (detected as locked=false) -->
<activity android:screenOrientation="unspecified">       <!-- → unlocked -->
<activity android:screenOrientation="sensor">            <!-- → unlocked -->
<activity android:screenOrientation="fullSensor">        <!-- → unlocked -->
<activity android:screenOrientation="user">              <!-- → unlocked -->
```

### Priority System

The Android synchronization follows this priority order:

1. **Highest Priority**: `OrientationTurbo.lockToPortrait(this)` in MainActivity
2. **Medium Priority**: `android:screenOrientation` in AndroidManifest.xml  
3. **Default**: Unlocked if neither is set

### Example Scenarios

**Scenario 1: Only Manifest**
```xml
<activity android:screenOrientation="landscape">
```
```typescript
// JavaScript will show:
isLocked() // true
getCurrentOrientation() // "LANDSCAPE_LEFT"
```

**Scenario 2: Manifest + OrientationTurbo Override**
```xml
<activity android:screenOrientation="portrait">
```
```kotlin

OrientationTurbo.lockToLandscape(this, LandscapeDirection.LEFT) // Overrides manifest
```
```typescript
// JavaScript will show:
isLocked() // true  
getCurrentOrientation() // "LANDSCAPE_LEFT" (from OrientationTurbo, not manifest)
```

## Manual State Synchronization

### When You Might Need Manual Sync

In some advanced scenarios, you might want to manually sync state:

- Custom native modules that change orientation
- Third-party libraries that affect orientation
- Complex app flows with multiple activities

### Android Manual Sync

```kotlin
// In your custom code, manually update the shared state
OrientationTurbo.updateSharedState(Orientation.LANDSCAPE_LEFT, true)

// Or trigger a re-sync from manifest
val newState = OrientationUtils.syncWithManifestConfiguration(reactContext)
OrientationTurbo.updateSharedState(newState.orientation, newState.isLocked)
```

### iOS Manual Sync

```swift
// iOS automatically syncs through the singleton pattern
// Just call the methods on the shared instance
OrientationTurbo.shared.lockToLandscape("LEFT")

// State is immediately available to JavaScript
```

## Best Practices

### 1. Chrome OS Compatibility
Always keep AndroidManifest.xml flexible:
```xml
<activity android:screenOrientation="unspecified">
```
Use programmatic locking instead of manifest locking for better device compatibility.

### 2. State Consistency
- **iOS**: Use `OrientationTurbo.shared` for all orientation changes
- **Android**: Use `OrientationTurbo` static methods for early locking, JavaScript for runtime changes
- Always check current state before making changes

### 3. Performance
- State sync happens only once during app initialization
- No performance impact on runtime orientation changes
- Memory is cleaned up automatically after sync

## Troubleshooting

### iOS Issues
- Ensure the AppDelegate `supportedInterfaceOrientationsFor` method is implemented
- Check that orientation changes happen on the main thread
- Verify Info.plist includes the orientations you want to support

### Android Issues  
- Verify import: `import com.orientationturbo.OrientationTurbo`
- Check that MainActivity calls happen before `super.onCreate()`
- Ensure AndroidManifest.xml doesn't conflict with programmatic changes
- Test on different Android versions and device types

### State Sync Issues
- Check initialization order (native calls before React Native)
- Verify that state is properly cleared after sync
