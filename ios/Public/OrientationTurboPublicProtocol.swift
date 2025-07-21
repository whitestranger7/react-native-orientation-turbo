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
  func getSupportedInterfaceOrientations() -> UIInterfaceOrientationMask
  func lockToPortrait()
  func lockToPortrait(_ direction: String?)
  func lockToLandscape(_ direction: String)
  func unlockAllOrientations()
  func getCurrentOrientation() -> String
  func isLocked() -> Bool
}
