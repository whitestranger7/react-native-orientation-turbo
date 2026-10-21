const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const { applyPlan, planSetup } = require('../setup');

const FIXTURES = path.join(__dirname, 'fixtures');
const CLI = path.join(__dirname, '..', 'react-native-orientation-turbo.js');

function makeApp(template) {
  const appRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), 'orientation-turbo-setup-')
  );
  fs.cpSync(path.join(FIXTURES, template), appRoot, { recursive: true });
  return appRoot;
}

const read = (appRoot, file) =>
  fs.readFileSync(path.join(appRoot, file), 'utf8');
const APP_DELEGATE = 'ios/HelloWorld/AppDelegate.swift';
const SCENE_DELEGATE = 'ios/HelloWorld/SceneDelegate.swift';
const MAIN_ACTIVITY =
  'android/app/src/main/java/com/helloworld/MainActivity.kt';

function runSetup(appRoot, lock) {
  const steps = planSetup({ appRoot, lock });
  applyPlan(steps);
  return steps;
}

describe('setup: callbacks in separate Swift files', () => {
  const extensionFile = 'ios/HelloWorld/AppDelegate+Orientation.swift';
  const fixture = fs.readFileSync(
    path.join(FIXTURES, 'AppDelegate+Orientation.swift'),
    'utf8'
  );

  it.each([
    ['current', ''],
    ['legacy', ''],
    ['current', 'Extensions/'],
    ['legacy', 'Extensions/'],
  ])(
    'handles a %s forwarding callback in %s without adding another',
    (version, subfolder) => {
      const appRoot = makeApp('rn-0.80');
      const file = `ios/HelloWorld/${subfolder}AppDelegate+Orientation.swift`;
      const content =
        version === 'legacy' ? fixture.replace('for: window', '') : fixture;
      fs.mkdirSync(path.dirname(path.join(appRoot, file)), { recursive: true });
      fs.writeFileSync(path.join(appRoot, file), content);
      const original = read(appRoot, APP_DELEGATE);
      const steps = planSetup({ appRoot });
      expect(
        steps.find((step) =>
          step.title.includes('supportedInterfaceOrientationsFor')
        )
      ).toMatchObject({
        status: version === 'legacy' ? 'change' : 'done',
        file: path.join(appRoot, file),
        ...(version === 'legacy' ? { content: fixture } : {}),
      });
      // Planning must not write the upgrade, even when the callback is nested.
      expect(read(appRoot, file)).toBe(content);
      applyPlan(steps);
      expect(read(appRoot, APP_DELEGATE)).toBe(original);
      expect(read(appRoot, file)).toBe(fixture);
      expect(runSetup(appRoot).some((step) => step.status === 'change')).toBe(
        false
      );
      expect(
        runSetup(appRoot, 'portrait').some((step) => step.status === 'failed')
      ).toBe(false);
      expect(read(appRoot, APP_DELEGATE)).not.toContain(
        'supportedInterfaceOrientationsFor'
      );
    }
  );

  it.each(['Pods', 'build', 'DerivedData', 'node_modules', '.hidden'])(
    'ignores callbacks in excluded directory %s',
    (directory) => {
      const appRoot = makeApp('rn-0.80');
      const folder = path.join(appRoot, 'ios/HelloWorld', directory);
      fs.mkdirSync(folder);
      fs.writeFileSync(
        path.join(folder, 'AppDelegate+Orientation.swift'),
        fixture
      );
      expect(runSetup(appRoot).some((step) => step.status === 'failed')).toBe(
        false
      );
      expect(read(appRoot, APP_DELEGATE)).toContain(
        'supportedInterfaceOrientationsFor'
      );
    }
  );

  it('reports callbacks duplicated across subfolders without editing either file', () => {
    const appRoot = makeApp('rn-0.80');
    const folder = path.join(appRoot, 'ios/HelloWorld/Extensions');
    fs.mkdirSync(folder);
    fs.writeFileSync(
      path.join(folder, 'AppDelegate+Orientation.swift'),
      fixture
    );
    fs.appendFileSync(path.join(appRoot, APP_DELEGATE), fixture);
    const original = read(appRoot, APP_DELEGATE);
    const step = runSetup(appRoot).find((entry) =>
      entry.title.includes('supportedInterfaceOrientationsFor')
    );
    expect(step.status).toBe('failed');
    expect(step.message).toContain('Several callbacks');
    expect(read(appRoot, APP_DELEGATE)).toBe(original);
    expect(
      fs.readFileSync(
        path.join(folder, 'AppDelegate+Orientation.swift'),
        'utf8'
      )
    ).toBe(fixture);
  });

  it.each([
    'custom',
    'async',
    'throws',
    'return-type',
    'missing-import',
    'duplicate',
  ])(
    'requires manual review for a %s callback without appending one',
    (kind) => {
      const appRoot = makeApp('rn-0.80');
      let content = fixture;
      if (kind === 'custom')
        content = content.replace(
          'OrientationTurbo.shared.getSupportedInterfaceOrientations(for: window)',
          '.portrait'
        );
      if (kind === 'async' || kind === 'throws')
        content = content.replace(
          ' -> UIInterfaceOrientationMask',
          ` ${kind} -> UIInterfaceOrientationMask`
        );
      if (kind === 'return-type')
        content = content.replace(
          '-> UIInterfaceOrientationMask',
          '-> (UIInterfaceOrientationMask)'
        );
      if (kind === 'missing-import')
        content = content.replace(
          'import OrientationTurbo',
          '// import OrientationTurbo'
        );
      fs.writeFileSync(path.join(appRoot, extensionFile), content);
      if (kind === 'duplicate')
        fs.appendFileSync(path.join(appRoot, APP_DELEGATE), fixture);
      const original = read(appRoot, APP_DELEGATE);
      const steps = runSetup(appRoot);
      const callback = steps.find((step) =>
        step.title.includes('supportedInterfaceOrientationsFor')
      );
      expect(callback.status).toBe('failed');
      expect(callback.message).toContain('AppDelegate+Orientation.swift');
      expect(callback.message).toContain('manual');
      expect(read(appRoot, APP_DELEGATE)).toBe(original);
      expect(read(appRoot, extensionFile)).toBe(content);
    }
  );

  it('ignores a sibling callback inside a comment', () => {
    const appRoot = makeApp('rn-0.80');
    fs.writeFileSync(path.join(appRoot, extensionFile), `/*${fixture}*/`);
    expect(runSetup(appRoot).some((step) => step.status === 'failed')).toBe(
      false
    );
    expect(read(appRoot, APP_DELEGATE)).toContain(
      'supportedInterfaceOrientationsFor'
    );
  });
});

