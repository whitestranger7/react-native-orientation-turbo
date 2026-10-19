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

  private let targetWindows: () -> [UIWindow]
  private let sceneForWindow: (UIWindow) -> AnyObject?
  private let applyOrientation: (UIInterfaceOrientationMask, UIWindow?) -> Void
  private let detector = OrientationDetector()
  /// Main thread only; windows and their scenes can disconnect without being retained here.
  private let suspendedWindows = NSHashTable<UIWindow>.weakObjects()

  // MARK: - Initialization
  init(
    targetWindows: @escaping () -> [UIWindow] = {
      WindowSceneProvider.targetWindowScenes().compactMap { WindowSceneProvider.mainWindow(of: $0) }
    },
    sceneForWindow: @escaping (UIWindow) -> AnyObject? = { $0.windowScene },
    applyOrientation: @escaping (UIInterfaceOrientationMask, UIWindow?) -> Void = {
      OrientationVersionHandler().apply($0, to: $1)
    }
  ) {
    self.targetWindows = targetWindows
    self.sceneForWindow = sceneForWindow
    self.applyOrientation = applyOrientation
    if Thread.isMainThread {
      currentDeviceOrientation.set(OrientationDetector.getOrientationFromDevice())
    }
  }

  // MARK: - Public Methods

  /// A presented controller (e.g. an RN Modal) that supports none of the locked orientations would make UIKit
  /// throw `UIApplicationInvalidInterfaceOrientation`. While it's shown, the lock is suspended; it's re-applied after.
  func getSupportedInterfaceOrientations() -> UIInterfaceOrientationMask {
    guard Thread.isMainThread else { return lockedOrientation.get() ?? .all }
    let window = WindowSceneProvider.activeWindowScene().flatMap { WindowSceneProvider.mainWindow(of: $0) }
    return getSupportedInterfaceOrientations(for: window)
  }

  func getSupportedInterfaceOrientations(for window: UIWindow?) -> UIInterfaceOrientationMask {
    let supportedOrientations = lockedOrientation.get() ?? .all
    guard Thread.isMainThread, let window = window else { return supportedOrientations }
    return supportedMask(supportedOrientations, for: window, scheduleReapplication: true)
  }

  private func supportedMask(
    _ supportedOrientations: UIInterfaceOrientationMask,
    for window: UIWindow,
    scheduleReapplication: Bool
  ) -> UIInterfaceOrientationMask {
    if supportedOrientations != .all,
       let presented = WindowSceneProvider.topmostPresentedViewController(in: window),
       presented.supportedInterfaceOrientations.intersection(supportedOrientations).isEmpty {
      if !suspendedWindows.contains(window) {
        suspendedWindows.add(window)
        OrientationLogger.warning(
          "\(type(of: presented)) doesn't support the locked orientation; the lock is suspended while it's shown. " +
          "For an RN <Modal>, set supportedOrientations to include the locked orientation."
        )
      }
      return presented.supportedInterfaceOrientations
    }
    
    if suspendedWindows.contains(window) {
      suspendedWindows.remove(window)
      if scheduleReapplication {
        DispatchQueue.main.async { [weak self, weak window, weak capturedScene = sceneForWindow(window)] in
          guard let self = self, let window = window,
                let scene = self.sceneForWindow(window), scene === capturedScene else { return }
          let mask = self.supportedMask(self.lockedOrientation.get() ?? .all, for: window, scheduleReapplication: false)
          self.applyOrientation(mask, window)
        }
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
      guard let self = self else { return }
      let windows = self.targetWindows()
      if windows.isEmpty {
        self.applyOrientation(supportedOrientations, nil)
      } else {
        for window in windows {
          let mask = self.supportedMask(supportedOrientations, for: window, scheduleReapplication: false)
          self.applyOrientation(mask, window)
        }
      }
      self.detector.refreshInterfaceOrientation()
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
