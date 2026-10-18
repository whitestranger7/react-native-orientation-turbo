# Manual Testing

Orientation behaviour depends on the device, the OS version and how the app is presented, so unit tests can't cover it.
Before merging a change to native code, the build setup or the public API, run the relevant tests below with the
[example app](../example) on the devices listed.

The example app opens a **test screen** that exercises the whole API:

- **Live state:** `getCurrentOrientation()`, `isLocked()`, `getDeviceAutoRotateStatus()`, the last value of each event, tracking on/off
- **Lock:** Portrait · Portrait upside down · Landscape left · Landscape right · Unlock all
- **Tracking:** Start / Stop
- **Queries:** each synchronous call, with the result written to the log
- **Scenarios:** Modal with default orientations, Modal with all orientations, delayed landscape lock
- **Event log:** every action, result and event, newest first, with millisecond timestamps

## Devices

| ID | Device | Example | How to run |
|---|---|---|---|
| **D1** | iPhone with Face ID | iPhone 16 Pro simulator | `yarn example ios` |
| **D2** | iPad, full screen | iPad Pro 13-inch (M4) simulator | `yarn example ios --simulator "iPad Pro 13-inch (M4)"` |
| **D3** | iPad, windowed (iPadOS 26+) | same simulator, app resized into a window | as D2, then resize the window |
| **D4** | Android phone | Pixel emulator, API 36+ | `yarn example android` |
| **D5** | Android tablet or foldable (smallest width ≥ 600dp) | Pixel Tablet / Pixel Fold emulator, API 36+ | `yarn example android` |

**Rotating the device**
- iOS simulator: **⌘←** / **⌘→**, or **Device → Rotate Left / Right**
- Android emulator: the rotate buttons in the emulator toolbar. Turn on **Auto-rotate** in Quick Settings first, otherwise the system never rotates an unlocked app.

## Test cases

Start every run from a fresh launch. Use **Clear log** between test cases so the log shows only the current test.

| ID | Test | Steps | Expected |
|---|---|---|---|
| **T1** | Launch with native lock | Launch the app; rotate the device | Opens in portrait (locked natively before React Native starts). Live state: `PORTRAIT`, `isLocked() = true`. The UI doesn't rotate. |
| **T2** | Unlock and rotate | **Unlock all**; rotate the device to each side | `onLockOrientationChange` with `isLocked=false`. The UI follows the device; each rotation logs `onOrientationChange` with the new orientation. |
| **T3** | Lock to portrait | Rotate the device to landscape; tap **Portrait** | The UI rotates to portrait and stays there when rotating the device. Lock event `isLocked=true, orientation=PORTRAIT`. |
| **T4** | Lock to landscape | Tap **Landscape left**, then **Landscape right** | The UI rotates to each side and stays there. Lock events carry `LANDSCAPE_LEFT` / `LANDSCAPE_RIGHT`. The same button must rotate to the **same physical side** on iOS and Android. |
| **T5** | Lock to portrait upside down | Tap **Portrait upside down** | iPad: the UI rotates upside down. Face ID iPhones don't support upside down (iOS rule), and the library must not report a lock it can't apply. |
| **T6** | Lock events | Tap every lock button, then **Unlock all** | Exactly **one** `onLockOrientationChange` per tap, with matching `isLocked` / `orientation`. Live state matches the last event. |
| **T7** | Tracking on/off | **Unlock all**; **Stop tracking**; rotate; **Start tracking**; rotate | No `onOrientationChange` events while stopped; events again after starting. |
| **T8** | Queries | Tap each button in **Queries** | Results in the log match Live state. `getDeviceAutoRotateStatus()`: an object on Android, `null` on iOS. On Android, toggling system auto-rotate changes `isAutoRotateEnabled`. |
| **T9** | Lock inside a Modal | **Open Modal (all orientations)**; tap each lock button once | Each **first** tap rotates the UI. Then repeat with **Open Modal (default orientations)** (the RN default is portrait-only on iOS). |
| **T10** | Open a Modal while locked | Tap **Landscape right**; **Open Modal (default orientations)**; close it; repeat with **Open Modal (all orientations)** | The app **doesn't crash**. The Modal opens; the lock state is unchanged after closing. |
| **T11** | Delayed lock | Tap **Landscape right in 1s**; after it rotates, tap **Unlock all**; rotate the device | The UI rotates once after ~1 s. **Unlock all** unlocks right away (`isLocked=false`) and the UI follows the device again. |
| **T12** | Background and return | Lock to landscape; send the app to the background; bring it back. Then **Unlock all**, background the app, rotate the device, bring it back, rotate again | The lock is still applied; Live state unchanged. No `onOrientationChange` events while in the background (Android pauses the sensor); events arrive again after returning. |
| **T13** | Large screens / windowed | On D3 and D5, run T3 and T4 | Write down what happens. iPadOS windowed mode and Android 16+ (targetSdk 36) large screens can ignore orientation locks; the library should report that instead of claiming the lock applied. |
| **T14** | Native-side lock reaches JS (iOS) | Run from Xcode; **Debug → Pause**; in the debugger console run `expr -l swift -- import OrientationTurbo; OrientationTurbo.shared.lockToLandscape("LEFT")`; **Continue** | The UI rotates, and the log shows exactly **one** `onLockOrientationChange` with `isLocked=true, orientation=LANDSCAPE_LEFT`. |

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

For a small change, run the affected tests on D1 and D4 at least. Before a release, run the whole matrix.

## Known issues (being fixed for 3.0.0)

These currently fail. Remove each row when its fix lands.

| Test | Platform | Current behaviour |
|---|---|---|
| T4 | iOS / Android | LEFT and RIGHT may not rotate to the same physical side on both platforms; on iOS, `getCurrentOrientation()` and `onOrientationChange` can disagree in landscape. |
| T4 | iPad (D2) | **Landscape left / right** has no effect. |
| T5 | iPhone (D1) | Shows portrait, but the library reports `isLocked: true` / `PORTRAIT_UPSIDE_DOWN`. |
| T5 | Android | Reports `PORTRAIT` without changing the lock. |
| T9 | iOS | The first lock inside a Modal is reported but not applied; the second tap works. |
| T10 | iOS | Opening the **default** Modal while locked to landscape crashes the app ([#19](https://github.com/whitestranger7/react-native-orientation-turbo/issues/19)). |
| T2, T7 | Android | Orientation events can flicker or arrive early around the 45° boundaries ([#20](https://github.com/whitestranger7/react-native-orientation-turbo/issues/20)). |

## Reporting a problem

Include:
- device and OS version (the test screen shows both under its title), React Native version
- the test ID and the exact steps
- a copy or screenshot of the **event log**
- for crashes: the message from the Xcode console or `adb logcat`
