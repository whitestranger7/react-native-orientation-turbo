//
//  OrientationTracker.swift
//
//
//  Created by Ivan Vezhnavets on 22/07/2025.
//

import UIKit

internal class OrientationTracker {
  
  // MARK: - Properties
  private var isOrientationTrackingEnabled: Bool = false
  private weak var orientationManager: OrientationManager?
  private let detector = OrientationDetector()
  
  var onOrientationChange: ((NSDictionary) -> Void)?
  
  // MARK: - Initialization
  init(orientationManager: OrientationManager) {
    self.orientationManager = orientationManager
  }
  
  deinit {
    stopOrientationTracking()
  }
  
  // MARK: - Public Methods
  
  func startOrientationTracking() {
    guard !isOrientationTrackingEnabled else { return }
    
    DispatchQueue.main.async { [weak self] in
      UIDevice.current.beginGeneratingDeviceOrientationNotifications()
      NotificationCenter.default.addObserver(
        self as Any,
        selector: #selector(self?.deviceOrientationDidChange),
        name: UIDevice.orientationDidChangeNotification,
        object: nil
      )
      self?.isOrientationTrackingEnabled = true
    }
  }
  
  func stopOrientationTracking() {
    guard isOrientationTrackingEnabled else { return }
    
    DispatchQueue.main.async { [weak self] in
      NotificationCenter.default.removeObserver(
        self as Any,
        name: UIDevice.orientationDidChangeNotification,
        object: nil
      )
      UIDevice.current.endGeneratingDeviceOrientationNotifications()
      self?.isOrientationTrackingEnabled = false
    }
  }
  
  // MARK: - Private Methods
  
  @objc private func deviceOrientationDidChange() {
    let newOrientation = detector.getOrientationFromDevice()
    guard let orientationManager = orientationManager,
          newOrientation != orientationManager.getCurrentDeviceOrientation() else {
      return
    }
    
    let orientationEvent: NSDictionary = [
      "orientation": newOrientation,
    ]
    
    orientationManager.setCurrentDeviceOrientation(newOrientation)
    onOrientationChange?(orientationEvent)
  }
}
