# Native Usage Guide

This guide explains how to use react-native-orientation-turbo natively in iOS and Android applications, including restrictions, best practices, and architectural considerations.

## Overview

react-native-orientation-turbo provides both **React Native** and **Native** APIs for orientation control. This allows you to:

- **Control orientation before React Native loads** (early locking)
- **Integrate with native iOS/Android code** (ViewControllers, Activities)
- **Maintain consistent orientation state** between native and React Native contexts
- **Use orientation controls in pure native apps** (without React Native)

---

## iOS Native Usage

### Architecture

The iOS implementation provides a clean, protocol-based API that separates concerns:

```
┌─────────────────────────────────────┐
│           OrientationTurbo          │ ← Public API Entry Point
│                .shared              │
└─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────┐
│        OrientationTurboPublic       │ ← Clean Protocol Interface  
│              Protocol               │
└─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────┐
│       OrientationTurboShared        │ ← Protocol Implementation for native integration
│                                     │
└─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────┐
│       OrientationTurboImpl          │ ← Internal Implementation
│        (Full Features)              │
└─────────────────────────────────────┘
```

### Basic iOS Integration

#### 1. AppDelegate Integration (Required)

**Import and setup in `AppDelegate.swift`:**

```swift
import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import OrientationTurbo

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  
  func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
    
    // Optional: Lock orientation before React Native loads
    OrientationTurbo.shared.lockToPortrait()
    
    // Your React Native setup...
    return true
  }
  
  // REQUIRED: This method is essential for orientation control
  func application(_ application: UIApplication, supportedInterfaceOrientationsFor window: UIWindow?) -> UIInterfaceOrientationMask {
    return OrientationTurbo.shared.getSupportedInterfaceOrientations()
  }
}
```

#### 2. Available iOS Native Methods

```swift
// Get the shared controller instance
let orientationController = OrientationTurbo.shared

// Orientation locking
orientationController.lockToPortrait()                    // Lock to portrait
orientationController.lockToPortrait("UPSIDE_DOWN")       // Lock to upside-down portrait (iPad)
orientationController.lockToLandscape("LEFT")             // Lock to landscape left
orientationController.lockToLandscape("RIGHT")            // Lock to landscape right
orientationController.unlockAllOrientations()             // Allow all orientations

// Orientation status
let currentOrientation = orientationController.getCurrentOrientation()  // String
let isLocked = orientationController.isLocked()                        // Bool

// Supported orientations (for AppDelegate)
let supportedMask = orientationController.getSupportedInterfaceOrientations()  // UIInterfaceOrientationMask
```

#### 3. UIViewController Integration

```swift
import UIKit
import OrientationTurbo

class MyViewController: UIViewController {
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        // Lock to portrait when this view appears
        OrientationTurbo.shared.lockToPortrait()
    }
    
    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        
        // Optional: Lock orientation for this specific view
        OrientationTurbo.shared.lockToLandscape("LEFT")
    }
    
    override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)
        
        // Optional: Restore orientation freedom
        OrientationTurbo.shared.unlockAllOrientations()
    }
    
    @IBAction func toggleOrientation(_ sender: UIButton) {
        if OrientationTurbo.shared.isLocked() {
            OrientationTurbo.shared.unlockAllOrientations()
            sender.setTitle("Lock Portrait", for: .normal)
        } else {
            OrientationTurbo.shared.lockToPortrait()
            sender.setTitle("Unlock", for: .normal)
        }
    }
}
```

### iOS Native Listening to Orientation Changes

For native iOS code that needs to respond to orientation changes, use standard iOS patterns:

```swift
import UIKit
import OrientationTurbo

class OrientationAwareViewController: UIViewController {
    
    override func viewDidLoad() {
        super.viewDidLoad()
        setupOrientationObserver()
    }
    
    private func setupOrientationObserver() {
        // Standard iOS approach - recommended for native code
        NotificationCenter.default.addObserver(
            forName: UIDevice.orientationDidChangeNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            self?.handleOrientationChange()
        }
        
        // Start generating notifications
        UIDevice.current.beginGeneratingDeviceOrientationNotifications()
    }
    
    private func handleOrientationChange() {
        let currentOrientation = OrientationTurbo.shared.getCurrentOrientation()
        let isLocked = OrientationTurbo.shared.isLocked()
        
        print("Orientation changed to: \(currentOrientation), Locked: \(isLocked)")
        
        // Update your UI based on orientation
        updateUIForOrientation(currentOrientation)
    }
    
    private func updateUIForOrientation(_ orientation: String) {
        switch orientation {
        case "PORTRAIT":
            // Update UI for portrait
            break
        case "LANDSCAPE_LEFT", "LANDSCAPE_RIGHT":
            // Update UI for landscape
            break
        default:
            break
        }
    }
    
    deinit {
        NotificationCenter.default.removeObserver(self)
        UIDevice.current.endGeneratingDeviceOrientationNotifications()
    }
}
```

