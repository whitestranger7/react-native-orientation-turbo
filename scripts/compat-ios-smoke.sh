#!/usr/bin/env bash
# Launch the Release consumer on a simulator matching the build SDK.
# Process survival checks startup only; the screenshot is retained for UI review.
set -euo pipefail

APP_PATH="$1"
LOG_DIR="$2"
[[ -s "$APP_PATH/main.jsbundle" ]] || { echo 'Expected a Release app with bundled JavaScript' >&2; exit 1; }
SDK_MAJOR="$(xcrun --sdk iphonesimulator --show-sdk-version | cut -d. -f1)"
if (( SDK_MAJOR < 27 )); then
  echo 'The scene-migration smoke check requires the iOS 27 SDK or newer.' >&2
  exit 1
fi

DEVICE_ID="$(xcrun simctl list devices available --json | node -e '
let data = "";
process.stdin.on("data", chunk => data += chunk);
process.stdin.on("end", () => {
  const major = process.argv[1];
  const candidates = Object.entries(JSON.parse(data).devices)
    .filter(([runtime]) => runtime.startsWith(`com.apple.CoreSimulator.SimRuntime.iOS-${major}-`))
    .flatMap(([, devices]) => devices)
    .filter(device => device.isAvailable && device.name.startsWith("iPhone"));
  const device = candidates.find(candidate => candidate.state === "Booted") ?? candidates[0];
  if (!device) {
    console.error(`Install an iOS ${major} iPhone simulator runtime to run the launch check.`);
    process.exit(1);
  }
  process.stdout.write(device.udid);
});
' "$SDK_MAJOR")"

BUNDLE_ID="$(/usr/libexec/PlistBuddy -c 'Print CFBundleIdentifier' "$APP_PATH/Info.plist")"
echo "SDK major: $SDK_MAJOR; simulator: $DEVICE_ID; app: $BUNDLE_ID"
# bootstatus also boots a shutdown device; it waits for SpringBoard to be ready.
xcrun simctl bootstatus "$DEVICE_ID" -b
xcrun simctl install "$DEVICE_ID" "$APP_PATH"
cleanup() {
  local exit_status=$?
  if (( exit_status != 0 )); then
    xcrun simctl spawn "$DEVICE_ID" log show --last 3m --style compact \
      --predicate 'process == "CompatApp"' > "$LOG_DIR/ios-app.log" 2>&1 || true
  fi
  xcrun simctl terminate "$DEVICE_ID" "$BUNDLE_ID" >/dev/null 2>&1 || true
  xcrun simctl uninstall "$DEVICE_ID" "$BUNDLE_ID" >/dev/null 2>&1 || true
}
trap cleanup EXIT

LAUNCH="$(xcrun simctl launch --terminate-running-process "$DEVICE_ID" "$BUNDLE_ID")"
echo "$LAUNCH"
APP_PID="${LAUNCH##*: }"
[[ "$APP_PID" =~ ^[0-9]+$ ]] || { echo 'No process ID returned by simctl' >&2; exit 1; }
for (( attempt=0; attempt<15; attempt++ )); do
  sleep 1
  STATE="$(ps -p "$APP_PID" -o stat=)" || { echo 'App terminated during startup' >&2; exit 1; }
  [[ "$STATE" != *Z* ]] || { echo 'App became a zombie during startup' >&2; exit 1; }
done
xcrun simctl io "$DEVICE_ID" screenshot "$LOG_DIR/ios-launch.png"
echo 'PASS: Release consumer survived startup for 15 seconds without Metro.'
