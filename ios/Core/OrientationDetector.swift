//
//  OrientationDetector.swift
//
//
//  Created by Ivan Vezhnavets on 22/07/2025.
//

import UIKit

internal class OrientationDetector {

  // MARK: - Properties
  /// Last interface orientation read on the main thread, for callers on other threads
  private let cachedInterfaceOrientation = LockedValue(Orientation.portrait.rawValue)
  private var geometryObservation: NSKeyValueObservation?
  private weak var observedWindowScene: UIWindowScene?

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

    let orientation = windowScene.flatMap { getOrientation(from: $0) } ?? getOrientationFromDevice()
    cachedInterfaceOrientation.set(orientation)
    return orientation
  }

  /// The device orientation, expressed as the interface orientation that shows it.
  /// UIKit defines each UIInterfaceOrientation as the matching UIDeviceOrientation (UIOrientation.h:
  /// `UIInterfaceOrientationLandscapeLeft = UIDeviceOrientationLandscapeRight`), so the raw values convert directly.
  func getOrientationFromDevice() -> String {
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

  private func getOrientation(from windowScene: UIWindowScene) -> String? {
    return getOrientation(from: windowScene.interfaceOrientation)
  }
  
  /// The single mapping from UIKit to the library's orientations; names match one to one
  func getOrientation(from interfaceOrientation: UIInterfaceOrientation) -> String? {
    switch interfaceOrientation {
    case .portrait: return Orientation.portrait.rawValue
    case .portraitUpsideDown: return Orientation.portraitUpsideDown.rawValue
    case .landscapeLeft: return Orientation.landscapeLeft.rawValue
    case .landscapeRight: return Orientation.landscapeRight.rawValue
    case .unknown: return nil
    @unknown default: return nil
    }
  }

  /// Keeps the cache current when a rotation finishes (iOS 16+)
  private func observeGeometryChanges(of windowScene: UIWindowScene?) {
    guard #available(iOS 16.0, *) else { return }
    guard let windowScene = windowScene, windowScene !== observedWindowScene else { return }

    observedWindowScene = windowScene
    geometryObservation = windowScene.observe(\.effectiveGeometry, options: [.new]) { [weak self] _, _ in
      DispatchQueue.main.async {
        self?.refreshInterfaceOrientation()
      }
    }
  }
}