### iOS Restrictions and Limitations

#### 1. **AppDelegate Method Required**
```swift
// THIS IS MANDATORY - Without this, orientation locking won't work
func application(_ application: UIApplication, supportedInterfaceOrientationsFor window: UIWindow?) -> UIInterfaceOrientationMask {
    return OrientationTurbo.shared.getSupportedInterfaceOrientations()
}
```

#### 2. **iOS Version Differences**
- **iOS 16+**: Uses modern `UIWindowScene.requestGeometryUpdate`
- **iOS 15 and below**: Uses legacy orientation APIs
- **iPad**: Full orientation support including upside-down
- **iPhone**: Limited upside-down support (hardware dependent)

#### 3. **Thread Safety**
- All orientation methods are thread-safe
- Internal operations are dispatched to main queue when needed
- Safe to call from background threads

#### 4. **State Persistence**
- Orientation state persists across app launches
- State is automatically synchronized with React Native context
- No manual state management required

---

## Android Native Usage

### Architecture

The Android implementation uses a shared state pattern with a dedicated state holder:

```
┌─────────────────────────────────────┐
│          OrientationTurbo           │ ← Static Methods Entry Point
│        (Public API)                 │
└─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────┐
│         OrientationState            │ ← Shared State Holder (Package-Private)
│      (Single Source of Truth)       │
└─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────┐
│       OrientationTurboModule        │ ← React Native Bridge
│         (Full Features)             │
└─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────┐
│        Core Components              │
│  • OrientationManager               │ ← Internal Architecture
│  • OrientationTracker               │
│  • OrientationEventEmitter          │
│  • OrientationSync                  │
└─────────────────────────────────────┘
```

### Basic Android Integration

#### 1. Activity Integration

```kotlin
import com.orientationturbo.OrientationTurbo

class MainActivity : ReactActivity() {
    
    override fun onCreate(savedInstanceState: Bundle?) {
        // Lock orientation BEFORE React Native loads
        OrientationTurbo.lockToPortrait(this)
        
        // Call super AFTER orientation locking
        super.onCreate(savedInstanceState)
    }
    
    override fun onResume() {
        super.onResume()
        
        // Optional: Lock orientation when activity resumes
        OrientationTurbo.lockToLandscape(this, LandscapeDirection.LEFT)
    }
    
    override fun onPause() {
        super.onPause()
        
        // Optional: Unlock when activity pauses
        OrientationTurbo.unlockAllOrientations(this)
    }
}
```

#### 2. Available Android Native Methods

```kotlin
import com.orientationturbo.OrientationTurbo
import com.orientationturbo.enums.LandscapeDirection

// Orientation locking
OrientationTurbo.lockToPortrait(activity)                           // Lock to portrait
OrientationTurbo.lockToLandscape(activity, LandscapeDirection.LEFT) // Lock to landscape left  
OrientationTurbo.lockToLandscape(activity, LandscapeDirection.RIGHT)// Lock to landscape right
OrientationTurbo.unlockAllOrientations(activity)                    // Allow all orientations

// Orientation status (NEW - now available in static context)
val currentOrientation = OrientationTurbo.getCurrentOrientation()    // String
val isLocked = OrientationTurbo.isLocked()                         // Boolean
val lockedOrientation = OrientationTurbo.getLockedOrientation()     // Orientation enum
val deviceOrientation = OrientationTurbo.getDeviceOrientation()     // Orientation enum
```

#### 3. Fragment Integration

```kotlin
import androidx.fragment.app.Fragment
import com.orientationturbo.OrientationTurbo
import com.orientationturbo.enums.LandscapeDirection

class MyFragment : Fragment() {
    
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        // Lock orientation for this fragment
        requireActivity().let { activity ->
            OrientationTurbo.lockToPortrait(activity)
        }
    }
    
    override fun onDestroyView() {
        super.onDestroyView()
        
        // Restore orientation freedom when fragment is destroyed
        requireActivity().let { activity ->
            OrientationTurbo.unlockAllOrientations(activity)
        }
    }
    
    private fun checkOrientationStatus() {
        val isLocked = OrientationTurbo.isLocked()
        val currentOrientation = OrientationTurbo.getCurrentOrientation()
        
        Log.d("Fragment", "Orientation locked: $isLocked, Current: $currentOrientation")
    }
}
```

