# Manual Testing

Orientation behaviour depends on the device, the OS version and how the app is presented, so unit tests can't cover it.
Before merging a change to native code, the build setup or the public API, run the relevant tests below with the
[example app](../example) on the devices listed.

The example app opens a **test screen** that exercises the whole API. Its `Info.plist` sets `UIRequiresFullScreen`, because iPadOS ignores orientation locks for resizable apps:

- **Live state:** sampled UI orientation (`getCurrentOrientation()`), last physical event and live window size, `isLocked()`, `getDeviceAutoRotateStatus()`, the last value of each event, tracking on/off
- **Lock:** Portrait · Portrait upside down · Landscape left · Landscape right · Unlock all
- **Tracking:** Start / Stop
- **Queries:** each synchronous call, with the result written to the log
- **Scenarios:** Modal with default orientations, Modal with all orientations, delayed landscape lock
- **Event log:** every action, result and event, newest first, with millisecond timestamps

## Results

The tables below specify required coverage; ✅ means **run this case**, not passed.
Record outcomes in [Release verification](RELEASE_VERIFICATION.md), including the exact commit/package, device/OS, RN version and build SDK/toolchain.
That record separates build/unit-test evidence from manual and consumer runtime results. Missing results remain **Unverified**.

## iOS orientation defaults regression

On an iPhone test build, temporarily set `UISupportedInterfaceOrientations` in the example's Info.plist to portrait only, keeping the required AppDelegate callback. Rebuild and launch. Landscape left and right locks must still rotate the UI and report the requested lock. On an iPhone without a Home button, an upside-down request must leave the previous lock unchanged. Repeat the modal tests T9/T10 below, then unlock: `isLocked()` becomes false and the library returns its `.all` mask rather than restoring portrait-only plist defaults. Restore the plist after testing.

This distinguishes app defaults from device restrictions and runtime controller masks. Check the displayed UI orientation as well as the requested lock state.

## Devices

