'use strict';

/**
 * Applies the native setup described in the README to a React Native app.
 * Every step is a pure function: (file content) -> {content} | {error}.
 */

const fs = require('fs');
const path = require('path');

const README_URL =
  'https://github.com/whitestranger7/react-native-orientation-turbo#installation';
const SCENE_MIGRATION_URL =
  'https://github.com/whitestranger7/react-native-orientation-turbo/blob/v3/docs/IOS_SCENES.md';

const LOCKS = {
  'portrait': {
    swift: 'OrientationTurbo.shared.lockToPortrait()',
    kotlin: 'OrientationTurbo.lockToPortrait(this)',
    kotlinImport: null,
  },
  'portrait-upside-down': {
    swift: 'OrientationTurbo.shared.lockToPortrait(.upsideDown)',
    kotlin:
      'OrientationTurbo.lockToPortrait(this, PortraitDirection.UPSIDE_DOWN)',
    kotlinImport: 'com.orientationturbo.enums.PortraitDirection',
  },
  'landscape-left': {
    swift: 'OrientationTurbo.shared.lockToLandscape(.left)',
    kotlin: 'OrientationTurbo.lockToLandscape(this, LandscapeDirection.LEFT)',
    kotlinImport: 'com.orientationturbo.enums.LandscapeDirection',
  },
  'landscape-right': {
    swift: 'OrientationTurbo.shared.lockToLandscape(.right)',
    kotlin: 'OrientationTurbo.lockToLandscape(this, LandscapeDirection.RIGHT)',
    kotlinImport: 'com.orientationturbo.enums.LandscapeDirection',
  },
};

const SUPPORTED_ORIENTATIONS_METHOD = `
extension AppDelegate {
  func application(_ application: UIApplication, supportedInterfaceOrientationsFor window: UIWindow?) -> UIInterfaceOrientationMask {
    return OrientationTurbo.shared.getSupportedInterfaceOrientations(for: window)
  }
}
`;

// ---------------------------------------------------------------------------
// Pure transformations
// ---------------------------------------------------------------------------

function addSwiftImport(content) {
  if (/^import OrientationTurbo[ \t]*$/m.test(content)) {
    return content;
  }
  const imports = [...content.matchAll(/^import [A-Za-z_]+[ \t]*$/gm)];
  if (imports.length === 0) {
    return null;
  }
  const last = imports[imports.length - 1];
  const end = last.index + last[0].length;
  return `${content.slice(0, end)}\nimport OrientationTurbo${content.slice(end)}`;
}

/** Required in every app: AppDelegate returns the library's supported orientations */
function setupAppDelegate(content) {
  if (content.includes('supportedInterfaceOrientationsFor')) {
    if (
      /OrientationTurbo\.shared\.getSupportedInterfaceOrientations\(for:\s*\w+\)/.test(
        content
      )
    ) {
      return { content, alreadyDone: true };
    }
    const legacyMethod =
      /(func\s+application\s*\([^{}]*supportedInterfaceOrientationsFor\s+(\w+)\s*:\s*UIWindow\?[^{}]*\)\s*->\s*UIInterfaceOrientationMask\s*\{\s*return\s+)OrientationTurbo\.shared\.getSupportedInterfaceOrientations\(\)(\s*\})/;
    if (legacyMethod.test(content)) {
      return {
        content: content.replace(
          legacyMethod,
          '$1OrientationTurbo.shared.getSupportedInterfaceOrientations(for: $2)$3'
        ),
      };
    }
    return {
      error:
        'AppDelegate already implements application(_:supportedInterfaceOrientationsFor:). ' +
        'Return OrientationTurbo.shared.getSupportedInterfaceOrientations(for: window) from it.',
    };
  }
  if (!/class\s+AppDelegate\b/.test(content)) {
    return { error: 'No `class AppDelegate` found in AppDelegate.swift.' };
  }
  const withImport = addSwiftImport(content);
  if (withImport == null) {
    return { error: 'No import statements found in AppDelegate.swift.' };
  }
  return {
    content: `${withImport.trimEnd()}\n${SUPPORTED_ORIENTATIONS_METHOD}`,
  };
}

