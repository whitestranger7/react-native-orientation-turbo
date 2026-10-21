'use strict';

/**
 * Applies the native setup described in the README to a React Native app.
 * Every step is a pure function: (file content) -> {content} | {error}.
 */

const fs = require('fs');
const path = require('path');
const {
  sourceView,
  depthAt,
  isConditional,
  typeBodies,
  declarations,
  methods,
} = require('./native-source');

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
  const code = sourceView(content);
  const imports = [...code.matchAll(/^import [A-Za-z_][\w.]*[ \t]*$/gm)].filter(
    (match) => !isConditional(code, match.index)
  );
  if (imports.some((match) => /^import OrientationTurbo\b/.test(match[0])))
    return content;
  if (imports.length === 0) return null;
  const last = imports[imports.length - 1];
  const end = last.index + last[0].length;
  return `${content.slice(0, end)}\nimport OrientationTurbo${content.slice(end)}`;
}

function orientationCallbacks(code, parser = declarations) {
  return parser(code, 'AppDelegate', 'swift').filter(
    (method) =>
      method.match[1] === 'application' &&
      /\bsupportedInterfaceOrientationsFor\b/.test(method.match[0])
  );
}

/** Required in every app: AppDelegate returns the library's supported orientations */
function setupAppDelegate(content) {
  const code = sourceView(content);
  if (typeBodies(code, 'AppDelegate').length === 0) {
    return { error: 'No `class AppDelegate` found in AppDelegate.swift.' };
  }
  const declared = orientationCallbacks(code);
  const callbacks = orientationCallbacks(code, methods);
  if (declared.length !== callbacks.length) {
    return {
      error:
        'AppDelegate has an unsupported application(_:supportedInterfaceOrientationsFor:) signature; update the existing callback manually.',
    };
  }
  let result = content;
  if (callbacks.length > 0) {
    const callback = callbacks[0];
    const parameter = callback.match[0].match(
      /supportedInterfaceOrientationsFor\s+(\w+)\s*:\s*(?:UIKit\.)?UIWindow\s*\?/
    );
    const body = code
      .slice(callback.start, callback.end)
      .trim()
      .replace(/;$/, '')
      .trim();
    const forward =
      /^\s*(?:return\s+)?OrientationTurbo\s*\.\s*shared\s*\.\s*getSupportedInterfaceOrientations\s*\(([^()]*)\)\s*$/;
    const call = body.match(forward);
    if (
      callbacks.length !== 1 ||
      isConditional(code, callback.match.index) ||
      parameter == null ||
      call == null ||
      (call[1].trim() !== '' &&
        call[1].replace(/\s/g, '') !== `for:${parameter[1]}`)
    ) {
      return {
        error:
          'AppDelegate has a custom or ambiguous application(_:supportedInterfaceOrientationsFor:). ' +
          'Return OrientationTurbo.shared.getSupportedInterfaceOrientations(for: window) from that callback (using its window parameter).',
      };
    }
    if (call[1].trim() === '') {
      const callStart = code.indexOf(
        'getSupportedInterfaceOrientations',
        callback.start
      );
      const argumentStart = code.indexOf('(', callStart) + 1;
      result = `${content.slice(0, argumentStart)}for: ${parameter[1]}${content.slice(argumentStart)}`;
    }
  } else {
    result = `${content.trimEnd()}\n${SUPPORTED_ORIENTATIONS_METHOD}`;
  }
  const withImport = addSwiftImport(result);
  return withImport == null
    ? { error: 'No import statements found in AppDelegate.swift.' }
    : { content: withImport };
}

