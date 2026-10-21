#!/usr/bin/env bash
#
# Consumer compatibility test: builds a fresh React Native app with the packed library,
# exactly as a consumer would install it.
#
# Usage:
#   scripts/compat-test.sh <react-native-version> [--work-dir <dir>] [--frameworks static|dynamic] [--skip-ios] [--skip-android] [--ios-scene-smoke] [--android-agp9]
#
# Example:
#   scripts/compat-test.sh 0.80.0
#   scripts/compat-test.sh 0.88.0 --frameworks static
#   scripts/compat-test.sh 0.80.0 --skip-android --ios-scene-smoke
#
# Steps: npm pack the library → create an app from the RN template → install the tarball →
# apply the README setup (AppDelegate / SceneDelegate / MainActivity) and a screen that calls every API →
# tsc → Android assembleDebug → iOS pod install + simulator build.
#
# Environment:
#   COMPAT_JAVA_HOME  JDK for Gradle. By default a JDK 17 is picked (from ~/.gradle/jdks or
#                     /Library/Java/JavaVirtualMachines) when the app's Gradle is older than 9.1,
#                     which can't run on Java 25; otherwise JAVA_HOME is used.

set -uo pipefail

RN_VERSION="${1:-}"
if [[ -z "$RN_VERSION" || "$RN_VERSION" == -* ]]; then
  sed -n '3,20p' "$0" | sed 's/^# \{0,1\}//'
  exit 2
fi
shift

WORK_DIR=""
FRAMEWORKS=""
SKIP_IOS=0
SKIP_ANDROID=0
IOS_SCENE_SMOKE=0
ANDROID_AGP9=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --work-dir) WORK_DIR="$2"; shift 2 ;;
    --frameworks) FRAMEWORKS="$2"; shift 2 ;;
    --skip-ios) SKIP_IOS=1; shift ;;
    --skip-android) SKIP_ANDROID=1; shift ;;
    --ios-scene-smoke) IOS_SCENE_SMOKE=1; shift ;;
    --android-agp9) ANDROID_AGP9=1; shift ;;
    *) echo "Unknown option: $1"; exit 2 ;;
  esac
done

if [[ -n "$FRAMEWORKS" && "$FRAMEWORKS" != static && "$FRAMEWORKS" != dynamic ]]; then
  echo '--frameworks must be static or dynamic.' >&2
  exit 2
fi
if [[ -n "$FRAMEWORKS" ]] && { (( SKIP_IOS == 1 )) || [[ "$(uname)" != Darwin ]]; }; then
  echo '--frameworks requires an enabled iOS build on macOS.' >&2
  exit 2
fi
if (( ANDROID_AGP9 == 1 )) && { [[ "$RN_VERSION" != '0.88.0' ]] || (( SKIP_ANDROID == 1 )); }; then
  echo '--android-agp9 requires RN 0.88.0 and an enabled Android build.' >&2
  exit 2
fi

if (( IOS_SCENE_SMOKE == 1 )) && { [[ "$RN_VERSION" != '0.80.0' || "$(uname)" != 'Darwin' ]] || (( SKIP_IOS == 1 )); }; then
  echo '--ios-scene-smoke requires RN 0.80.0 and an enabled iOS build on macOS.' >&2
  exit 2
fi

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP_NAME="CompatApp"
LABEL="rn-${RN_VERSION}${FRAMEWORKS:+-frameworks-$FRAMEWORKS}"
(( ANDROID_AGP9 == 1 )) && LABEL="$LABEL-agp9"
WORK_DIR="${WORK_DIR:-${TMPDIR:-/tmp}/orientation-turbo-compat/$LABEL}"
APP_DIR="$WORK_DIR/$APP_NAME"
LOG_DIR="$WORK_DIR/logs"

declare -a RESULTS=()
FAILED=0

