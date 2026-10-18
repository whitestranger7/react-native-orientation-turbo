//
//  OrientationManager.swift
//
//
//  Created by Ivan Vezhnavets on 22/07/2025.
//

import UIKit

internal class OrientationManager {

  // MARK: - Properties
  /// `nil` when unlocked
  private let lockedOrientation = LockedValue<UIInterfaceOrientationMask?>(nil)
  private let currentDeviceOrientation = LockedValue(Orientation.portrait.rawValue)

  private let versionHandler = OrientationVersionHandler()
  private let detector = OrientationDetector()

  // MARK: - Initialization
  init() {
    if Thread.isMainThread {
      currentDeviceOrientation.set(detector.getOrientationFromDevice())
    }
  }

  // MARK: - Public Methods

  func getSupportedInterfaceOrientations() -> UIInterfaceOrientationMask {
    return lockedOrientation.get() ?? .all
  }

  func lockToPortrait(_ direction: String? = nil) {
    let orientation: UIInterfaceOrientationMask = (direction == "UPSIDE_DOWN") ? .portraitUpsideDown : .portrait
    setLockedOrientation(orientation)
  }

  func lockToLandscape(_ direction: String) {
    let landscapeDirection = LandscapeDirection(rawValue: direction) ?? .right
    setLockedOrientation(landscapeDirection.interfaceOrientationMask)
  }

  func unlockAllOrientations() {
    setLockedOrientation(nil)
  }

  func getCurrentOrientation() -> String {
    return detector.getCurrentOrientation()
  }

  func getCurrentDeviceOrientation() -> String {
    return currentDeviceOrientation.get()
  }

  func setCurrentDeviceOrientation(_ orientation: String) {
    currentDeviceOrientation.set(orientation)
  }

  func isLocked() -> Bool {
    return lockedOrientation.get() != nil
  }

  func getLockedOrientationString() -> String? {
    guard let mask = lockedOrientation.get() else { return nil }
    return getOrientationString(from: mask)
  }

  // MARK: - Private Methods

  /// The state changes right away; UIKit applies it on the main queue, in call order
  private func setLockedOrientation(_ orientation: UIInterfaceOrientationMask?) {
    lockedOrientation.set(orientation)

    let supportedOrientations = orientation ?? .all
    DispatchQueue.main.async { [weak self] in
      self?.versionHandler.apply(supportedOrientations)
      self?.detector.refreshInterfaceOrientation()
    }
  }

  private func getOrientationString(from mask: UIInterfaceOrientationMask) -> String {
    switch mask {
    case .portrait:
      return Orientation.portrait.rawValue
    case .portraitUpsideDown:
      return Orientation.portraitUpsideDown.rawValue
    case .landscapeLeft:
      return Orientation.landscapeLeft.rawValue
    case .landscapeRight:
      return Orientation.landscapeRight.rawValue
    default:
      return Orientation.portrait.rawValue
    }
  }
}