#### 4. Service/Background Integration

```kotlin
import android.app.Service
import com.orientationturbo.OrientationTurbo

class MyService : Service() {
    
    override fun onCreate() {
        super.onCreate()
        
        // Note: Orientation locking from services has limited effect
        // and is generally not recommended. Requires activity context.
        
        // Check orientation status (this works from any context)
        val isLocked = OrientationTurbo.isLocked()
        val orientation = OrientationTurbo.getCurrentOrientation()
        Log.d("Service", "Current orientation: $orientation, Locked: $isLocked")
    }
}
```

### Android Restrictions and Limitations

#### 1. **Activity Context Required for Locking**
Orientation locking methods require an Activity context:
```kotlin
// ✅ Correct - with Activity context
OrientationTurbo.lockToPortrait(activity)

// ❌ Incorrect - context needed
// OrientationTurbo.lockToPortrait() // This won't work
```

#### 2. **Status Methods Available Everywhere**
New shared state architecture provides status methods in any context:
- ✅ `getCurrentOrientation()` - available everywhere
- ✅ `isLocked()` - available everywhere  
- ✅ `getLockedOrientation()` - available everywhere
- ✅ `getDeviceOrientation()` - available everywhere

#### 3. **AndroidManifest.xml Sync**
The library automatically syncs with your manifest settings:

```xml
<!-- This will be automatically detected and synced -->
<activity
    android:name=".MainActivity"
    android:screenOrientation="portrait">
    <!-- Library will respect this setting on initialization -->
</activity>
```

#### 4. **Shared State Persistence**
- Orientation state persists across Activity lifecycle events
- State is automatically synchronized between native and React Native contexts
- No manual state management required
- State survives app restarts and React Native reloads

#### 5. **Hardware Limitations**
- Some Android devices don't support certain orientations
- Upside-down orientation rarely supported on phones
- Tablet devices generally have better orientation support

---

## Best Practices

### 1. **Early Locking Pattern**

**iOS AppDelegate:**
```swift
func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
    // Lock BEFORE React Native loads
    OrientationTurbo.shared.lockToPortrait()
    
    // Then start React Native
    // ...React Native setup
    return true
}
```

**Android MainActivity:**
```kotlin
override fun onCreate(savedInstanceState: Bundle?) {
    // Lock BEFORE super.onCreate() 
    OrientationTurbo.lockToPortrait(this)
    
    // Then initialize React Native
    super.onCreate(savedInstanceState)
}
```

### 2. **State Synchronization**
- Native orientation locks are automatically synced with React Native context
- No manual synchronization required
- State persists across app lifecycle events

### 3. **Error Handling**

**iOS:**
```swift
// All methods are safe - no error handling needed
OrientationTurbo.shared.lockToPortrait()

// Check current state if needed
if OrientationTurbo.shared.isLocked() {
    print("Orientation is currently locked")
}
```

**Android:**
```kotlin
// Static methods are safe and now provide status feedback
try {
    OrientationTurbo.lockToPortrait(activity)
    
    // Check if operation was successful
    if (OrientationTurbo.isLocked()) {
        Log.d("Orientation", "Successfully locked to: ${OrientationTurbo.getCurrentOrientation()}")
    }
} catch (e: Exception) {
    // Handle any unexpected errors
    Log.e("Orientation", "Failed to lock orientation", e)
}
```

### 4. **Testing Orientation Changes**

**iOS Testing:**
```swift
class OrientationTests: XCTestCase {
    
    func testOrientationLocking() {
        // Test orientation locking
        OrientationTurbo.shared.lockToPortrait()
        XCTAssertTrue(OrientationTurbo.shared.isLocked())
        
        // Test unlocking
        OrientationTurbo.shared.unlockAllOrientations()
        XCTAssertFalse(OrientationTurbo.shared.isLocked())
    }
}
```