log() { printf '\n==> %s\n' "$*"; }
record() { # $1 step, $2 status, $3 log file
  RESULTS+=("$(printf '%-22s %-6s %s' "$1" "$2" "$3")")
  [[ "$2" == "FAIL" ]] && FAILED=1
}
run_step() { # $1 step name, $2.. command
  local name="$1"; shift
  local logfile="$LOG_DIR/$(echo "$name" | tr ' /' '__').log"
  log "$name"
  if "$@" > "$logfile" 2>&1; then
    record "$name" "PASS" "$logfile"
    return 0
  fi
  tail -30 "$logfile"
  record "$name" "FAIL" "$logfile"
  return 1
}
summary() {
  printf '\n==== Compatibility summary: react-native %s%s ====\n' "$RN_VERSION" "${FRAMEWORKS:+ (USE_FRAMEWORKS=$FRAMEWORKS)}"
  printf '%s\n' "${RESULTS[@]}"
  (( ANDROID_AGP9 == 1 )) && printf 'Android mode: AGP 9 built-in Kotlin + new DSL\n'
  printf 'Work dir: %s\n' "$WORK_DIR"
  exit "$FAILED"
}
trap summary EXIT

rm -rf "$WORK_DIR"
mkdir -p "$LOG_DIR"

# ---------------------------------------------------------------------------
# 1. Pack the library
# ---------------------------------------------------------------------------
pack_library() {
  cd "$REPO_ROOT" || return 1
  yarn prepare || return 1
  npm pack --ignore-scripts --pack-destination "$WORK_DIR" || return 1
}
run_step "pack library" pack_library || exit 1
TARBALL="$(ls "$WORK_DIR"/react-native-orientation-turbo-*.tgz | head -1)"

# ---------------------------------------------------------------------------
# 2. Create the app and install the tarball
# ---------------------------------------------------------------------------
create_app() {
  cd "$WORK_DIR" || return 1
  npx --yes @react-native-community/cli@latest init "$APP_NAME" --version "$RN_VERSION" \
    --pm npm --skip-git-init --install-pods false || return 1
  cd "$APP_DIR" && npm install "$TARBALL"
}
run_step "create app" create_app || exit 1

# Explicit test-only migration of the oldest consumer. The public setup command
# continues to configure orientation only; it never rewrites the app lifecycle.
migrate_ios_scene() {
  cd "$APP_DIR" || return 1
  bundle install || return 1
  bundle exec ruby "$REPO_ROOT/scripts/compat-ios-scene.rb" "$APP_DIR"
}
if (( IOS_SCENE_SMOKE == 1 )); then
  run_step "ios scene migration" migrate_ios_scene || exit 1
fi

