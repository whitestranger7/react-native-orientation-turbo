//
//  OrientationTracker.swift
//
//
//  Created by Ivan Vezhnavets on 22/07/2025.
//

import UIKit

internal class OrientationTracker {

  // MARK: - Properties
  private weak var orientationManager: OrientationManager?

  private var observer: NSObjectProtocol?

  var onOrientationChange: (() -> Void)?

  // MARK: - Initialization
  init(orientationManager: OrientationManager) {
    self.orientationManager = orientationManager
  }

  // MARK: - Public Methods

  func startOrientationTracking() {
    DispatchQueue.main.async { [weak self] in
      self?.start()
    }
  }

  func stopOrientationTracking() {
    DispatchQueue.main.async { [weak self] in
      self?.stop()
    }
  }

  // MARK: - Private Methods

  private func start() {
    guard observer == nil else { return }

    UIDevice.current.beginGeneratingDeviceOrientationNotifications()
    orientationManager?.setCurrentDeviceOrientation(OrientationDetector.getOrientationFromDevice())

    observer = NotificationCenter.default.addObserver(
      forName: UIDevice.orientationDidChangeNotification,
      object: nil,
      queue: .main
    ) { [weak self] _ in
      self?.deviceOrientationDidChange()
    }
  }

  private func stop() {
    guard let observer = observer else { return }

    NotificationCenter.default.removeObserver(observer)
    self.observer = nil
    UIDevice.current.endGeneratingDeviceOrientationNotifications()
  }

  private func deviceOrientationDidChange() {
    let newOrientation = OrientationDetector.getOrientationFromDevice()
    guard let orientationManager = orientationManager,
          newOrientation != orientationManager.getCurrentDeviceOrientation() else {
      return
    }

    orientationManager.setCurrentDeviceOrientation(newOrientation)
    onOrientationChange?()
  }
}