describe('setup: RN 0.80 template (AppDelegate-only)', () => {
  it('adds the import and supportedInterfaceOrientationsFor to AppDelegate', () => {
    const appRoot = makeApp('rn-0.80');
    const steps = runSetup(appRoot);

    expect(steps.every((step) => step.status !== 'failed')).toBe(true);
    const appDelegate = read(appRoot, APP_DELEGATE);
    expect(appDelegate).toContain(
      'import ReactAppDependencyProvider\nimport OrientationTurbo'
    );
    expect(appDelegate).toContain(
      'supportedInterfaceOrientationsFor window: UIWindow?) -> UIInterfaceOrientationMask'
    );
    expect(appDelegate).toContain(
      'return OrientationTurbo.shared.getSupportedInterfaceOrientations(for: window)'
    );
  });

  it('puts the early lock before startReactNative in AppDelegate and in MainActivity.onCreate', () => {
    const appRoot = makeApp('rn-0.80');
    runSetup(appRoot, 'landscape-left');

    const appDelegate = read(appRoot, APP_DELEGATE);
    expect(appDelegate).toMatch(
      /OrientationTurbo\.shared\.lockToLandscape\(\.left\)\n\n\s+factory\.startReactNative\(/
    );
    expect(appDelegate.match(/import OrientationTurbo/g)).toHaveLength(1);

    const mainActivity = read(appRoot, MAIN_ACTIVITY);
    expect(mainActivity).toContain('import android.os.Bundle');
    expect(mainActivity).toContain(
      'import com.orientationturbo.OrientationTurbo'
    );
    expect(mainActivity).toContain(
      'import com.orientationturbo.enums.LandscapeDirection'
    );
    expect(mainActivity).toMatch(
      /override fun onCreate\(savedInstanceState: Bundle\?\) \{[\s\S]*OrientationTurbo\.lockToLandscape\(this, LandscapeDirection\.LEFT\)\n\s+super\.onCreate\(savedInstanceState\)/
    );
  });

  it('is idempotent', () => {
    const appRoot = makeApp('rn-0.80');
    runSetup(appRoot, 'portrait');
    const first = [read(appRoot, APP_DELEGATE), read(appRoot, MAIN_ACTIVITY)];

    const second = runSetup(appRoot, 'portrait');
    expect(second.filter((step) => step.status === 'change')).toHaveLength(0);
    expect([read(appRoot, APP_DELEGATE), read(appRoot, MAIN_ACTIVITY)]).toEqual(
      first
    );
  });

  it('uses actual startup code rather than a SceneDelegate file containing only an example', () => {
    const appRoot = makeApp('rn-0.80');
    fs.writeFileSync(
      path.join(appRoot, SCENE_DELEGATE),
      '/* class SceneDelegate { func scene() { factory.startReactNative() } } */\n'
    );
    const steps = runSetup(appRoot, 'portrait');
    expect(steps.some((step) => step.status === 'failed')).toBe(false);
    expect(read(appRoot, APP_DELEGATE)).toContain(
      'OrientationTurbo.shared.lockToPortrait()'
    );
    expect(read(appRoot, SCENE_DELEGATE)).not.toContain('OrientationTurbo');
  });

  it('reports ambiguous real startup files without selecting one arbitrarily', () => {
    const appRoot = makeApp('rn-0.80');
    fs.copyFileSync(
      path.join(FIXTURES, 'rn-0.88', SCENE_DELEGATE),
      path.join(appRoot, SCENE_DELEGATE)
    );
    const steps = planSetup({ appRoot, lock: 'portrait' });
    expect(steps.find((step) => step.title === 'Early lock').status).toBe(
      'failed'
    );
    expect(read(appRoot, APP_DELEGATE)).not.toContain('OrientationTurbo');
    expect(read(appRoot, SCENE_DELEGATE)).not.toContain('OrientationTurbo');
  });

  it('upgrades the handwritten 2.x callback to pass its window and stays idempotent', () => {
    const appRoot = makeApp('rn-0.80');
    runSetup(appRoot);
    const file = path.join(appRoot, APP_DELEGATE);
    fs.writeFileSync(
      file,
      read(appRoot, APP_DELEGATE).replace(
        'getSupportedInterfaceOrientations(for: window)',
        'getSupportedInterfaceOrientations()'
      )
    );

    runSetup(appRoot);
    expect(read(appRoot, APP_DELEGATE)).toContain(
      'getSupportedInterfaceOrientations(for: window)'
    );
    expect(
      read(appRoot, APP_DELEGATE).match(/supportedInterfaceOrientationsFor/g)
    ).toHaveLength(1);
    expect(
      runSetup(appRoot).filter((step) => step.status === 'change')
    ).toHaveLength(0);
  });

  it('uses the existing callback parameter name when upgrading', () => {
    const appRoot = makeApp('rn-0.80');
    runSetup(appRoot);
    const file = path.join(appRoot, APP_DELEGATE);
    fs.writeFileSync(
      file,
      read(appRoot, APP_DELEGATE)
        .replace('For window: UIWindow?', 'For targetWindow: UIWindow?')
        .replace(
          'getSupportedInterfaceOrientations(for: window)',
          'getSupportedInterfaceOrientations()'
        )
    );

    runSetup(appRoot);
    expect(read(appRoot, APP_DELEGATE)).toContain(
      'getSupportedInterfaceOrientations(for: targetWindow)'
    );
    expect(
      runSetup(appRoot).filter((step) => step.status === 'change')
    ).toHaveLength(0);
  });
});

describe('setup: RN 0.88 template (SceneDelegate)', () => {
  it('adds supportedInterfaceOrientationsFor to AppDelegate and the early lock to SceneDelegate', () => {
    const appRoot = makeApp('rn-0.88');
    const steps = runSetup(appRoot, 'portrait');

    expect(steps.map((step) => step.status)).not.toContain('failed');
    expect(read(appRoot, APP_DELEGATE)).toContain(
      'return OrientationTurbo.shared.getSupportedInterfaceOrientations(for: window)'
    );
    expect(read(appRoot, APP_DELEGATE)).not.toContain('lockToPortrait');

    const sceneDelegate = read(appRoot, SCENE_DELEGATE);
    expect(sceneDelegate).toContain('import OrientationTurbo');
    expect(sceneDelegate).toMatch(
      /OrientationTurbo\.shared\.lockToPortrait\(\)\n\n\s+reactNativeFactory\?\.startReactNative\(/
    );

    expect(read(appRoot, MAIN_ACTIVITY)).toContain(
      'OrientationTurbo.lockToPortrait(this)'
    );
  });
});

describe('setup: failures', () => {
  it('reports an existing custom supportedInterfaceOrientationsFor and leaves the file unchanged', () => {
    const appRoot = makeApp('rn-0.80');
    const file = path.join(appRoot, APP_DELEGATE);
    const custom = `${fs.readFileSync(file, 'utf8')}
extension AppDelegate {
  func application(_ application: UIApplication, supportedInterfaceOrientationsFor window: UIWindow?) -> UIInterfaceOrientationMask {
    return .portrait
  }
}
`;
    fs.writeFileSync(file, custom);

    const steps = runSetup(appRoot);
    expect(
      steps.find((step) => step.title.startsWith('AppDelegate')).status
    ).toBe('failed');
    expect(fs.readFileSync(file, 'utf8')).toBe(custom);
  });

  it('reports an Objective-C AppDelegate', () => {
    const appRoot = makeApp('rn-0.80');
    fs.renameSync(
      path.join(appRoot, APP_DELEGATE),
      path.join(appRoot, 'ios/HelloWorld/AppDelegate.mm')
    );

    const steps = planSetup({ appRoot });
    const ios = steps.find((step) => step.platform === 'iOS');
    expect(ios.status).toBe('failed');
    expect(ios.message).toContain('Objective-C AppDelegate');
  });

  it('reports a Java MainActivity when an early lock is requested', () => {
    const appRoot = makeApp('rn-0.80');
    fs.renameSync(
      path.join(appRoot, MAIN_ACTIVITY),
      path.join(appRoot, MAIN_ACTIVITY.replace('.kt', '.java'))
    );

    const steps = planSetup({ appRoot, lock: 'portrait' });
    expect(steps.find((step) => step.platform === 'Android').status).toBe(
      'failed'
    );
  });
});

describe('CLI', () => {
  const run = (args, appRoot) => {
    try {
      return {
        code: 0,
        output: execFileSync('node', [CLI, ...args], {
          cwd: appRoot,
          encoding: 'utf8',
        }),
      };
    } catch (error) {
      return { code: error.status, output: `${error.stdout}${error.stderr}` };
    }
  };

  it('writes nothing in --dry-run', () => {
    const appRoot = makeApp('rn-0.88');
    const before = read(appRoot, APP_DELEGATE);
    const { code, output } = run(['setup', '--dry-run'], appRoot);

    expect(code).toBe(0);
    expect(output).toContain('would change');
    expect(read(appRoot, APP_DELEGATE)).toBe(before);
  });

  it('ignores commented integration in dry runs, writes real setup, and stays idempotent', () => {
    const appRoot = makeApp('rn-0.80');
    for (const [file, example] of [
      [APP_DELEGATE, 'commented-integration.swift'],
      [MAIN_ACTIVITY, 'commented-integration.kt'],
    ]) {
      fs.appendFileSync(
        path.join(appRoot, file),
        fs.readFileSync(path.join(FIXTURES, example), 'utf8')
      );
    }
    const before = [read(appRoot, APP_DELEGATE), read(appRoot, MAIN_ACTIVITY)];
    const dry = run(['setup', '--lock', 'portrait', '--dry-run'], appRoot);
    expect(dry.code).toBe(0);
    expect(dry.output).toContain('would change');
    expect([read(appRoot, APP_DELEGATE), read(appRoot, MAIN_ACTIVITY)]).toEqual(
      before
    );
    expect(run(['setup', '--lock', 'portrait'], appRoot).code).toBe(0);
    const after = [read(appRoot, APP_DELEGATE), read(appRoot, MAIN_ACTIVITY)];
    const repeat = run(['setup', '--lock', 'portrait'], appRoot);
    expect(repeat.code).toBe(0);
    expect(repeat.output).not.toContain('— updated');
    expect([read(appRoot, APP_DELEGATE), read(appRoot, MAIN_ACTIVITY)]).toEqual(
      after
    );
  });

  it('fails clearly when --lock differs from the installed lock and preserves both files', () => {
    const appRoot = makeApp('rn-0.80');
    runSetup(appRoot, 'portrait');
    const before = [read(appRoot, APP_DELEGATE), read(appRoot, MAIN_ACTIVITY)];
    const result = run(['setup', '--lock', 'landscape-left'], appRoot);
    expect(result.code).toBe(1);
    expect(result.output).toContain(
      'Existing early lock is portrait; requested --lock landscape-left'
    );
    expect(result.output).toContain('Setup was not successful');
    expect(result.output).toContain(
      'OrientationTurbo.shared.lockToLandscape(.left)'
    );
    expect(result.output).toContain(
      'OrientationTurbo.lockToLandscape(this, LandscapeDirection.LEFT)'
    );
    expect([read(appRoot, APP_DELEGATE), read(appRoot, MAIN_ACTIVITY)]).toEqual(
      before
    );
  });

  it.each([
    ['portrait', null],
    ['portrait-upside-down', 'PortraitDirection'],
    ['landscape-left', 'LandscapeDirection'],
  ])(
    'prints the required imports for manual --lock %s steps',
    (lock, direction) => {
      const appRoot = makeApp('rn-0.88');
      fs.writeFileSync(
        path.join(appRoot, SCENE_DELEGATE),
        'import UIKit\nclass SceneDelegate {}'
      );
      fs.renameSync(
        path.join(appRoot, MAIN_ACTIVITY),
        path.join(appRoot, MAIN_ACTIVITY.replace('.kt', '.java'))
      );
      const result = run(['setup', '--lock', lock, '--dry-run'], appRoot);
      expect(result.code).toBe(1);
      expect(result.output).toContain('import OrientationTurbo');
      expect(result.output).toContain(
        'import com.orientationturbo.OrientationTurbo'
      );
      if (direction)
        expect(result.output).toContain(
          `import com.orientationturbo.enums.${direction}`
        );
    }
  );

  it('warns legacy apps about SDK 27 on setup, repeat runs and dry runs without blocking older SDKs', () => {
    const appRoot = makeApp('rn-0.80');
    // A file on disk does not establish that the app adopted the scene lifecycle.
    fs.writeFileSync(
      path.join(appRoot, SCENE_DELEGATE),
      '// Not configured yet\n'
    );
    for (const args of [['setup', '--dry-run'], ['setup'], ['setup']]) {
      const { code, output } = run(args, appRoot);
      expect(code).toBe(0);
      expect(output).toContain('iOS 27 SDK or newer');
      expect(output).toContain('does not migrate the app lifecycle');
      expect(output).toContain('docs/IOS_SCENES.md');
    }
    expect(read(appRoot, APP_DELEGATE)).toContain('startReactNative(');
    expect(read(appRoot, APP_DELEGATE)).toContain(
      'supportedInterfaceOrientationsFor'
    );
  });

  it('does not diagnose the scene template as starting React Native in AppDelegate', () => {
    const { code, output } = run(['setup'], makeApp('rn-0.88'));
    expect(code).toBe(0);
    expect(output).not.toContain('React Native starts in AppDelegate');
    expect(output).toContain('Orientation setup complete');
  });

  it('exits with 1 and prints the manual steps when a step fails', () => {
    const appRoot = makeApp('rn-0.80');
    fs.renameSync(
      path.join(appRoot, APP_DELEGATE),
      path.join(appRoot, 'ios/HelloWorld/AppDelegate.mm')
    );
    const { code, output } = run(['setup'], appRoot);

    expect(code).toBe(1);
    expect(output).toContain('Setup was not successful');
    expect(output).toContain('getSupportedInterfaceOrientations(for: window)');
  });

  it.each(['sideways', 'constructor', 'toString', '__proto__'])(
    'rejects invalid --lock %s without writing files',
    (lock) => {
      const appRoot = makeApp('rn-0.80');
      const before = [
        read(appRoot, APP_DELEGATE),
        read(appRoot, MAIN_ACTIVITY),
      ];
      const { code } = run(['setup', '--lock', lock], appRoot);
      expect(code).toBe(2);
      expect([
        read(appRoot, APP_DELEGATE),
        read(appRoot, MAIN_ACTIVITY),
      ]).toEqual(before);
    }
  );
});