# ---------------------------------------------------------------------------
# 3. Native setup (npx react-native-orientation-turbo setup) and a test screen
# ---------------------------------------------------------------------------
apply_setup() {
  cd "$APP_DIR" || return 1
  node - "$APP_DIR" "$APP_NAME" <<'NODE'
const fs = require('fs');
const path = require('path');
const [appDir, appName] = process.argv.slice(2);

// JS: a screen that calls every public API
fs.writeFileSync(path.join(appDir, 'App.tsx'), `import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import {
  LandscapeDirection,
  Orientation,
  PortraitDirection,
  canLockOrientation,
  getCurrentOrientation,
  getDeviceAutoRotateStatus,
  isLocked,
  lockToLandscape,
  lockToPortrait,
  onLockOrientationChange,
  onOrientationChange,
  startOrientationTracking,
  stopOrientationTracking,
  unlockAllOrientations,
  type DeviceAutoRotateStatus,
  type LockOrientationSubscription,
  type OrientationSubscription,
} from 'react-native-orientation-turbo';

export default function App() {
  const [orientation, setOrientation] = useState<Orientation>(getCurrentOrientation());
  const [lock, setLock] = useState<LockOrientationSubscription | null>(null);

  useEffect(() => {
    startOrientationTracking();
    const orientationSubscription = onOrientationChange((event: OrientationSubscription) => setOrientation(event.orientation));
    const lockSubscription = onLockOrientationChange((event: LockOrientationSubscription) => setLock(event));
    lockToPortrait(PortraitDirection.UP);
    lockToLandscape(LandscapeDirection.LEFT);
    unlockAllOrientations();
    return () => {
      orientationSubscription.remove();
      lockSubscription.remove();
      stopOrientationTracking();
    };
  }, []);

  const autoRotate: DeviceAutoRotateStatus | null = getDeviceAutoRotateStatus();
  return (
    <View style={{ flex: 1, backgroundColor: '#fff', padding: 24, paddingTop: 80 }}>
      <Text style={{ color: '#111', fontSize: 20 }}>Orientation Turbo consumer</Text>
      <Text>orientation: {orientation}</Text>
      <Text>locked: {String(isLocked())} / can lock: {String(canLockOrientation())}</Text>
      <Text>last lock event: {JSON.stringify(lock)}</Text>
      <Text>auto-rotate: {JSON.stringify(autoRotate)}</Text>
    </View>
  );
}
`);
console.log('test screen written');

// Jest: the library's mock via setupFiles, plus a test using the mock's helpers
const jestConfigPath = path.join(appDir, 'jest.config.js');
const jestConfig = fs.readFileSync(jestConfigPath, 'utf8');
const withSetup = jestConfig.replace(
  /(preset:\s*['"][^'"]+['"],?)/,
  "$1\n  setupFiles: ['react-native-orientation-turbo/jest/setup'],"
);
if (withSetup === jestConfig) {
  throw new Error('jest.config.js: no preset found to add setupFiles after');
}
fs.writeFileSync(jestConfigPath, withSetup.replace("'],,", "'],"));
fs.mkdirSync(path.join(appDir, '__tests__'), { recursive: true });
fs.writeFileSync(path.join(appDir, '__tests__', 'Orientation.test.tsx'), `import {
  LandscapeDirection,
  getCurrentOrientation,
  isLocked,
  lockToLandscape,
  onOrientationChange,
  startOrientationTracking,
} from 'react-native-orientation-turbo';
import { __reset, __setDeviceOrientation } from 'react-native-orientation-turbo/jest/mock';

beforeEach(() => __reset());

test('locks through the mock', () => {
  lockToLandscape(LandscapeDirection.LEFT);
  expect(isLocked()).toBe(true);
  expect(getCurrentOrientation()).toBe('LANDSCAPE_LEFT');
  expect(lockToLandscape).toHaveBeenCalledWith('LEFT');
});

test('simulated rotation reaches listeners', () => {
  const listener = jest.fn();
  onOrientationChange(listener);
  startOrientationTracking();
  __setDeviceOrientation('LANDSCAPE_RIGHT');
  expect(listener).toHaveBeenCalledWith({ orientation: 'LANDSCAPE_RIGHT' });
});
`);
console.log('jest setup written');
NODE
  # Native setup through the package's own setup command, as consumers would run it
  npx react-native-orientation-turbo setup --lock portrait
}
run_step "apply setup" apply_setup || exit 1

# ---------------------------------------------------------------------------
# 4. TypeScript: the library's .d.ts against this RN version's types
# ---------------------------------------------------------------------------
run_step "typescript" bash -c "cd '$APP_DIR' && npx tsc --noEmit"

# ---------------------------------------------------------------------------
# 4b. Jest: the app's tests (incl. the template's App.test.tsx) with the library's mock
# ---------------------------------------------------------------------------
run_step "jest" bash -c "cd '$APP_DIR' && npx jest --ci"


