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
import com.orientationturbo.enums.LandscapeDirection

class MainActivity : ReactActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        // Lock orientation BEFORE React Native loads (before bootsplash)
        OrientationTurbo.lockToPortrait(this)
        
        // Other locking options:
        // OrientationTurbo.lockToLandscape(this, LandscapeDirection.LEFT)
        // OrientationTurbo.lockToLandscape(this, LandscapeDirection.RIGHT)
        // OrientationTurbo.unlockAllOrientations(this)
        
        super.onCreate(savedInstanceState)
    }

    override fun getMainComponentName(): String = "YourAppName"

    override fun createReactActivityDelegate(): ReactActivityDelegate =
        DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}
```

**State Synchronization**: When you call `OrientationTurbo` static methods in MainActivity, the state is stored in the internal `OrientationState` singleton and automatically available to both native and React Native contexts without any synchronization overhead.

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
// Stores state in: OrientationState.setState(Orientation.PORTRAIT, true)

// 2. OrientationTurboModule initialization
init {
    OrientationSync.initializeSharedState(reactContext)
    // OrientationManager and all components now read from OrientationState directly
}

// 3. No state clearing needed - OrientationState persists throughout app lifecycle
// All components (native and React Native) share the same state instance
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
  // State is immediately available from shared state!
  console.log('Is locked:', isLocked()); // true (from native)
  console.log('Orientation:', getCurrentOrientation()); // "PORTRAIT"
  
  const subscription = onLockOrientationChange(({ orientation, isLocked }) => {
    console.log('Lock state:', { orientation, isLocked });
    // Shows the state that was set in native code
  });

  return () => subscription.remove();
}, []);
```

### Native Status Access (Android)

With the new shared state architecture, Android native code can also check status anywhere:

```kotlin
import com.orientationturbo.OrientationTurbo

class AnyActivity : AppCompatActivity() {
    
    override fun onResume() {
        super.onResume()
        
        // Check orientation status from anywhere
        val isLocked = OrientationTurbo.isLocked()
        val currentOrientation = OrientationTurbo.getCurrentOrientation()
        val lockedOrientation = OrientationTurbo.getLockedOrientation()
        val deviceOrientation = OrientationTurbo.getDeviceOrientation()
        
        Log.d("Activity", "Locked: $isLocked, Current: $currentOrientation")
        
        // Change orientation if needed
        if (!isLocked) {
            OrientationTurbo.lockToPortrait(this)
        }
    }
}
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
import com.orientationturbo.enums.LandscapeDirection

OrientationTurbo.lockToLandscape(this, LandscapeDirection.LEFT) // Overrides manifest
```
```typescript
// JavaScript will show:
isLocked() // true  
getCurrentOrientation() // "LANDSCAPE_LEFT" (from OrientationTurbo, not manifest)
```

## Shared State Architecture

### How It Works

With the new shared state architecture, manual synchronization is no longer needed:

- **Single Source of Truth**: `OrientationState.kt` (Android) and `OrientationTurbo.shared` (iOS) 
- **Automatic Consistency**: All components read from the same state instance
- **Real-time Updates**: State changes are immediately visible across all contexts
- **No Sync Overhead**: No complex synchronization mechanisms or state copying

### Advanced State Management

#### Android State Access

```kotlin
import com.orientationturbo.OrientationTurbo
import com.orientationturbo.enums.LandscapeDirection

class CustomOrientationManager {
    
    fun checkAndSetOrientation(activity: Activity) {
        // Check current state
        val isLocked = OrientationTurbo.isLocked()
        val currentOrientation = OrientationTurbo.getCurrentOrientation()
        
        // Make decisions based on state
        when (currentOrientation) {
            "PORTRAIT" -> {
                if (!isLocked) {
                    OrientationTurbo.lockToLandscape(activity, LandscapeDirection.LEFT)
                }
            }
            "LANDSCAPE_LEFT", "LANDSCAPE_RIGHT" -> {
                OrientationTurbo.unlockAllOrientations(activity)
            }
        }
        
        // State is immediately consistent across all contexts
        val newState = OrientationTurbo.isLocked()
        Log.d("Manager", "New lock state: $newState")
    }
}
```

### iOS State Access

```swift
// iOS automatically syncs through the singleton pattern
// Just call the methods on the shared instance
OrientationTurbo.shared.lockToLandscape("LEFT")

// State is immediately available everywhere
let isLocked = OrientationTurbo.shared.isLocked()
let orientation = OrientationTurbo.shared.getCurrentOrientation()
```

### Cross-Platform Consistency

Both platforms now provide immediate state consistency:

```typescript
// JavaScript
import { lockToPortrait, isLocked } from 'react-native-orientation-turbo';

// Lock from JavaScript
lockToPortrait();

// State is immediately available to native code
// No waiting, no callbacks, no async operations needed
```

```kotlin
// Android Native (anywhere in your app)
val isNowLocked = OrientationTurbo.isLocked() // true immediately
```

```swift
// iOS Native (anywhere in your app) 
let isNowLocked = OrientationTurbo.shared.isLocked() // true immediately
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
- **Android**: Use `OrientationTurbo` static methods for all orientation changes (both early and runtime)
- **Status Checking**: Use status methods (`isLocked()`, `getCurrentOrientation()`) from any context
- Always check current state before making changes for optimal UX

### 3. Performance
- **Zero sync overhead**: All components share the same state instance
- **Immediate consistency**: No async operations or callbacks needed for state access
- **Memory efficient**: Single state holder, no state duplication
- **Thread-safe**: All operations are thread-safe and can be called from any context

## Troubleshooting

### iOS Issues
- Ensure the AppDelegate `supportedInterfaceOrientationsFor` method is implemented
- Check that orientation changes happen on the main thread
- Verify Info.plist includes the orientations you want to support

### Android Issues  
- Verify imports: `import com.orientationturbo.OrientationTurbo` and `import com.orientationturbo.enums.LandscapeDirection`
- Check that MainActivity calls happen before `super.onCreate()`
- Ensure Activity context is passed to locking methods: `OrientationTurbo.lockToPortrait(this)`
- Ensure AndroidManifest.xml doesn't conflict with programmatic changes
- Test on different Android versions and device types

### Shared State Issues
- **Activity context**: Locking methods require Activity context, status methods work everywhere
- **Method signatures**: Use `LandscapeDirection.LEFT` instead of `"LEFT"` string
- **State consistency**: If state seems inconsistent, check that you're using the correct API methods