| ID | Device | Example | How to run |
|---|---|---|---|
| **D1** | iPhone with Face ID | iPhone 16 Pro simulator | `yarn example ios` |
| **D2** | iPad, full screen | iPad Pro 13-inch simulator (check its iPadOS version: the M4 one may be on 18.x) | `yarn example ios --simulator "iPad Pro 13-inch (M4)"` |
| **D3** | iPad, windowed (iPadOS 26+) | same simulator, app resized into a window | as D2, then resize the window |
| **D4** | Android phone | Pixel emulator, API 36+ | `yarn example android` |
| **D5** | Android tablet or foldable (smallest width ≥ 600dp) | Pixel Tablet / Pixel Fold emulator, API 36+ (create one in Android Studio's Device Manager) | `yarn example android` |

**Rotating the device**
- iOS simulator: **⌘←** / **⌘→**, or **Device → Rotate Left / Right**
- Android emulator: the rotate buttons in the emulator toolbar. Turn on **Auto-rotate** in Quick Settings first, otherwise the system never rotates an unlocked app.

## Test cases

Start every run from a fresh launch. Use **Clear log** between test cases so the log shows only the current test.

The log samples UI orientation at each physical callback. After the UI settles, tap **Refresh** for a new sample.
Window size updates independently. Neither a physical event nor the delayed refresh signals that rotation has finished.

| ID | Test | Steps | Expected |
|---|---|---|---|
| **T1** | Launch with native lock | Launch the app; rotate the device | Opens in portrait (locked natively before React Native starts). Live state: `PORTRAIT`, `isLocked() = true`. The UI doesn't rotate. |
| **T2** | Unlock and rotate | **Unlock all**; rotate the device to each side | `onLockOrientationChange` with `isLocked=false`. With system auto-rotate enabled and the orientation supported, the UI follows the device. Physical rotations log `onOrientationChange` independently of UI transition timing. |
| **T3** | Lock to portrait | Rotate the device to landscape; tap **Portrait** | The UI rotates to portrait and stays there when rotating the device. Lock event `isLocked=true, orientation=PORTRAIT`. |
| **T4** | Lock to landscape | Tap **Landscape left**, then **Landscape right**; then **Unlock all** and turn the device clockwise, then counter-clockwise | **Landscape left** puts the device's bottom edge (home indicator / navigation bar side) on the **left**, **Landscape right** on the right, on iOS and Android alike. Lock events, `getCurrentOrientation()` and `onOrientationChange` all use the same names: turning the device clockwise gives `LANDSCAPE_LEFT`, counter-clockwise `LANDSCAPE_RIGHT`. |
| **T5** | Lock to portrait upside down | **Unlock all**, then tap **Portrait upside down** | iPad, Android, iPhones with a Home button: the UI turns upside down, lock event `PORTRAIT_UPSIDE_DOWN`. iPhones without a Home button (iOS rule): nothing happens, `isLocked()` stays `false`, no lock event, a warning in the Xcode console. |
| **T6** | Lock events | Tap every lock button, then **Unlock all**. Repeat rapidly, ending with **Unlock all**; wait for queued events to settle. | Exactly **one** `onLockOrientationChange` per tap, in request order, with matching `isLocked` / `orientation`. Live state matches the last event after the queue settles; during the burst, synchronous state may already reflect a later request. |
| **T7** | Tracking on/off | **Unlock all**; **Stop tracking**; rotate; **Start tracking**; rotate | No `onOrientationChange` events while stopped; events again after starting. |
| **T8** | Queries | Tap each button in **Queries** | Results in the log match Live state. `getDeviceAutoRotateStatus()`: an object on Android, `null` on iOS. On Android, toggling system auto-rotate changes `isAutoRotateEnabled`. `canLockOrientation()`: `true` on iPhone, iPad (the example sets `UIRequiresFullScreen`) and Android phones; `false` on an Android 16+ tablet / unfolded foldable (the example targets API 36). |
| **T9** | Lock inside a Modal | **Open Modal (all orientations)**; tap each lock button once | Each **first** tap rotates the UI. Then repeat with **Open Modal (default orientations)** (the RN default is portrait-only on iOS). |
| **T10** | Open a Modal while locked | Tap **Landscape right**; **Open Modal (default orientations)**; close it; repeat with **Open Modal (all orientations)** | The app **doesn't crash**. iOS: the default Modal (portrait-only) is shown in portrait while the lock is suspended, and the app rotates back to landscape after closing it; the all-orientations Modal stays in landscape. `isLocked()` stays `true` throughout. |
| **T11** | Delayed lock | Tap **Landscape right in 1s**; after it rotates, tap **Unlock all**; rotate the device | The UI rotates once after ~1 s. **Unlock all** unlocks right away (`isLocked=false`) and the UI follows the device again. |
| **T12** | Background and return | Lock to landscape; send the app to the background; bring it back. Then **Unlock all**, background the app, rotate the device, bring it back, rotate again | The lock is still applied; Live state unchanged. No `onOrientationChange` events while in the background (Android pauses the sensor); events arrive again after returning. |
| **T13** | Large screens / windowed | On D3 and D5, run T3 and T4 | Write down what happens. On iPadOS 26 the example opens as a window shaped like the lock instead of rotating the screen. On an Android 16+ large screen locks are ignored (the example targets API 36), `canLockOrientation()` is `false`, `getCurrentOrientation()` shows what's on screen, and `isLocked()` stays `true` (a lock was requested); on a folded foldable both work. |
| **T14** | Native-side lock reaches JS (iOS) | Run from Xcode; **Debug → Pause**; in the debugger console run `expr -l swift -- import OrientationTurbo; OrientationTurbo.shared.lockToLandscape("LEFT")`; **Continue** | The UI rotates, and the log shows exactly **one** `onLockOrientationChange` with `isLocked=true, orientation=LANDSCAPE_LEFT`. |
| **T15** | Stable orientation events (Android) | **Unlock all**, hold the device in landscape, then: tilt it ~20° towards portrait and back; shake it; rotate it slowly to portrait. Briefly enter another zone for less than 200 ms, then move into the gap between zones (around 45°) or hold the device flat. Re-enter the new zone and hold. Repeat while stopping tracking or backgrounding the app during the wait. | Tilts staying in the current zone and brief excursions lasting less than 200 ms produce **no** `onOrientationChange` events. Sustained motion into another zone can produce an event. No delayed event is emitted for an abandoned zone, a flat/unknown reading, or after tracking stops/pauses. Re-entry requires a fresh ~200 ms before **one** event is emitted. For rc.0, sensor noise crossing a zone edge (±30°) repeatedly cancels the wait: a device held near that edge may emit no event even if Android rotates the UI. This is the intended strict stability rule. On the emulator use **Extended controls → Virtual sensors** to set the angles. |
| **T16** | UI orientation with tracking stopped (iOS) | **Unlock all**; **Stop tracking**; rotate and wait for the UI transition to finish; query `getCurrentOrientation()` once. Background the app, rotate, return and repeat. Check the initial UI read in the event log after a landscape launch. | The first query reports the displayed UI orientation without a warm-up read. Repeat with SceneDelegate and AppDelegate-only apps (SDK older than 27), including iOS 15 when available. A query before a launch rotation finishes may still report portrait. A missing/unknown scene retains the last known UI orientation (initially `PORTRAIT`); face-up/down readings do not replace it. |
| **T17** | Pending requests and Activity recreation (Android) | In a native test fixture, issue locks and then an unlock before the React Native Activity attaches; attach/resume it. Repeat ending with landscape. Use a portrait manifest default and repeat the early unlock. Then recreate the Activity (for example, enable **Don't keep activities**, background and return); repeat with a request queued immediately before recreation. Finally, lock to portrait, set `requestedOrientation` to landscape from other native code (like a video player), background the app and return. | Only the latest pending lock/unlock is applied to the current live Activity. An explicit unlock survives manifest initialization. Each explicit request emits one lock event in order; attachment/resume/recreation emits no extra lock event. The destroyed Activity is not updated. Returning from the background leaves the other code's landscape in place. |
| **T18** | Independent modal masks in two scenes (iOS) | In an iPad fixture supporting multiple foreground scenes, forward the AppDelegate callback's window. Lock landscape; present a portrait-only modal in one scene and a landscape-compatible modal in the other. Then make both modals portrait-only; dismiss them one at a time. Also dismiss and immediately present another incompatible modal. | Each callback returns a mask compatible with the modal in its own window. The requested lock remains set. Dismissing one modal restores its scene without restoring the other scene's suspended lock; a replacement modal remains protected. On resizable iPad windows, check masks and scene targeting even if the system ignores geometry requests. Repeat T10 in a single-scene app; keep the no-argument API as a compatibility check. |
| **T19a** | Physical events with a lock | Start tracking in portrait; lock portrait. Rotate to landscape and hold for one second. Compare the physical event and UI-at-callback log; after rotation settles, tap **Refresh**. Unlock afterwards. | Physical events can report landscape while the UI stays portrait. If the system ignores locks, record the displayed UI instead. |
| **T19b** | Auto-rotate off (Android) | Unlock and hold portrait. Disable system auto-rotate; rotate to landscape and hold, declining any rotate suggestion. Compare the physical event, UI query and window size. Restore auto-rotate. | The physical event can report landscape while the UI remains portrait. Window size describes available layout space, not physical direction. |
| **T19c** | Slow rotation | Unlock, enable system auto-rotate and start tracking. Slowly rotate landscape to portrait. Compare the UI-at-callback log with **Refresh** after the transition. | A physical event can precede or follow UI rotation. Matching values or timestamps are not required. Android's ~200 ms rule filters sensor changes (T15); it does not synchronize with the UI. |

## What to run on which device

✅ run · — not applicable

| Test | D1 iPhone | D2 iPad | D3 iPad windowed | D4 Android phone | D5 Android large screen |
|---|---|---|---|---|---|
| T1 Launch with native lock | ✅ | ✅ | — | ✅ | ✅ |
| T2 Unlock and rotate | ✅ | ✅ | — | ✅ | ✅ |
| T3 Lock to portrait | ✅ | ✅ | ✅ | ✅ | ✅ |
| T4 Lock to landscape | ✅ | ✅ | ✅ | ✅ | ✅ |
| T5 Portrait upside down | ✅ | ✅ | — | ✅ | — |
| T6 Lock events | ✅ | ✅ | — | ✅ | — |
| T7 Tracking on/off | ✅ | ✅ | — | ✅ | — |
| T8 Queries | ✅ | — | — | ✅ | — |
| T9 Lock inside a Modal | ✅ | ✅ | — | ✅ | — |
| T10 Open a Modal while locked | ✅ | ✅ | — | ✅ | — |
| T11 Delayed lock | ✅ | ✅ | — | ✅ | — |
| T12 Background and return | ✅ | ✅ | — | ✅ | — |
| T13 Large screens / windowed | — | — | ✅ | — | ✅ |
| T14 Native-side lock reaches JS | ✅ | ✅ | — | — | — |
| T15 Stable orientation events | — | — | — | ✅ | ✅ |
| T16 UI orientation with tracking stopped | ✅ | ✅ | — | — | — |
| T17 Pending requests and Activity recreation | — | — | — | ✅ | ✅ |
| T18 Independent modal masks in two scenes | — | ✅ | ✅ | — | — |
| T19a Physical events with a lock | ✅ | ✅ | ✅ | ✅ | ✅ |
| T19b Auto-rotate off | — | — | — | ✅ | ✅ |
| T19c Slow rotation | ✅ | ✅ | ✅ | ✅ | ✅ |

For a small change, run the affected tests on D1 and D4 at least. Before a release, run the whole matrix.

### Multi-window (manual)

- **Android:** open the example, open **Recents**, long-press the app icon → **Split screen**, pick a second app. Lock and unlock in the example and note what happens (Android ignores orientation requests for apps in split screen). Keep the display rotation fixed and resize the app across portrait and landscape window shapes: `getCurrentOrientation()` and physical-event directions must remain consistent. Repeat on a tablet with a landscape natural orientation.
- **iPad (iPadOS 26+):** turn on **Settings → Multitasking & Gestures → Windowed Apps**, open the example next to another app, run T3 / T4 and note the result.

### Build checks

- **16 KB page size (Android):** build the release APK (`cd example/android && ./gradlew app:assembleRelease`), then check every native library's `LOAD` alignment is `0x4000` or more with the NDK's `llvm-readelf -lW lib/arm64-v8a/*.so`, and run `zipalign -c -P 16 -v 4 app-release.apk`. The `google_apis_playstore_ps16k` system images use 16 KB pages.

## Recorded issues and remaining limits

These rows record earlier failures and remaining expectations. Re-run the matching tests on the release candidate before marking them verified.

| Test | Platform | Status / limitation |
|---|---|---|
| T5 | Android | Fixed in v3 ([#42](https://github.com/whitestranger7/react-native-orientation-turbo/issues/42)); verify upside-down reporting and locking on the release-candidate device build. |
| T15, T19a–c | Android / iOS | [#20](https://github.com/whitestranger7/react-native-orientation-turbo/issues/20): Android now filters brief sensor changes; device verification of the jitter scenarios is pending. Physical events can still precede UI rotation or differ from it, by contract on both platforms. UI-transition synchronization is not implemented. |

## Reporting a problem

Include:
- device and OS version (the test screen shows both under its title), React Native version
- the test ID and the exact steps
- a copy or screenshot of the **event log**
- for crashes: the message from the Xcode console or `adb logcat`
