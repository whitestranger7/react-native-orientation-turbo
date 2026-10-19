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
  /// Main thread only. True while a presented controller can't show the locked orientation
  private var isLockSuspended = false

  // MARK: - Initialization
  init() {
    if Thread.isMainThread {
      currentDeviceOrientation.set(OrientationDetector.getOrientationFromDevice())
    }
  }

  // MARK: - Public Methods

  /// A presented controller (e.g. an RN Modal) that supports none of the locked orientations would make UIKit
  /// throw `UIApplicationInvalidInterfaceOrientation`. While it's shown, the lock is suspended; it's re-applied after.
  func getSupportedInterfaceOrientations() -> UIInterfaceOrientationMask {
    let supportedOrientations = lockedOrientation.get() ?? .all
    guard Thread.isMainThread else { return supportedOrientations }
    
    if supportedOrientations != .all,
       let presented = WindowSceneProvider.topmostPresentedViewController(),
       presented.supportedInterfaceOrientations.intersection(supportedOrientations).isEmpty {
      if !isLockSuspended {
        isLockSuspended = true
        OrientationLogger.warning(
          "\(type(of: presented)) doesn't support the locked orientation; the lock is suspended while it's shown. " +
          "For an RN <Modal>, set supportedOrientations to include the locked orientation."
        )
      }
      return presented.supportedInterfaceOrientations
    }
    
    if isLockSuspended {
      isLockSuspended = false
      DispatchQueue.main.async { [weak self] in
        guard let self = self else { return }
        self.versionHandler.apply(self.lockedOrientation.get() ?? .all)
      }
    }
    return supportedOrientations
  }

  /// Returns `false` (and keeps the current state) for an invalid direction or an unsupported device orientation.
  /// Accepted locks update state immediately; UIKit applies them asynchronously, subject to controller/system policy.
  @discardableResult
  func lockToPortrait(_ direction: String? = nil) -> Bool {
    guard let portraitDirection = direction.map({ PortraitDirection(rawValue: $0) }) ?? .up else {
      OrientationLogger.warning("lockToPortrait ignored: invalid direction \"\(direction ?? "")\" (expected UP or UPSIDE_DOWN)")
      return false
    }
    return lock(to: portraitDirection.interfaceOrientationMask)
  }

  @discardableResult
  func lockToLandscape(_ direction: String) -> Bool {
    guard let landscapeDirection = LandscapeDirection(rawValue: direction) else {
      OrientationLogger.warning("lockToLandscape ignored: invalid direction \"\(direction)\" (expected LEFT or RIGHT)")
      return false
    }
    return lock(to: landscapeDirection.interfaceOrientationMask)
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
  private func lock(to orientation: UIInterfaceOrientationMask) -> Bool {
    guard OrientationLockSupport.canApply(orientation) else {
      OrientationLogger.warning(
        "Lock to \(getOrientationString(from: orientation)) ignored: this device doesn't support it " +
        "(iPhones without a Home button don't support portrait upside-down)"
      )
      return false
    }
    setLockedOrientation(orientation)
    return true
  }
  
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