/** Optional: lock before React Native starts, in the file that calls startReactNative */
function addSwiftEarlyLock(content, lock) {
  if (/OrientationTurbo\.shared\.lockTo/.test(content)) {
    return { content, alreadyDone: true };
  }
  const match = content.match(/^([ \t]*)(\S*\.startReactNative\()/m);
  if (match == null) {
    return {
      error:
        'No `startReactNative(` call found to place the early lock before.',
    };
  }
  const withImport = addSwiftImport(content);
  if (withImport == null) {
    return { error: 'No import statements found.' };
  }
  const [line, indent] = match;
  return {
    content: withImport.replace(
      line,
      `${indent}// Lock orientation before React Native loads\n${indent}${LOCKS[lock].swift}\n\n${line}`
    ),
  };
}

function addKotlinImport(content, importName) {
  if (
    new RegExp(`^import ${importName.replace(/\./g, '\\.')}[ \\t]*$`, 'm').test(
      content
    )
  ) {
    return content;
  }
  const imports = [...content.matchAll(/^import [A-Za-z0-9_.]+[ \t]*$/gm)];
  if (imports.length === 0) {
    const pkg = content.match(/^package [A-Za-z0-9_.]+[ \t]*$/m);
    if (pkg == null) {
      return null;
    }
    const end = pkg.index + pkg[0].length;
    return `${content.slice(0, end)}\n\nimport ${importName}${content.slice(end)}`;
  }
  const last = imports[imports.length - 1];
  const end = last.index + last[0].length;
  return `${content.slice(0, end)}\nimport ${importName}${content.slice(end)}`;
}

/** Optional: lock in MainActivity.onCreate, before super.onCreate */
function addKotlinEarlyLock(content, lock) {
  if (/OrientationTurbo\.lockTo/.test(content)) {
    return { content, alreadyDone: true };
  }
  const { kotlin, kotlinImport } = LOCKS[lock];
  let result = content;

  const superOnCreate = result.match(/^([ \t]*)super\.onCreate\(/m);
  if (superOnCreate != null) {
    const [line, indent] = superOnCreate;
    result = result.replace(line, `${indent}${kotlin}\n${line}`);
  } else {
    const classHeader = result.match(
      /^class MainActivity[ \t]*:[ \t]*ReactActivity\(\)[ \t]*\{[ \t]*$/m
    );
    if (classHeader == null) {
      return {
        error:
          'No `class MainActivity : ReactActivity() {` found in MainActivity.kt.',
      };
    }
    const onCreate = [
      '',
      '  override fun onCreate(savedInstanceState: Bundle?) {',
      '    // Lock orientation before React Native loads',
      `    ${kotlin}`,
      '    super.onCreate(savedInstanceState)',
      '  }',
    ].join('\n');
    result = result.replace(classHeader[0], `${classHeader[0]}\n${onCreate}`);
    result = addKotlinImport(result, 'android.os.Bundle');
  }

  for (const importName of [
    'com.orientationturbo.OrientationTurbo',
    kotlinImport,
  ]) {
    if (importName != null && result != null) {
      result = addKotlinImport(result, importName);
    }
  }
  if (result == null) {
    return {
      error: 'No package or import statements found in MainActivity.kt.',
    };
  }
  return { content: result };
}

// ---------------------------------------------------------------------------
// File discovery
// ---------------------------------------------------------------------------

const IGNORED_DIRS = new Set([
  'Pods',
  'build',
  'node_modules',
  '.git',
  'DerivedData',
]);

function findFiles(dir, fileName, depth = 0, found = []) {
  if (depth > 8 || !fs.existsSync(dir)) {
    return found;
  }
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!IGNORED_DIRS.has(entry.name) && !entry.name.startsWith('.')) {
        findFiles(path.join(dir, entry.name), fileName, depth + 1, found);
      }
    } else if (entry.name === fileName) {
      found.push(path.join(dir, entry.name));
    }
  }
  return found;
}

function findOne(dir, fileName) {
  const files = findFiles(dir, fileName);
  if (files.length > 1) {
    return { error: `Found several ${fileName} files: ${files.join(', ')}` };
  }
  return { file: files[0] ?? null };
}

// ---------------------------------------------------------------------------
// Plan
// ---------------------------------------------------------------------------

/**
 * Plans every change without writing anything.
 * Returns steps: {platform, title, status: 'change' | 'done' | 'skipped' | 'warning' | 'failed', file?, content?, message?, manual?}
 */
