//
//  OrientationDetector.swift
//
//
//  Created by Ivan Vezhnavets on 22/07/2025.
//

import UIKit
import CoreFoundation

internal class OrientationDetector {

  // MARK: - Properties
  /// Last known UI orientation. Before a scene reports one, the API falls back to portrait.
  private let cachedInterfaceOrientation = LockedValue(Orientation.portrait.rawValue)
  private var geometryObservation: NSKeyValueObservation?
  private var legacyRunLoopObserver: CFRunLoopObserver?
  private weak var observedWindowScene: UIWindowScene?
  /// Main thread only; avoids repeating a full refresh when the selected scene hasn't rotated.
  private var lastInterfaceOrientation: UIInterfaceOrientation?
  private var lifecycleObservers: [NSObjectProtocol] = []
  private let notificationCenter: NotificationCenter
  private let readInterfaceOrientation: (UIWindowScene?) -> UIInterfaceOrientation?

  init(
    notificationCenter: NotificationCenter = .default,
    interfaceOrientation: @escaping (UIWindowScene?) -> UIInterfaceOrientation? = { scene in
      guard let scene = scene else { return nil }
      if #available(iOS 16.0, *) {
        return scene.effectiveGeometry.interfaceOrientation
      }
      return scene.interfaceOrientation
    }
  ) {
    self.notificationCenter = notificationCenter
    self.readInterfaceOrientation = interfaceOrientation
    if Thread.isMainThread {
      startObserving()
    } else {
      DispatchQueue.main.async { [weak self] in self?.startObserving() }
    }
  }

  deinit {
    for observer in lifecycleObservers {
      notificationCenter.removeObserver(observer)
    }
    if let observer = legacyRunLoopObserver {
      CFRunLoopRemoveObserver(CFRunLoopGetMain(), observer, .commonModes)
    }
  }

  // MARK: - Public Methods

  /// Never blocks: off the main thread, returns the cached value and refreshes it on main
  func getCurrentOrientation() -> String {
    if Thread.isMainThread {
      return refreshInterfaceOrientation()
    }
    DispatchQueue.main.async { [weak self] in
      self?.refreshInterfaceOrientation()
    }
    return cachedInterfaceOrientation.get()
  }

  /// Main thread only
  @discardableResult
  func refreshInterfaceOrientation() -> String {
    let windowScene = WindowSceneProvider.activeWindowScene()
    observeGeometryChanges(of: windowScene)

    let interfaceOrientation = readInterfaceOrientation(windowScene)
    lastInterfaceOrientation = interfaceOrientation
    if let interfaceOrientation = interfaceOrientation,
       let orientation = Self.getOrientation(from: interfaceOrientation) {
      cachedInterfaceOrientation.set(orientation)
    }
    return cachedInterfaceOrientation.get()
  }

  /// The device orientation, expressed as the interface orientation that shows it.
  /// UIKit defines each UIInterfaceOrientation as the matching UIDeviceOrientation (UIOrientation.h:
  /// `UIInterfaceOrientationLandscapeLeft = UIDeviceOrientationLandscapeRight`), so the raw values convert directly.
  static func getOrientationFromDevice() -> String {
    let deviceOrientation = UIDevice.current.orientation
    switch deviceOrientation {
    case .faceUp: return Orientation.faceUp.rawValue
    case .faceDown: return Orientation.faceDown.rawValue
    default:
      return getOrientation(from: OrientationDetector.interfaceOrientation(for: deviceOrientation)) ?? Orientation.portrait.rawValue
    }
  }

  static func interfaceOrientation(for deviceOrientation: UIDeviceOrientation) -> UIInterfaceOrientation {
    return UIInterfaceOrientation(rawValue: deviceOrientation.rawValue) ?? .unknown
  }
  
  // MARK: - Private Methods

  /// The single mapping from UIKit to the library's orientations; names match one to one
  static func getOrientation(from interfaceOrientation: UIInterfaceOrientation) -> String? {
    switch interfaceOrientation {
    case .portrait: return Orientation.portrait.rawValue
    case .portraitUpsideDown: return Orientation.portraitUpsideDown.rawValue
    case .landscapeLeft: return Orientation.landscapeLeft.rawValue
    case .landscapeRight: return Orientation.landscapeRight.rawValue
    case .unknown: return nil
    @unknown default: return nil
    }
  }

  /// Subscribe before the first JS query, including apps that connect their scene after initialization.
  private func startObserving() {
    let notifications: [Notification.Name] = [
      UIScene.willConnectNotification,
      UIScene.didActivateNotification,
      UIScene.willEnterForegroundNotification,
      UIScene.didDisconnectNotification,
      UIApplication.didBecomeActiveNotification,
      UIWindow.didBecomeKeyNotification,
    ]
    for name in notifications {
      lifecycleObservers.append(notificationCenter.addObserver(forName: name, object: nil, queue: .main) { [weak self] _ in
        self?.refreshInterfaceOrientation()
      })
    }
    if #available(iOS 16.0, *) {
      // Geometry observation is attached to the selected scene below.
    } else {
      // UIWindowScene.interfaceOrientation does not reliably emit KVO. Check once before the loop
      // sleeps, after UIKit's work, without waking an idle loop or rebuilding the scene list each pass.
      legacyRunLoopObserver = CFRunLoopObserverCreateWithHandler(nil, CFRunLoopActivity.beforeWaiting.rawValue, true, CFIndex.max) { [weak self] _, _ in
        guard let self = self, let scene = self.observedWindowScene,
              self.readInterfaceOrientation(scene) != self.lastInterfaceOrientation else { return }
        self.refreshInterfaceOrientation()
      }
      CFRunLoopAddObserver(CFRunLoopGetMain(), legacyRunLoopObserver, .commonModes)
    }
    refreshInterfaceOrientation()
  }

  /// iOS 16+ reports geometry changes directly; iOS 15 uses the main-loop observer above.
  private func observeGeometryChanges(of windowScene: UIWindowScene?) {
    guard windowScene !== observedWindowScene else { return }

    geometryObservation = nil
    observedWindowScene = windowScene
    guard let windowScene = windowScene else { return }
    if #available(iOS 16.0, *) {
      geometryObservation = windowScene.observe(\.effectiveGeometry, options: [.new]) { [weak self] _, _ in
        self?.interfaceGeometryDidChange()
      }
    }
  }

  private func interfaceGeometryDidChange() {
    if Thread.isMainThread {
      refreshInterfaceOrientation()
    } else {
      DispatchQueue.main.async { [weak self] in self?.refreshInterfaceOrientation() }
    }
  }
}
