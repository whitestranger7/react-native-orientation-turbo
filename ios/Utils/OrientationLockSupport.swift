//
//  OrientationLockSupport.swift
//
//
//  Created by Ivan Vezhnavets on 18/10/2026.
//

import UIKit

/// Whether the system applies orientation locks for this app.
/// iPadOS ignores them for resizable apps, i.e. apps without `UIRequiresFullScreen`
/// (see TN3192: Migrating your app from the deprecated UIRequiresFullScreen key).
internal enum OrientationLockSupport {

  /// Info.plist and the device idiom don't change at runtime
  static let canLockOrientation: Bool = {
    guard UIDevice.current.userInterfaceIdiom == .pad else { return true }
    return requiresFullScreen()
  }()

  /// Device restrictions only. The app delegate supplies the runtime app mask; Info.plist is its fallback,
  /// not an additional limit. UIKit also checks the visible controller's supported orientations.
  static let applicableOrientations = deviceOrientations(
    idiom: UIDevice.current.userInterfaceIdiom,
    model: modelIdentifier()
  )

  static func canApply(_ orientations: UIInterfaceOrientationMask) -> Bool {
    return !orientations.intersection(applicableOrientations).isEmpty
  }

  static func deviceOrientations(idiom: UIUserInterfaceIdiom, model: String) -> UIInterfaceOrientationMask {
    if idiom == .phone && !hasHomeButton(model: model) {
      return .allButUpsideDown
    }
    return .all
  }

  /// iPhones with a Home button that run iOS 15+: 6s / 6s Plus / SE, 7, 8 / 8 Plus, SE (2nd and 3rd generation)
  static func hasHomeButton(model: String) -> Bool {
    let homeButtonModels: Set<String> = ["iPhone10,1", "iPhone10,2", "iPhone10,4", "iPhone10,5", "iPhone12,8", "iPhone14,6"]
    return model.hasPrefix("iPhone8,") || model.hasPrefix("iPhone9,") || homeButtonModels.contains(model)
  }

  private static func modelIdentifier() -> String {
    if let simulatorModel = ProcessInfo.processInfo.environment["SIMULATOR_MODEL_IDENTIFIER"] {
      return simulatorModel
    }
    var systemInfo = utsname()
    uname(&systemInfo)
    return withUnsafeBytes(of: &systemInfo.machine) { buffer in
      String(decoding: buffer.prefix { $0 != 0 }, as: UTF8.self)
    }
  }

  private static func requiresFullScreen() -> Bool {
    let bundle = Bundle.main
    let requiresFullScreen = boolValue(bundle.object(forInfoDictionaryKey: "UIRequiresFullScreen~ipad"))
      ?? boolValue(bundle.object(forInfoDictionaryKey: "UIRequiresFullScreen"))
      ?? false
    guard requiresFullScreen else { return false }

    if let ignoredStartingWith = intValue(bundle.object(forInfoDictionaryKey: "UIRequiresFullScreenIgnoredStartingWithVersion")),
       ProcessInfo.processInfo.operatingSystemVersion.majorVersion >= ignoredStartingWith {
      return false
    }
    return true
  }

  private static func boolValue(_ value: Any?) -> Bool? {
    if let bool = value as? Bool { return bool }
    if let string = value as? String { return (string as NSString).boolValue }
    return nil
  }

  private static func intValue(_ value: Any?) -> Int? {
    if let number = value as? NSNumber { return number.intValue }
    if let string = value as? String { return Int(string.split(separator: ".").first ?? "") }
    return nil
  }
}
