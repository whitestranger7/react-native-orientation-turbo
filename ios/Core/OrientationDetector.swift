//
//  OrientationDetector.swift
//
//
//  Created by Ivan Vezhnavets on 22/07/2025.
//

import UIKit

internal class OrientationDetector {
  
  // MARK: - Public Methods
  
  func getCurrentOrientation() -> String {
    guard Thread.isMainThread else {
      return DispatchQueue.main.sync {
        return getCurrentOrientationInternal()
      }
    }
    return getCurrentOrientationInternal()
  }
  
  func getOrientationFromDevice() -> String {
    switch UIDevice.current.orientation {
    case .portrait: return Orientation.portrait.rawValue
    case .portraitUpsideDown: return Orientation.portraitUpsideDown.rawValue
    case .landscapeLeft: return Orientation.landscapeLeft.rawValue
    case .landscapeRight: return Orientation.landscapeRight.rawValue
    case .faceUp: return Orientation.faceUp.rawValue
    case .faceDown: return Orientation.faceDown.rawValue
    case .unknown: return Orientation.portrait.rawValue
    @unknown default: return Orientation.portrait.rawValue
    }
  }
  
  // MARK: - Private Methods
  
  private func getCurrentOrientationInternal() -> String {
    return getOrientationFromWindowScene() ?? getOrientationFromDevice()
  }
  
  private func getOrientationFromWindowScene() -> String? {
    guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene else {
      return nil
    }
    
    switch windowScene.interfaceOrientation {
    case .portrait: return Orientation.portrait.rawValue
    case .portraitUpsideDown: return Orientation.portraitUpsideDown.rawValue
    case .landscapeLeft: return Orientation.landscapeLeft.rawValue
    case .landscapeRight: return Orientation.landscapeRight.rawValue
    case .unknown: return nil
    @unknown default: return nil
    }
  }
}
