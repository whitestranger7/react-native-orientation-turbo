# Migrates ONLY the fresh RN 0.80 CompatApp created by compat-test.sh.
# This is a test fixture, not an automatic migration for consumer applications.
require 'xcodeproj'

app_root = File.expand_path(ARGV.fetch(0))
ios = File.join(app_root, 'ios')
app_dir = File.join(ios, 'CompatApp')
app_delegate_path = File.join(app_dir, 'AppDelegate.swift')
original = File.read(app_delegate_path)
delegate = original[/^class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate\b.*\z/m]
abort 'Expected the unmodified RN 0.80 CompatApp template' unless delegate && original.include?('withModuleName: "CompatApp"')

scene_path = File.join(app_dir, 'SceneDelegate.swift')
abort 'SceneDelegate.swift already exists' if File.exist?(scene_path)

plist_path = File.join(app_dir, 'Info.plist')
plist = Xcodeproj::Plist.read_from_path(plist_path)
abort 'Template already has a scene manifest' if plist.key?('UIApplicationSceneManifest')
project = Xcodeproj::Project.open(File.join(ios, 'CompatApp.xcodeproj'))
target = project.targets.find { |candidate| candidate.name == 'CompatApp' }
app_delegate_ref = project.files.find { |file| file.path == 'CompatApp/AppDelegate.swift' }
abort 'Expected the CompatApp target and source group' unless target && app_delegate_ref

File.write(app_delegate_path, <<~SWIFT + "\n" + delegate)
  import UIKit
  import React
  import React_RCTAppDelegate
  import ReactAppDependencyProvider

  @main
  class AppDelegate: UIResponder, UIApplicationDelegate {
    // Older RN modules still read UIApplication.shared.delegate.window.
    var window: UIWindow?

    func application(
      _ application: UIApplication,
      didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
      true
    }
  }
SWIFT

File.write(scene_path, <<~SWIFT)
  import UIKit
  import React
  import React_RCTAppDelegate
  import ReactAppDependencyProvider

  class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?
    var reactNativeDelegate: ReactNativeDelegate?
    var reactNativeFactory: RCTReactNativeFactory?

    func scene(
      _ scene: UIScene,
      willConnectTo session: UISceneSession,
      options connectionOptions: UIScene.ConnectionOptions
    ) {
      guard let windowScene = scene as? UIWindowScene else { return }
      let delegate = ReactNativeDelegate()
      delegate.dependencyProvider = RCTAppDependencyProvider()
      let factory = RCTReactNativeFactory(delegate: delegate)
      reactNativeDelegate = delegate
      reactNativeFactory = factory
      window = UIWindow(windowScene: windowScene)
      (UIApplication.shared.delegate as? AppDelegate)?.window = window

      factory.startReactNative(withModuleName: "CompatApp", in: window, launchOptions: nil)
    }
  }
SWIFT

plist['UIApplicationSceneManifest'] = {
  'UIApplicationSupportsMultipleScenes' => false,
  'UISceneConfigurations' => {
    'UIWindowSceneSessionRoleApplication' => [{
      'UISceneConfigurationName' => 'Default Configuration',
      'UISceneDelegateClassName' => '$(PRODUCT_MODULE_NAME).SceneDelegate'
    }]
  }
}
Xcodeproj::Plist.write_to_path(plist, plist_path)

scene_ref = app_delegate_ref.parent.new_file('CompatApp/SceneDelegate.swift')
target.source_build_phase.add_file_reference(scene_ref)
project.save
puts 'Migrated the RN 0.80 test consumer to scenes (see docs/IOS_SCENES.md).'
