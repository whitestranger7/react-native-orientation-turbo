# Migration Guide to v2.2.0

This guide helps you migrate from any previous version to v2.2.0, which introduces significant iOS architecture improvements and API changes.

## Overview of Changes

Version 2.2.0 introduces a major refactor of the iOS codebase with breaking changes for native iOS usage, while **React Native usage remains unchanged**.

### What's Changed:
- **iOS Native API**: `OrientationTurboImpl.shared` changed to `OrientationTurbo.shared`
- **React Native**: No changes required for JavaScript usage
- **Android**: No changes required

---

## Migration Instructions

### iOS Native Usage (Breaking Changes)

If you're using native iOS methods in your `AppDelegate.swift` or other iOS code, you need to update the API calls.

#### Before v2.2.0:
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

#### After v2.2.0:
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

#### Complete Migration Example:

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

## Quick Migration Checklist

### For React Native Usage:
- No changes required - your code continues to work

### For iOS Native Usage:
- Search your iOS code for `OrientationTurboImpl.shared`
- Replace all instances with `OrientationTurbo.shared`
- Test that orientation locking still works in your app
- Clean and rebuild your iOS app

### For Android Native Usage:
- No changes required - your code continues to work

## Troubleshooting

### Common Issues:

#### 1. "Unrecognized selector sent to class" Error
```
+[OrientationTurboImpl shared]: unrecognized selector sent to class
```
**Solution**: Update your iOS code to use `OrientationTurbo.shared` instead of `OrientationTurboImpl.shared`

#### 2. Build Errors After Migration
**Solution**: 
1. Clean your iOS build: `cd ios && xcodebuild clean`
2. Remove Pods: `cd ios && rm -rf Pods Podfile.lock`
3. Reinstall: `pod install`
4. Clean React Native cache: `npx react-native start --reset-cache`

#### 3. Orientation Not Working After Migration
**Solution**: Verify you've updated all instances in your `AppDelegate.swift`:
- Updated `getSupportedInterfaceOrientations()` call
- Updated any early locking calls
- Imported `OrientationTurbo` (not `OrientationTurboImpl`)

### Need Help?

If you encounter issues during migration:
1. Check this migration guide again
2. Review the [Native Usage Guide](NATIVE_USAGE.md)
3. Check our [Advanced Usage documentation](ADVANCED_USAGE.md)
4. Open an issue on GitHub with your specific problem

## Summary

The migration is straightforward and the new architecture provides a much cleaner foundation for future development! 