# ---------------------------------------------------------------------------
# 5. Android
# ---------------------------------------------------------------------------
pick_java_home() {
  # Gradle < 9.1 can't run on Java 25; use a JDK 17 for those RN versions unless JAVA_HOME is given
  local gradle_version
  gradle_version="$(grep -o 'gradle-[0-9.]*-bin' "$APP_DIR/android/gradle/wrapper/gradle-wrapper.properties" | sed 's/gradle-//; s/-bin//')"
  local major="${gradle_version%%.*}" minor
  minor="$(echo "$gradle_version" | cut -d. -f2)"
  if [[ -n "${COMPAT_JAVA_HOME:-}" ]]; then
    echo "$COMPAT_JAVA_HOME"
  elif (( major < 9 || (major == 9 && minor < 1) )); then
    local java17
    java17="$(find "$HOME/.gradle/jdks" /Library/Java/JavaVirtualMachines -maxdepth 7 -path '*17*' -name java -type f 2>/dev/null | grep '/bin/java$' | head -1)"
    [[ -n "$java17" ]] && dirname "$(dirname "$java17")" || echo "${JAVA_HOME:-}"
  else
    echo "${JAVA_HOME:-}"
  fi
}
configure_android_agp9() {
  node "$REPO_ROOT/scripts/compat-android-agp9.js" "$APP_DIR"
}
build_android() {
  local java_home
  java_home="$(pick_java_home)"
  echo "JAVA_HOME=$java_home"
  local -a gradle_tasks=(assembleDebug)
  (( ANDROID_AGP9 == 1 )) && gradle_tasks+=(":app:verifyOrientationTurboAgp9")
  cd "$APP_DIR/android" && JAVA_HOME="$java_home" ./gradlew "${gradle_tasks[@]}" -PreactNativeArchitectures=arm64-v8a --console=plain
}
if (( SKIP_ANDROID == 0 )); then
  if (( ANDROID_AGP9 == 1 )); then
    run_step "configure android agp9" configure_android_agp9 || exit 1
  fi
  run_step "android build" build_android
fi

# ---------------------------------------------------------------------------
# 6. iOS
# ---------------------------------------------------------------------------
build_ios() {
  cd "$APP_DIR" || return 1
  xcodebuild -version || return 1
  ruby --version || return 1
  bundle --version || return 1
  bundle install || return 1
  bundle exec pod --version || return 1
  if [[ -n "$FRAMEWORKS" ]]; then
    (cd ios && USE_FRAMEWORKS="$FRAMEWORKS" bundle exec pod install) || return 1
  else
    (cd ios && bundle exec pod install) || return 1
  fi
  if [[ -n "$FRAMEWORKS" ]]; then
    bundle exec ruby "$REPO_ROOT/scripts/compat-ios-linkage.rb" "$APP_DIR" "$FRAMEWORKS" || return 1
  fi
  # React Native <= 0.83 compiles fmt 11.0.2 from source, which Xcode 26.4+ / 27 rejects
  # ("call to consteval function ... is not a constant expression"). Not related to this library:
  # turn off fmt's compile-time format checks in the test app only.
  local fmt_base="ios/Pods/fmt/include/fmt/base.h"
  if [[ -f "$fmt_base" ]] && grep -q '^#  define FMT_USE_CONSTEVAL 1$' "$fmt_base"; then
    chmod u+w "$fmt_base"
    sed -i.bak 's/^#  define FMT_USE_CONSTEVAL 1$/#  define FMT_USE_CONSTEVAL 0/' "$fmt_base" && rm -f "$fmt_base.bak"
    echo "NOTE: applied the fmt consteval workaround (React Native's fmt with a newer Xcode)"
  fi
  local configuration=Debug
  (( IOS_SCENE_SMOKE == 1 )) && configuration=Release
  xcodebuild -workspace "ios/$APP_NAME.xcworkspace" -scheme "$APP_NAME" -configuration "$configuration" \
    -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' \
    -derivedDataPath "$WORK_DIR/DerivedData" build
}
if (( SKIP_IOS == 0 )) && [[ "$(uname)" == "Darwin" ]]; then
  if run_step "ios build" build_ios && (( IOS_SCENE_SMOKE == 1 )); then
    run_step "ios launch" bash "$REPO_ROOT/scripts/compat-ios-smoke.sh" \
      "$WORK_DIR/DerivedData/Build/Products/Release-iphonesimulator/$APP_NAME.app" "$LOG_DIR"
  fi
fi
