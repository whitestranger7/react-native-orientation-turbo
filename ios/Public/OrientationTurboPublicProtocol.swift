//
//  OrientationTurboPublicProtocol.swift
//
//
//  Created by Ivan Vezhnavets on 22/07/2025.
//

import UIKit

/// Public API for native iOS developers to interact with OrientationTurbo
/// This interface excludes React Native specific methods to prevent conflicts
@objc public protocol OrientationTurboPublicProtocol {
  @available(swift, deprecated: 1.0, message: "Use getSupportedInterfaceOrientations(for:) instead")
  func getSupportedInterfaceOrientations() -> UIInterfaceOrientationMask
  func getSupportedInterfaceOrientations(for window: UIWindow?) -> UIInterfaceOrientationMask
  func lockToPortrait()
  @available(swift, deprecated: 1.0, message: "Use lockToPortrait(_: PortraitDirection) instead")
  func lockToPortrait(_ direction: String?)
  @available(swift, deprecated: 1.0, message: "Use lockToLandscape(_: LandscapeDirection) instead")
  func lockToLandscape(_ direction: String)
  func unlockAllOrientations()
  func getCurrentOrientation() -> String
  func isLocked() -> Bool
  func canLockOrientation() -> Bool
}

// Typed variants for Swift. Objective-C keeps the string methods.
public extension OrientationTurboPublicProtocol {
  func lockToPortrait(_ direction: PortraitDirection) {
    (self as? OrientationTurboImpl)?.lockToPortrait(direction.rawValue)
  }

  func lockToLandscape(_ direction: LandscapeDirection) {
    (self as? OrientationTurboImpl)?.lockToLandscape(direction.rawValue)
  }
}