function swiftStartups(content, owner) {
  const code = sourceView(content);
  return methods(code, owner, 'swift').flatMap((method) => {
    const lifecycle =
      owner === 'AppDelegate'
        ? /\bdidFinishLaunchingWithOptions\b/
        : /\bwillConnectTo\b/;
    if (!lifecycle.test(method.match[0])) return [];
    return [
      ...code.matchAll(/^([ \t]*)[A-Za-z_][\w?.]*\.startReactNative\s*\(/gm),
    ]
      .filter(
        (call) =>
          call.index >= method.start &&
          call.index < method.end &&
          !isConditional(code, call.index) &&
          depthAt(code, method.start, call.index) === 0
      )
      .map((call) => ({ method, call }));
  });
}

function ambiguousLockMessage(lock, language) {
  const swift = language === 'Swift';
  return `${swift ? 'AppDelegate/SceneDelegate' : 'MainActivity'} already calls OrientationTurbo outside a verifiable early-lock position, so setup can't tell whether an early lock exists. Add ${LOCKS[lock][swift ? 'swift' : 'kotlin']} before ${swift ? 'startReactNative' : 'super.onCreate'} yourself if you want one, or run setup without --lock.`;
}

function existingEarlyLock(
  content,
  code,
  expression,
  method,
  before,
  lock,
  language
) {
  const calls = [...code.matchAll(expression)];
  if (calls.length === 0) return null;
  const call = calls[0];
  if (
    calls.length !== 1 ||
    call.index < method.start ||
    call.index >= before ||
    (language === 'Swift' && isConditional(code, call.index)) ||
    depthAt(code, method.start, call.index) !== 0
  ) {
    return {
      error: ambiguousLockMessage(lock, language),
    };
  }
  const tail = code.slice(call.index).match(/^[^()]*\([^()]*\)/);
  if (tail == null)
    return {
      error:
        'The existing orientation lock uses custom arguments; review it manually.',
    };
  const original = sourceView(
    content.slice(call.index, call.index + tail[0].length),
    { strings: false, language: language.toLowerCase() }
  );
  const choice = lockChoice(original, language);
  if (choice !== lock) {
    return {
      error: `Existing early lock is ${choice ?? 'custom'}; requested --lock ${lock}. Change it manually before running setup again.`,
    };
  }
  return { content };
}

function lockChoice(call, language) {
  if (language === 'Kotlin') {
    const compact = call.replace(/\s/g, '');
    const choice = Object.entries(LOCKS).find(
      ([, value]) => value.kotlin.replace(/\s/g, '') === compact
    )?.[0];
    return (
      choice ??
      (compact === 'OrientationTurbo.lockToPortrait(this,PortraitDirection.UP)'
        ? 'portrait'
        : null)
    );
  }
  const parts = call.match(/lockTo(Portrait|Landscape)\s*\(([\s\S]*)\)$/);
  if (parts == null) return null;
  const argument = parts[2].trim();
  const value = argument.startsWith('"')
    ? argument
    : argument.replace(/\s/g, '');
  const choices =
    parts[1] === 'Portrait'
      ? {
          '': 'portrait',
          'nil': 'portrait',
          '.up': 'portrait',
          'PortraitDirection.up': 'portrait',
          '"UP"': 'portrait',
          '.upsideDown': 'portrait-upside-down',
          'PortraitDirection.upsideDown': 'portrait-upside-down',
          '"UPSIDE_DOWN"': 'portrait-upside-down',
        }
      : {
          '.left': 'landscape-left',
          'LandscapeDirection.left': 'landscape-left',
          '"LEFT"': 'landscape-left',
          '.right': 'landscape-right',
          'LandscapeDirection.right': 'landscape-right',
          '"RIGHT"': 'landscape-right',
        };
  return Object.prototype.hasOwnProperty.call(choices, value)
    ? choices[value]
    : null;
}

/** Optional: lock before React Native starts, in its actual lifecycle method. */
function addSwiftEarlyLock(content, lock, owner) {
  const startups = (owner ? [owner] : ['AppDelegate', 'SceneDelegate']).flatMap(
    (name) => swiftStartups(content, name)
  );
  if (startups.length !== 1)
    return {
      error:
        'Could not identify one direct startReactNative call in the AppDelegate/SceneDelegate startup method; add the early lock manually.',
    };
  const { method, call } = startups[0];
  const existing = existingEarlyLock(
    content,
    sourceView(content),
    /\bOrientationTurbo\s*\.\s*shared\s*\.\s*lockTo(?:Portrait|Landscape)\s*\(/g,
    method,
    call.index,
    lock,
    'Swift'
  );
  if (existing?.error) return existing;
  const result = existing
    ? content
    : `${content.slice(0, call.index)}${call[1]}// Lock orientation before React Native loads\n${call[1]}${LOCKS[lock].swift}\n\n${content.slice(call.index)}`;
  const withImport = addSwiftImport(result);
  return withImport == null
    ? { error: 'No import statements found.' }
    : { content: withImport };
}

function addKotlinImport(content, importName) {
  const code = sourceView(content, { language: 'kotlin' });
  if (
    new RegExp(`^import ${importName.replace(/\./g, '\\.')}[ \\t]*$`, 'm').test(
      code
    )
  )
    return content;
  const imports = [...code.matchAll(/^import [A-Za-z0-9_.]+[ \t]*$/gm)];
  const last =
    imports[imports.length - 1] ??
    code.match(/^package [A-Za-z0-9_.]+[ \t]*$/m);
  if (last == null) return null;
  const end = last.index + last[0].length;
  return `${content.slice(0, end)}\n${imports.length === 0 ? '\n' : ''}import ${importName}${content.slice(end)}`;
}

/** Optional: lock in MainActivity.onCreate, before its direct super.onCreate call. */
function addKotlinEarlyLock(content, lock) {
  const code = sourceView(content, { language: 'kotlin' });
  const classes = typeBodies(code, 'MainActivity');
  if (classes.length !== 1)
    return { error: 'No unique class MainActivity found in MainActivity.kt.' };
  const onCreates = methods(code, 'MainActivity', 'kotlin').filter(
    (method) => method.match[1] === 'onCreate'
  );
  let result = content;
  if (onCreates.length > 0) {
    const method = onCreates[0];
    const supers = [
      ...code.matchAll(/^([ \t]*)super\s*\.\s*onCreate\s*\(/gm),
    ].filter(
      (call) =>
        call.index >= method.start &&
        call.index < method.end &&
        depthAt(code, method.start, call.index) === 0
    );
    if (onCreates.length !== 1 || supers.length !== 1)
      return {
        error:
          'MainActivity.onCreate has no unique direct super.onCreate call; add the early lock manually.',
      };
    const call = supers[0];
    const existing = existingEarlyLock(
      content,
      code,
      /\bOrientationTurbo\s*\.\s*lockTo(?:Portrait|Landscape)\s*\(/g,
      method,
      call.index,
      lock,
      'Kotlin'
    );
    if (existing?.error) return existing;
    if (!existing)
      result = `${content.slice(0, call.index)}${call[1]}${LOCKS[lock].kotlin}\n${content.slice(call.index)}`;
  } else {
    if (
      /\bOrientationTurbo\s*\.\s*lockTo(?:Portrait|Landscape)\s*\(/.test(code)
    ) {
      return { error: ambiguousLockMessage(lock, 'Kotlin') };
    }
    if (!/:\s*ReactActivity\s*\(\s*\)/.test(classes[0].match[0])) {
      return {
        error:
          'MainActivity uses a custom startup; add the early lock manually.',
      };
    }
    const onCreate = `\n\n  override fun onCreate(savedInstanceState: Bundle?) {\n    // Lock orientation before React Native loads\n    ${LOCKS[lock].kotlin}\n    super.onCreate(savedInstanceState)\n  }`;
    result = `${content.slice(0, classes[0].start)}${onCreate}${content.slice(classes[0].start)}`;
    result = addKotlinImport(result, 'android.os.Bundle');
  }
  for (const name of [
    'com.orientationturbo.OrientationTurbo',
    LOCKS[lock].kotlinImport,
  ]) {
    if (name != null && result != null) result = addKotlinImport(result, name);
  }
  return result == null
    ? { error: 'No package or import statements found in MainActivity.kt.' }
    : { content: result };
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
    } else if (
      typeof fileName === 'function'
        ? fileName(entry.name)
        : entry.name === fileName
    ) {
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
      if (swiftStartups(appDelegateContent, 'AppDelegate').length > 0) {
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
      steps.push(planAppDelegate(appDelegate.file));

      if (lock != null) {
        const sceneDelegate = findOne(
          path.dirname(appDelegate.file),
          'SceneDelegate.swift'
        );
        const candidates = [appDelegate.file, sceneDelegate.file].filter(
          (file) => file != null
        );
        const startups = candidates.filter(
          (file) =>
            swiftStartups(
              fs.readFileSync(file, 'utf8'),
              path.basename(file, '.swift')
            ).length > 0
        );
        const startupFiles = candidates.filter((file) =>
          /\.startReactNative\s*\(/.test(
            sourceView(fs.readFileSync(file, 'utf8'))
          )
        );
        if (
          sceneDelegate.error ||
          startups.length !== 1 ||
          startupFiles.length !== 1
        ) {
          steps.push({
            platform: 'iOS',
            title: 'Early lock',
            status: 'failed',
            message:
              sceneDelegate.error ??
              'Could not identify one AppDelegate/SceneDelegate startup file; add the early lock manually.',
            manual: 'early-lock',
          });
        } else {
          const lockFile = startups[0];
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
              (content) =>
                addSwiftEarlyLock(
                  content,
                  lock,
                  path.basename(lockFile, '.swift')
                ),
              'early-lock',
              previous?.content
            )
          );
        }
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

function planAppDelegate(file) {
  const directory = path.dirname(file);
  const callbacks = findFiles(directory, (name) => name.endsWith('.swift'))
    .map((sibling) => {
      const content = fs.readFileSync(sibling, 'utf8');
      return {
        file: sibling,
        content,
        count: orientationCallbacks(sourceView(content)).length,
      };
    })
    .filter((entry) => entry.count > 0);
  const title = 'AppDelegate: supportedInterfaceOrientationsFor';
  const count = callbacks.reduce((total, entry) => total + entry.count, 0);
  if (count === 0 || (count === 1 && callbacks[0].file === file)) {
    return planFile('iOS', title, file, setupAppDelegate, 'appdelegate');
  }
  const existing = callbacks[0];
  const result = count === 1 ? setupAppDelegate(existing.content) : null;
  if (
    result &&
    !result.error &&
    addSwiftImport(existing.content) === existing.content
  ) {
    return result.content === existing.content
      ? { platform: 'iOS', title, file: existing.file, status: 'done' }
      : {
          platform: 'iOS',
          title,
          file: existing.file,
          status: 'change',
          content: result.content,
        };
  }
  return {
    platform: 'iOS',
    title,
    file: existing.file,
    status: 'failed',
    manual: 'appdelegate',
    message: `Existing orientation callback in ${callbacks.map((entry) => entry.file).join(', ')} requires manual review. Update the existing callback in that file; do not add another. ${result?.error ?? (count > 1 ? 'Several callbacks were found.' : 'Ensure import OrientationTurbo is present.')}`,
  };
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
  'appdelegate': `In AppDelegate (Swift), implement or update the existing callback:

    import OrientationTurbo

    func application(_ application: UIApplication, supportedInterfaceOrientationsFor window: UIWindow?) -> UIInterfaceOrientationMask {
      return OrientationTurbo.shared.getSupportedInterfaceOrientations(for: window)
    }`,
  'early-lock': `Import the library at file scope, then add the call before React Native starts (SceneDelegate, or AppDelegate in apps without one):

    import OrientationTurbo

    OrientationTurbo.shared.lockToPortrait()`,
  'android-early-lock': `Import the library at file scope, then add the call in MainActivity.onCreate before super.onCreate(savedInstanceState):

    import com.orientationturbo.OrientationTurbo

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
