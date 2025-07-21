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
        case .unknown:
            return getOrientationFallback()
        @unknown default: return Orientation.portrait.rawValue
        }
    }
    
    // MARK: - Private Methods
    
    private func getCurrentOrientationInternal() -> String {
        if #available(iOS 13.0, *) {
            return getOrientationFromWindowScene() ?? getOrientationFromDevice()
        } else {
            return getOrientationFromDevice()
        }
    }
    
    @available(iOS 13.0, *)
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
    
    private func getOrientationFallback() -> String {
        if #available(iOS 13.0, *) {
            return Orientation.portrait.rawValue
        } else {
            switch UIApplication.shared.statusBarOrientation {
            case .portrait: return Orientation.portrait.rawValue
            case .portraitUpsideDown: return Orientation.portraitUpsideDown.rawValue
            case .landscapeLeft: return Orientation.landscapeLeft.rawValue
            case .landscapeRight: return Orientation.landscapeRight.rawValue
            default: return Orientation.portrait.rawValue
            }
        }
    }
    
    // for future face direction support
    func getFaceDirection(for orientation: String) -> String {
        switch orientation {
        case Orientation.faceDown.rawValue:
            return "DOWN"
        case Orientation.faceUp.rawValue,
             Orientation.portrait.rawValue,
             Orientation.landscapeLeft.rawValue,
             Orientation.landscapeRight.rawValue,
             Orientation.portraitUpsideDown.rawValue:
            return "UP"
        default:
            return "UP"
        }
    }
}
