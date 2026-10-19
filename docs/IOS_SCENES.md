# Migrating an older React Native app to scenes

Apps built with the **iOS 27 SDK or newer need the UIScene lifecycle to launch on iOS 27 or newer**. This is a UIKit requirement, independent of Orientation Turbo. Apps built with an older SDK can continue using their legacy lifecycle after an OS update. See [Apple TN3187](https://developer.apple.com/documentation/technotes/tn3187-migrating-to-the-uikit-scene-based-life-cycle).

React Native 0.88's template already uses scenes. For an app based on the 0.80–0.87 templates, adopt scenes or upgrade the native template. The library's `setup` command configures orientation callbacks and early locks; it does not change your lifecycle. It warns when it finds React Native starting in `AppDelegate`, without guessing which SDK your build uses. It does not validate scene configuration in customized apps.

The following single-window example uses the React Native 0.80 factory API. It keeps the iOS 15.1 deployment target and works with older supported SDKs too. Scene adoption does not require enabling multiple windows.

## Move window and React Native startup into SceneDelegate

Keep process-wide initialization in `AppDelegate.application(_:didFinishLaunchingWithOptions:)`, including any SDK initialization that must happen before scene connection. Remove its window creation and `startReactNative` call. Keep your existing `ReactNativeDelegate` class, including its `sourceURL`, `bundleURL`, and other custom overrides. It can remain in `AppDelegate.swift`; retain its existing React imports too.

Keep the library's required orientation callback in `AppDelegate`:

```swift
import UIKit
import OrientationTurbo

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  // Older RN modules still read UIApplication.shared.delegate.window.
  var window: UIWindow?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    // Keep your process-wide initialization here.
    return true
  }

  func application(_ application: UIApplication, supportedInterfaceOrientationsFor window: UIWindow?) -> UIInterfaceOrientationMask {
    return OrientationTurbo.shared.getSupportedInterfaceOrientations()
  }
}
```

Create `SceneDelegate.swift`, add it to your app target's **Compile Sources**, and replace `YourApp` below with the module name registered in `app.json`:

```swift
import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import OrientationTurbo

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?
  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard let windowScene = scene as? UIWindowScene else { return }
    let delegate = ReactNativeDelegate()
    delegate.dependencyProvider = RCTAppDependencyProvider()
    let factory = RCTReactNativeFactory(delegate: delegate)
    reactNativeDelegate = delegate
    reactNativeFactory = factory
    window = UIWindow(windowScene: windowScene)
    (UIApplication.shared.delegate as? AppDelegate)?.window = window

    // Optional: move your existing early lock here, before React Native starts.
    OrientationTurbo.shared.lockToPortrait()
    factory.startReactNative(withModuleName: "YourApp", in: window, launchOptions: nil)
  }
}
```

Keep the `AppDelegate.window` property and assign the scene window to it: older RN modules, including 0.80's `RCTDeviceInfo`, still query it during orientation changes. Removing that property can cause an `unrecognized selector` crash even after scene adoption.

This example has no deep-link or notification integration, so it passes `nil` for launch options. In a customized app, move scene-specific work to scene callbacks. Handle cold-start URLs and activities from `connectionOptions`, subsequent URLs in `scene(_:openURLContexts:)`, and activities in `scene(_:continue:)`. Preserve your existing notification and SDK startup behavior. Follow the APIs supported by your React Native version: the 0.88 template's `connectionOptions:` factory overload and scene linking helpers are not available in 0.80. Do not simply copy that newer template into an older app.

## Register the scene

Add this to the app's `Info.plist`, merging with any existing configuration:

```xml
<key>UIApplicationSceneManifest</key>
<dict>
  <key>UIApplicationSupportsMultipleScenes</key>
  <false/>
  <key>UISceneConfigurations</key>
  <dict>
    <key>UIWindowSceneSessionRoleApplication</key>
    <array>
      <dict>
        <key>UISceneConfigurationName</key>
        <string>Default Configuration</string>
        <key>UISceneDelegateClassName</key>
        <string>$(PRODUCT_MODULE_NAME).SceneDelegate</string>
      </dict>
    </array>
  </dict>
</dict>
```

Use the actual Swift module and class name if your delegate differs. A `SceneDelegate.swift` file alone does not register a scene. If you already return a scene configuration from `application(_:configurationForConnecting:options:)`, reconcile that configuration with the manifest. Keep your launch screen configuration and orientation entries; scene migration does not replace them.

## Verify launch and orientation

Rebuild, install, and launch on an iOS 27 simulator or device with the iOS 27 SDK. A successful compile does not verify lifecycle integration. Check that the React Native screen appears, the early lock applies, and runtime locks and unlocking still work. Also test background/foreground transitions and any deep links or notification entry points your app supports. Test the oldest OS and Xcode versions your app supports before shipping.

The repository tests this migration on a fresh **RN 0.80.0** consumer using the packed library:

```sh
scripts/compat-test.sh 0.80.0 --skip-android --ios-scene-smoke
```

This opt-in check migrates only the generated test app, builds Release with bundled JavaScript, and launches it without Metro on an iPhone simulator whose runtime major matches the build SDK (27 or newer). It fails if the process exits during the first 15 seconds and saves a screenshot in `logs/ios-launch.png`. Review the screenshot to verify that React Native rendered; process survival alone does not establish UI correctness. The separate Xcode 27.1 CI lane uploads these logs and the screenshot on every run. It follows the existing non-blocking policy for GitHub's preview Xcode 27 runner.