function planSetup({ appRoot, lock = null }) {
  const steps = [];
  const iosDir = path.join(appRoot, 'ios');
  const androidJavaDir = path.join(
    appRoot,
    'android',
    'app',
    'src',
    'main',
    'java'
  );

  // iOS
  if (!fs.existsSync(iosDir)) {
    steps.push({
      platform: 'iOS',
      title: 'AppDelegate',
      status: 'skipped',
      message: 'No ios/ directory.',
    });
  } else {
    const appDelegate = findOne(iosDir, 'AppDelegate.swift');
    const objcAppDelegate = findFiles(iosDir, 'AppDelegate.mm')[0];
    if (appDelegate.error) {
      steps.push({
        platform: 'iOS',
        title: 'AppDelegate',
        status: 'failed',
        message: appDelegate.error,
        manual: 'appdelegate',
      });
    } else if (appDelegate.file == null) {
      steps.push({
        platform: 'iOS',
        title: 'AppDelegate',
        status: 'failed',
        message: objcAppDelegate
          ? `Objective-C AppDelegate (${path.relative(appRoot, objcAppDelegate)}) isn't supported by the automatic setup.`
          : 'No AppDelegate.swift found under ios/.',
        manual: 'appdelegate',
      });
    } else {
      // Diagnose the legacy template without guessing the consumer's build SDK.
      // A SceneDelegate file alone doesn't establish that UIKit uses scenes.
      const appDelegateContent = fs.readFileSync(appDelegate.file, 'utf8');
      if (/^[ \t]*\S*\.startReactNative\(/m.test(appDelegateContent)) {
        steps.push({
          platform: 'iOS',
          title: 'Scene lifecycle',
          status: 'warning',
          message:
            'React Native starts in AppDelegate. When building with the iOS 27 SDK or newer, ' +
            'adopt the UIScene lifecycle before running on iOS 27 or newer. ' +
            'This command configures orientation; it does not migrate the app lifecycle. ' +
            `Migration: ${SCENE_MIGRATION_URL}`,
        });
      }
      steps.push(
        planFile(
          'iOS',
          'AppDelegate: supportedInterfaceOrientationsFor',
          appDelegate.file,
          setupAppDelegate,
          'appdelegate'
        )
      );

      if (lock != null) {
        const sceneDelegate = findOne(
          path.dirname(appDelegate.file),
          'SceneDelegate.swift'
        );
        const lockFile = sceneDelegate.file ?? appDelegate.file;
        const title = `${path.basename(lockFile, '.swift')}: early lock (${lock})`;
        // When AppDelegate is also the lock target, chain on top of its planned content
        const previous = steps.find(
          (step) => step.file === lockFile && step.status === 'change'
        );
        steps.push(
          planFile(
            'iOS',
            title,
            lockFile,
            (content) => addSwiftEarlyLock(content, lock),
            'early-lock',
            previous?.content
          )
        );
      }
    }
  }

  // Android: nothing is required; the early lock is optional
  if (lock == null) {
    steps.push({
      platform: 'Android',
      title: 'MainActivity',
      status: 'done',
      message: 'No setup needed.',
    });
  } else if (!fs.existsSync(androidJavaDir)) {
    steps.push({
      platform: 'Android',
      title: 'MainActivity: early lock',
      status: 'skipped',
      message: 'No android/app/src/main/java directory.',
    });
  } else {
    const mainActivity = findOne(androidJavaDir, 'MainActivity.kt');
    const javaMainActivity = findFiles(androidJavaDir, 'MainActivity.java')[0];
    if (mainActivity.error || mainActivity.file == null) {
      steps.push({
        platform: 'Android',
        title: 'MainActivity: early lock',
        status: 'failed',
        message:
          mainActivity.error ??
          (javaMainActivity
            ? "Java MainActivity isn't supported by the automatic setup."
            : 'No MainActivity.kt found.'),
        manual: 'android-early-lock',
      });
    } else {
      steps.push(
        planFile(
          'Android',
          `MainActivity: early lock (${lock})`,
          mainActivity.file,
          (content) => addKotlinEarlyLock(content, lock),
          'android-early-lock'
        )
      );
    }
  }

  return steps;
}

function planFile(platform, title, file, transform, manual, baseContent) {
  const original = baseContent ?? fs.readFileSync(file, 'utf8');
  const result = transform(original);
  if (result.error) {
    return {
      platform,
      title,
      file,
      status: 'failed',
      message: result.error,
      manual,
    };
  }
  if (result.alreadyDone || result.content === original) {
    return {
      platform,
      title,
      file,
      status: 'done',
    };
  }
  return { platform, title, file, status: 'change', content: result.content };
}

/** Writes planned changes; for files changed by several steps the last planned content wins */
function applyPlan(steps) {
  const contents = new Map();
  for (const step of steps) {
    if (step.status === 'change') {
      contents.set(step.file, step.content);
    }
  }
  for (const [file, content] of contents) {
    fs.writeFileSync(file, content);
  }
  return [...contents.keys()];
}

const MANUAL_STEPS = {
  'appdelegate': `In AppDelegate (Swift), add:

    import OrientationTurbo

    func application(_ application: UIApplication, supportedInterfaceOrientationsFor window: UIWindow?) -> UIInterfaceOrientationMask {
      return OrientationTurbo.shared.getSupportedInterfaceOrientations(for: window)
    }`,
  'early-lock': `Before React Native starts (SceneDelegate, or AppDelegate in apps without one), add:

    OrientationTurbo.shared.lockToPortrait()`,
  'android-early-lock': `In MainActivity.onCreate, before super.onCreate(savedInstanceState), add:

    OrientationTurbo.lockToPortrait(this)`,
};

module.exports = {
  LOCKS,
  README_URL,
  MANUAL_STEPS,
  setupAppDelegate,
  addSwiftEarlyLock,
  addKotlinEarlyLock,
  planSetup,
  applyPlan,
};
