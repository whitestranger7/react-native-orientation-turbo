# v3 release verification

Use [Manual Testing](TESTING.md) for procedures and required configurations. Results apply only to the recorded commit and installed artifact. **Unverified** means no matching candidate result has been recorded.

## Required manual coverage

| Target | Required test IDs | Result |
|---|---|---|
| D1 iPhone | T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T14, T16, T19a, T19c | Unverified |
| D2 iPad full screen | T1, T2, T3, T4, T5, T6, T7, T9, T10, T11, T12, T14, T16, T18, T19a, T19c | Unverified |
| D3 iPad windowed | T3, T4, T13, T18, T19a, T19c | Unverified |
| D4 Android phone | T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T15, T17, T19a, T19b, T19c | Unverified |
| D5 Android tablet / foldable | T1, T2, T3, T4, T13, T15, T17, T19a, T19b, T19c | Unverified |

Include the device/OS variants and fixture requirements listed in the test procedures.

## Consumer runtime coverage

| Consumer | Required configuration / scope | Result |
|---|---|---|
| RN 0.80.0 | iOS AppDelegate-only with SDK <27; migrated scenes with SDK 27+; T1–T4 interaction checks | Unverified |
| RN 0.80.0 | Android phone, startup and lock/unlock interaction checks | Unverified |
| RN 0.88.0 | iOS SceneDelegate, startup and lock/unlock interaction checks | Unverified |
| RN 0.88.0 | Android phone, startup and lock/unlock interaction checks | Unverified |

## Results log

Release candidate must have green CI and Compatibility runs; link them here. Build/unit-test results do not complete manual or consumer interaction checks.

Add one row per test ID or automated check and configuration. Record the exact commit/artifact, device and OS, RN version and SDK/toolchain, observed result, and a durable evidence link. Use **Passed**, **Failed**, **Blocked** (with reason), or **Unverified**. Keep earlier results tied to their source; rerun affected checks after relevant changes.

| Date (UTC) | Commit / package version + hash | Device / OS / presentation | RN / SDK / toolchain | Test ID / scope | Result / observation | Evidence |
|---|---|---|---|---|---|---|
