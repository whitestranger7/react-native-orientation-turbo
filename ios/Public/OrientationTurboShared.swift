//
//  OrientationTurboShared.swift
//  
//
//  Created by Ivan Vezhnavets on 22/07/2025.
//

import Foundation

// MARK: - Wrapper for Shared Instance
@objc public class OrientationTurboShared: NSObject, OrientationTurboPublicProtocol {
  private let implementation: OrientationTurboImpl
  
  internal init(implementation: OrientationTurboImpl) {
    self.implementation = implementation
  }
  
  public func getSupportedInterfaceOrientations() -> UIInterfaceOrientationMask {
    return implementation.getSupportedInterfaceOrientations()
  }
  
  public func lockToPortrait() {
    implementation.lockToPortrait()
  }
  
  public func lockToPortrait(_ direction: String?) {
    implementation.lockToPortrait(direction)
  }
  
  public func lockToLandscape(_ direction: String) {
    implementation.lockToLandscape(direction)
  }
  
  public func unlockAllOrientations() {
    implementation.unlockAllOrientations()
  }
  
  public func getCurrentOrientation() -> String {
    return implementation.getCurrentOrientation()
  }
  
  public func isLocked() -> Bool {
    return implementation.isLocked()
  }
}