**Android Testing:**
```kotlin
@Test
fun testOrientationLocking() {
    // Lock orientation and verify status
    OrientationTurbo.lockToPortrait(activity)
    
    // Now we can test orientation status directly
    assertTrue(OrientationTurbo.isLocked())
    assertEquals("PORTRAIT", OrientationTurbo.getCurrentOrientation())
    assertEquals(Orientation.PORTRAIT, OrientationTurbo.getLockedOrientation())
    
    // Test unlocking
    OrientationTurbo.unlockAllOrientations(activity)
    assertFalse(OrientationTurbo.isLocked())
}
```

---

## Advanced Integration Patterns

### 1. **Custom Orientation Controller (iOS)**

```swift
protocol CustomOrientationDelegate: AnyObject {
    func orientationDidChange(_ orientation: String)
    func orientationLockDidChange(_ isLocked: Bool)
}

class CustomOrientationController {
    weak var delegate: CustomOrientationDelegate?
    
    private let orientationController = OrientationTurbo.shared
    
    init() {
        setupObservers()
    }
    
    private func setupObservers() {
        NotificationCenter.default.addObserver(
            forName: UIDevice.orientationDidChangeNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            guard let self = self else { return }
            let orientation = self.orientationController.getCurrentOrientation()
            self.delegate?.orientationDidChange(orientation)
        }
    }
    
    func lockToPortrait() {
        orientationController.lockToPortrait()
        delegate?.orientationLockDidChange(true)
    }
    
    func unlockAll() {
        orientationController.unlockAllOrientations()
        delegate?.orientationLockDidChange(false)
    }
}
```

### 2. **Android Shared State Integration**

```kotlin
class OrientationAwareActivity : AppCompatActivity() {
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Lock orientation early
        OrientationTurbo.lockToPortrait(this)
        
        // Set up orientation monitoring
        setupOrientationMonitoring()
    }
    
    private fun setupOrientationMonitoring() {
        // Monitor orientation changes using standard Android APIs
        val orientationEventListener = object : OrientationEventListener(this) {
            override fun onOrientationChanged(orientation: Int) {
                // Get current state from shared state
                val currentOrientation = OrientationTurbo.getCurrentOrientation()
                val isLocked = OrientationTurbo.isLocked()
                
                updateUI(currentOrientation, isLocked)
            }
        }
        
        if (orientationEventListener.canDetectOrientation()) {
            orientationEventListener.enable()
        }
    }
    
    private fun updateUI(orientation: String, isLocked: Boolean) {
        Log.d("Activity", "Orientation: $orientation, Locked: $isLocked")
        // Update your UI based on orientation state
    }
    
    fun toggleOrientation() {
        if (OrientationTurbo.isLocked()) {
            OrientationTurbo.unlockAllOrientations(this)
        } else {
            OrientationTurbo.lockToPortrait(this)
        }
        
        // State is immediately available
        val newState = OrientationTurbo.isLocked()
        Log.d("Activity", "New lock state: $newState")
    }
}
```

### 3. **React Native Bridge Integration**

Both platforms automatically integrate with React Native when the library is installed. Native orientation locks are seamlessly synchronized with the React Native context.

**Key Benefits of Android Shared State Architecture:**
- **Immediate consistency**: Changes made in native code are instantly visible to React Native
- **No synchronization delays**: State updates happen synchronously
- **Persistent state**: Orientation settings survive app lifecycle events and React Native reloads
- **Thread-safe**: All state operations are thread-safe and can be called from any context

---

## Troubleshooting

### Common Issues:

#### iOS Issues:
1. **Orientation not locking**: Ensure `supportedInterfaceOrientationsFor` is implemented in AppDelegate
2. **Build errors**: Clean build and reinstall pods
3. **Runtime crashes**: Verify import statements and API usage

#### Android Issues:
1. **Static methods not found**: Ensure proper import and gradle sync
2. **Orientation not applying**: Call methods from Activity lifecycle methods
3. **Manifest conflicts**: Check AndroidManifest.xml orientation settings

### Performance Considerations:
- **iOS**: All operations are highly optimized and thread-safe
- **Android**: Static method calls are lightweight and fast
- **Memory**: Both implementations use efficient singleton patterns
- **Battery**: No continuous polling - event-driven architecture

---

## Summary

The native APIs provide powerful orientation control capabilities:

**iOS**: Full-featured protocol-based API with status checking and thread safety
**Android**: Efficient static methods with shared state architecture providing both orientation control and status checking

Both platforms integrate seamlessly with React Native and provide consistent orientation state management across native and JavaScript contexts. The new Android shared state architecture ensures perfect synchronization between native and React Native contexts without any manual state management. 