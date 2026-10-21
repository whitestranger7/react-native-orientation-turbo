const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const runner = path.resolve(__dirname, '../compat-test.sh');
const configure = path.resolve(__dirname, '../compat-android-agp9.js');

it.each([
  ['0.88.0', '--frameworks', 'unknown'],
  ['0.88.0', '--frameworks', 'dynamic', '--skip-ios'],
  ['0.80.0', '--android-agp9'],
  ['0.88.0', '--android-agp9', '--skip-android'],
])('rejects an unavailable requested configuration: %s %s %s %s', (...args) => {
  const result = spawnSync('bash', [runner, ...args], { encoding: 'utf8' });
  expect(result.status).toBe(2);
  expect(result.stderr).toMatch(/--frameworks|--android-agp9/);
  expect(result.stdout).not.toContain('pack library');
});

describe('AGP 9 consumer migration', () => {
  let app;
  const properties =
    'android.builtInKotlin=false\nandroid.newDsl=false\nhermesEnabled=true\n';
  const build =
    'apply plugin: "com.android.application"\napply plugin: "org.jetbrains.kotlin.android"\napply plugin: "com.facebook.react"\n';
  const read = (name) => fs.readFileSync(path.join(app, name), 'utf8');
  const write = (name, content) =>
    fs.writeFileSync(path.join(app, name), content);
  const run = () =>
    spawnSync(process.execPath, [configure, app], { encoding: 'utf8' });

  beforeEach(() => {
    app = fs.mkdtempSync(path.join(os.tmpdir(), 'compat-agp9-'));
    fs.mkdirSync(path.join(app, 'node_modules/react-native'), {
      recursive: true,
    });
    fs.mkdirSync(path.join(app, 'android/app'), { recursive: true });
    write(
      'node_modules/react-native/package.json',
      JSON.stringify({ version: '0.88.0' })
    );
    write('android/gradle.properties', properties);
    write('android/app/build.gradle', build);
  });
  afterEach(() => fs.rmSync(app, { recursive: true, force: true }));

  it('migrates only the host and adds verification of both Kotlin modules', () => {
    expect(run().status).toBe(0);
    expect(read('android/gradle.properties')).toContain(
      'android.builtInKotlin=true\nandroid.newDsl=true'
    );
    expect(read('android/gradle.properties')).toContain('hermesEnabled=true');
    expect(read('android/app/build.gradle')).not.toContain(
      'apply plugin: "org.jetbrains.kotlin.android"'
    );
    expect(read('android/app/build.gradle')).toContain(
      'rootProject.project(":react-native-orientation-turbo")'
    );
    expect(read('android/app/build.gradle')).toContain(
      'verifyOrientationTurboAgp9'
    );
    expect(read('node_modules/react-native/package.json')).toBe(
      JSON.stringify({ version: '0.88.0' })
    );
  });

  it.each(['template', 'version', 'plugin'])(
    'fails without partial edits when the %s changes',
    (change) => {
      if (change === 'template')
        write('android/gradle.properties', 'hermesEnabled=true\n');
      if (change === 'version')
        write('node_modules/react-native/package.json', '{"version":"0.80.0"}');
      if (change === 'plugin')
        write(
          'android/app/build.gradle',
          build.replace(
            'apply plugin: "org.jetbrains.kotlin.android"',
            '// custom startup'
          )
        );
      const before = [
        read('android/gradle.properties'),
        read('android/app/build.gradle'),
      ];
      expect(run().status).not.toBe(0);
      expect([
        read('android/gradle.properties'),
        read('android/app/build.gradle'),
      ]).toEqual(before);
    }
  );
});
