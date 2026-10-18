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
