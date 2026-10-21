const fs = require('fs');
const path = require('path');
const {
  setupAppDelegate,
  addSwiftEarlyLock,
  addKotlinEarlyLock,
} = require('../setup');
const { sourceView } = require('../native-source');

const fixture = (name) =>
  fs.readFileSync(path.join(__dirname, 'fixtures', name), 'utf8');
const swift = () => fixture('rn-0.80/ios/HelloWorld/AppDelegate.swift');
const kotlin = () =>
  fixture('rn-0.80/android/app/src/main/java/com/helloworld/MainActivity.kt');
const swiftCallback = (body) => `
extension AppDelegate {
  func application(_ application: UIApplication, supportedInterfaceOrientationsFor window: UIWindow?) -> UIInterfaceOrientationMask {
    ${body}
  }
}
`;
const kotlinOnCreate = (body) =>
  kotlin().replace(
    'class MainActivity : ReactActivity() {',
    `class MainActivity : ReactActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    ${body}
  }
`
  );

describe('setup inspects executable native source', () => {
  it('ignores Swift TODOs, nested comments, raw strings and interpolated examples without changing them', () => {
    const examples = fixture('commented-integration.swift');
    const callback = setupAppDelegate(swift() + examples);
    expect(callback.error).toBeUndefined();
    const result = addSwiftEarlyLock(callback.content, 'portrait');
    expect(result.error).toBeUndefined();
    expect(result.content).toContain(examples);
    const code = sourceView(result.content);
    expect(
      code.match(/getSupportedInterfaceOrientations\(for: window\)/g)
    ).toHaveLength(1);
    expect(
      code.match(/OrientationTurbo\.shared\.lockToPortrait\(\)/g)
    ).toHaveLength(1);
    expect(code.match(/^import OrientationTurbo$/gm)).toHaveLength(1);
    expect(code.indexOf('lockToPortrait()')).toBeLessThan(
      code.indexOf('factory.startReactNative')
    );
    expect(addSwiftEarlyLock(result.content, 'portrait').content).toBe(
      result.content
    );
    expect(setupAppDelegate(result.content).content).toBe(result.content);
  });

  it('ignores Kotlin comments and string examples and inserts into the actual MainActivity', () => {
    const examples = fixture('commented-integration.kt');
    const result = addKotlinEarlyLock(kotlin() + examples, 'landscape-left');
    expect(result.error).toBeUndefined();
    expect(result.content).toContain(examples);
    const code = sourceView(result.content, { language: 'kotlin' });
    expect(
      code.match(
        /OrientationTurbo\.lockToLandscape\(this, LandscapeDirection.LEFT\)/g
      )
    ).toHaveLength(1);
    expect(code.match(/override fun onCreate/g)).toHaveLength(1);
    expect(
      code.match(/^import com.orientationturbo.OrientationTurbo$/gm)
    ).toHaveLength(1);
    expect(addKotlinEarlyLock(result.content, 'landscape-left').content).toBe(
      result.content
    );
  });

  it('does not accept a commented library return as a real callback implementation', () => {
    const content =
      swift() +
      swiftCallback(
        '// return OrientationTurbo.shared.getSupportedInterfaceOrientations(for: window)\n    return .portrait'
      );
    expect(setupAppDelegate(content).error).toContain('custom or ambiguous');
  });

  it('does not accept an unrelated library call as a custom callback implementation', () => {
    const content =
      swift() +
      swiftCallback('return .portrait') +
      `
extension AppDelegate {
  func helper(window: UIWindow?) { _ = OrientationTurbo.shared.getSupportedInterfaceOrientations(for: window) }
}`;
    expect(setupAppDelegate(content).error).toContain('custom or ambiguous');
  });

  it('does not accept a forwarding callback on a different type', () => {
    const content =
      swift() +
      swiftCallback(
        'return OrientationTurbo.shared.getSupportedInterfaceOrientations(for: window)'
      ).replace('extension AppDelegate', 'class OtherDelegate');
    const result = setupAppDelegate(content);
    expect(result.error).toBeUndefined();
    expect(result.content).toContain('extension AppDelegate');
    expect(
      sourceView(result.content).match(
        /getSupportedInterfaceOrientations\(for: window\)/g
      )
    ).toHaveLength(2);
  });

  it('requires the callback to forward its actual window parameter', () => {
    expect(
      setupAppDelegate(
        swift() +
          swiftCallback(
            'return OrientationTurbo.shared.getSupportedInterfaceOrientations(for: nil)'
          )
      ).error
    ).toContain('custom or ambiguous');
  });

  it('upgrades an actual 2.x callback while preserving inline comments and adding a missing import', () => {
    const content =
      swift() +
      swiftCallback(
        'return /* runtime mask */ OrientationTurbo.shared.getSupportedInterfaceOrientations(/* window follows */)'
      );
    const result = setupAppDelegate(content);
    expect(result.content).toContain(
      'getSupportedInterfaceOrientations(for: window/* window follows */)'
    );
    expect(result.content).toContain('/* runtime mask */');
    expect(result.content).toContain('import OrientationTurbo');
    expect(setupAppDelegate(result.content).content).toBe(result.content);
  });

  it('adds a missing import even if a current callback already exists', () => {
    const result = setupAppDelegate(
      swift() +
        swiftCallback(
          'return OrientationTurbo.shared.getSupportedInterfaceOrientations(for: window)'
        )
    );
    expect(
      sourceView(result.content).match(/^import OrientationTurbo$/gm)
    ).toHaveLength(1);
  });

  it.each(['async', 'throws', 'unusual-return'])(
    'rejects a %s callback signature instead of adding a duplicate',
    (signature) => {
      let callback = swiftCallback(
        'return OrientationTurbo.shared.getSupportedInterfaceOrientations(for: window)'
      );
      callback =
        signature === 'unusual-return'
          ? callback.replace(
              '-> UIInterfaceOrientationMask',
              '-> (UIInterfaceOrientationMask)'
            )
          : callback.replace(
              '-> UIInterfaceOrientationMask',
              `${signature} -> UIInterfaceOrientationMask`
            );
      expect(setupAppDelegate(swift() + callback).error).toContain(
        'unsupported'
      );
    }
  );

  it.each(['current', 'legacy', 'custom'])(
    'recognizes a %s Swift callback with an escaped method name',
    (version) => {
      const body =
        version === 'custom'
          ? 'return .portrait'
          : `return OrientationTurbo.shared.getSupportedInterfaceOrientations(${version === 'legacy' ? '' : 'for: window'})`;
      const content =
        swift() +
        swiftCallback(body).replace('func application(', 'func `application`(');
      const result = setupAppDelegate(content);
      if (version === 'custom') {
        expect(result.error).toContain('custom or ambiguous');
      } else {
        expect(result.error).toBeUndefined();
        expect(result.content).toContain('func `application`(');
        expect(
          result.content.match(/supportedInterfaceOrientationsFor/g)
        ).toHaveLength(1);
        expect(result.content).toContain(
          'getSupportedInterfaceOrientations(for: window)'
        );
        expect(setupAppDelegate(result.content).content).toBe(result.content);
      }
    }
  );

  it.each(['onCreate', '`onCreate`'])(
    'refuses an expression-bodied Kotlin %s instead of adding a second override',
    (name) => {
      const content = kotlin().replace(
        'class MainActivity : ReactActivity() {',
        `class MainActivity : ReactActivity() {\n  override fun ${name}(state: android.os.Bundle?) = super.onCreate(state)`
      );
      const result = addKotlinEarlyLock(content, 'portrait');
      expect(result.error).toContain(
        'unsupported signature or expression body'
      );
      expect(result.content).toBeUndefined();
    }
  );

  it('inserts into an escaped block-bodied Kotlin onCreate without duplicating it', () => {
    const content = kotlinOnCreate(
      'super.onCreate(savedInstanceState)'
    ).replace('fun onCreate(', 'fun `onCreate`(');
    const result = addKotlinEarlyLock(content, 'portrait');
    expect(result.error).toBeUndefined();
    expect(result.content).toContain('fun `onCreate`(');
    expect(result.content).toContain(
      'OrientationTurbo.lockToPortrait(this)\n    super.onCreate(savedInstanceState)'
    );
    expect(addKotlinEarlyLock(result.content, 'portrait').content).toBe(
      result.content
    );
  });

  it('preserves a runtime Kotlin lock when onCreate is absent and gives safe advice', () => {
    const content = kotlin().replace(
      'class MainActivity : ReactActivity() {',
      'class MainActivity : ReactActivity() {\n  fun enterVideo() { OrientationTurbo.lockToLandscape(this, LandscapeDirection.LEFT) }'
    );
    const result = addKotlinEarlyLock(content, 'portrait');
    expect(result.error).toContain("setup can't tell");
    expect(result.error).toContain(
      'Add OrientationTurbo.lockToPortrait(this) before super.onCreate'
    );
    expect(result.error).toContain('run setup without --lock');
    expect(result.error).not.toContain('Move');
  });

  it('does not count a conditional import as unconditional integration', () => {
    const result = setupAppDelegate(
      swift() +
        '\n#if DEBUG\nimport OrientationTurbo\n#endif\n' +
        swiftCallback(
          'return OrientationTurbo.shared.getSupportedInterfaceOrientations(for: window)'
        )
    );
    expect(result.error).toBeUndefined();
    expect(result.content).toContain(
      'import ReactAppDependencyProvider\nimport OrientationTurbo'
    );
  });

  it('requires manual review of a conditionally compiled orientation callback', () => {
    const content =
      swift() +
      '\n#if DEBUG\n' +
      swiftCallback(
        'return OrientationTurbo.shared.getSupportedInterfaceOrientations(for: window)'
      ) +
      '\n#endif\n';
    expect(setupAppDelegate(content).error).toContain('custom or ambiguous');
  });

  it('does not count a conditionally compiled Swift lock as an installed early lock', () => {
    const content = swift().replace(
      '    factory.startReactNative(',
      '    #if DEBUG\n    OrientationTurbo.shared.lockToPortrait()\n    #endif\n    factory.startReactNative('
    );
    expect(addSwiftEarlyLock(content, 'portrait').error).toContain(
      "setup can't tell"
    );
  });

  it('does not treat a string containing a class declaration as the AppDelegate', () => {
    expect(
      setupAppDelegate('import UIKit\nlet example = "class AppDelegate {}"')
        .error
    ).toContain('No `class AppDelegate`');
  });

  it.each([
    ['portrait', 'OrientationTurbo.shared.lockToPortrait()'],
    ['landscape-left', 'OrientationTurbo.shared.lockToLandscape("LEFT")'],
    [
      'portrait-upside-down',
      'OrientationTurbo.shared.lockToPortrait(.upsideDown)',
    ],
  ])('accepts a matching executable Swift early lock (%s)', (lock, call) => {
    const content = swift().replace(
      '    factory.startReactNative(',
      `    ${call}\n    factory.startReactNative(`
    );
    const result = addSwiftEarlyLock(content, lock);
    expect(result.error).toBeUndefined();
    expect(
      sourceView(result.content).match(/OrientationTurbo\.shared\.lockTo/g)
    ).toHaveLength(1);
    expect(addSwiftEarlyLock(result.content, lock).content).toBe(
      result.content
    );
  });

  it('reports a different Swift early-lock choice instead of claiming the requested one is installed', () => {
    const content = swift().replace(
      '    factory.startReactNative(',
      '    OrientationTurbo.shared.lockToPortrait()\n    factory.startReactNative('
    );
    expect(addSwiftEarlyLock(content, 'landscape-right').error).toContain(
      'Existing early lock is portrait; requested --lock landscape-right'
    );
  });

  it('rejects Swift locks after startup or inside a helper/conditional', () => {
    for (const content of [
      swift().replace(
        '    return true',
        '    OrientationTurbo.shared.lockToPortrait()\n    return true'
      ),
      swift() +
        '\nextension AppDelegate { func helper() { OrientationTurbo.shared.lockToPortrait() } }',
      swift().replace(
        '    factory.startReactNative(',
        '    if shouldLock { OrientationTurbo.shared.lockToPortrait() }\n    factory.startReactNative('
      ),
    ]) {
      expect(addSwiftEarlyLock(content, 'portrait').error).toContain(
        "setup can't tell"
      );
    }
  });

  it('does not use a commented or conditional Swift startup call as an insertion point', () => {
    expect(
      addSwiftEarlyLock(
        swift().replace(
          '    factory.startReactNative(',
          '    // factory.startReactNative('
        ),
        'portrait'
      ).error
    ).toContain('Could not identify');
    expect(
      addSwiftEarlyLock(
        swift()
          .replace(
            '    factory.startReactNative(',
            '    if shouldStart {\n    factory.startReactNative('
          )
          .replace('    return true', '    }\n    return true'),
        'portrait'
      ).error
    ).toContain('Could not identify');
  });

  it('reports a different Kotlin early lock without overwriting it', () => {
    const content = kotlinOnCreate(
      'OrientationTurbo.lockToPortrait(this)\n    super.onCreate(savedInstanceState)'
    );
    expect(addKotlinEarlyLock(content, 'landscape-left').error).toContain(
      'Existing early lock is portrait; requested --lock landscape-left'
    );
  });

  it('rejects a Kotlin lock after super.onCreate or in another method', () => {
    for (const content of [
      kotlinOnCreate(
        'super.onCreate(savedInstanceState)\n    OrientationTurbo.lockToPortrait(this)'
      ),
      kotlinOnCreate('super.onCreate(savedInstanceState)').replace(
        '  override fun getMainComponentName()',
        '  fun helper() { OrientationTurbo.lockToPortrait(this) }\n  override fun getMainComponentName()'
      ),
    ]) {
      expect(addKotlinEarlyLock(content, 'portrait').error).toContain(
        "setup can't tell"
      );
    }
  });

  it('does not create a duplicate onCreate when the existing one lacks a direct super call', () => {
    for (const body of [
      '// super.onCreate(savedInstanceState)',
      'if (shouldStart) { super.onCreate(savedInstanceState) }',
    ]) {
      expect(
        addKotlinEarlyLock(kotlinOnCreate(body), 'portrait').error
      ).toContain('no unique direct super.onCreate');
    }
  });

  it('inserts into MainActivity rather than a different class with an onCreate method', () => {
    const content = kotlin().replace(
      'class MainActivity',
      'class Helper : ReactActivity() {\n override fun onCreate(state: Bundle?) {\n  super.onCreate(state)\n }\n}\n\nclass MainActivity'
    );
    const result = addKotlinEarlyLock(content, 'portrait');
    expect(result.error).toBeUndefined();
    expect(
      result.content.indexOf('OrientationTurbo.lockToPortrait(this)')
    ).toBeGreaterThan(result.content.indexOf('class MainActivity'));
  });

  it('recognizes onCreate after Kotlin expression-bodied members', () => {
    const content = kotlin().replace(
      /\n}\s*$/,
      '\n  override fun onCreate(state: Bundle?) {\n    super.onCreate(state)\n  }\n}'
    );
    const result = addKotlinEarlyLock(content, 'portrait');
    expect(result.error).toBeUndefined();
    expect(
      sourceView(result.content).match(/override fun onCreate/g)
    ).toHaveLength(1);
    expect(result.content).toContain(
      'OrientationTurbo.lockToPortrait(this)\n    super.onCreate(state)'
    );
  });
});
