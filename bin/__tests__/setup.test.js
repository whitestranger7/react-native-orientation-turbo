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
      'return OrientationTurbo.shared.getSupportedInterfaceOrientations()'
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
});

describe('setup: RN 0.88 template (SceneDelegate)', () => {
  it('adds supportedInterfaceOrientationsFor to AppDelegate and the early lock to SceneDelegate', () => {
    const appRoot = makeApp('rn-0.88');
    const steps = runSetup(appRoot, 'portrait');

    expect(steps.map((step) => step.status)).not.toContain('failed');
    expect(read(appRoot, APP_DELEGATE)).toContain(
      'return OrientationTurbo.shared.getSupportedInterfaceOrientations()'
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
    expect(steps.find((step) => step.platform === 'iOS').status).toBe('failed');
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

  it('exits with 1 and prints the manual steps when a step fails', () => {
    const appRoot = makeApp('rn-0.80');
    fs.renameSync(
      path.join(appRoot, APP_DELEGATE),
      path.join(appRoot, 'ios/HelloWorld/AppDelegate.mm')
    );
    const { code, output } = run(['setup'], appRoot);

    expect(code).toBe(1);
    expect(output).toContain('Setup was not successful');
    expect(output).toContain('getSupportedInterfaceOrientations()');
  });

  it('rejects an invalid --lock value', () => {
    const { code } = run(['setup', '--lock', 'sideways'], makeApp('rn-0.80'));
    expect(code).toBe(2);
  });
});
