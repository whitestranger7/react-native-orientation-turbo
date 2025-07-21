//
//  OrientationVersionHandler.swift
//
//
//  Created by Ivan Vezhnavets on 22/07/2025.
//

import UIKit

internal class OrientationVersionHandler {
    
    // MARK: - Public Methods
    
    func updateSupportedOrientations(_ supportedOrientations: UIInterfaceOrientationMask) {
        if #available(iOS 16.0, *) {
            updateSupportedOrientationsModern(supportedOrientations)
        } else {
            updateSupportedOrientationsLegacy()
        }
    }
    
    func requestOrientationChange(_ orientation: UIInterfaceOrientationMask, completion: ((Bool) -> Void)? = nil) {
        DispatchQueue.main.async { [weak self] in
            if #available(iOS 16.0, *) {
                self?.requestOrientationChangeModern(orientation, completion: completion)
            } else {
                self?.requestOrientationChangeLegacy(orientation)
                completion?(true)
            }
        }
    }
    
    // MARK: - iOS 16+ Implementation
    
    @available(iOS 16.0, *)
    private func updateSupportedOrientationsModern(_ supportedOrientations: UIInterfaceOrientationMask) {
        guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene else {
            return
        }
        
        let geometryPreferences = UIWindowScene.GeometryPreferences.iOS(interfaceOrientations: supportedOrientations)
        
        windowScene.requestGeometryUpdate(geometryPreferences) { error in
            DispatchQueue.main.async {
                if !error.localizedDescription.isEmpty && !error.localizedDescription.contains("succeeded") {
                    print("OrientationTurbo: Failed to update supported orientations - \(error.localizedDescription)")
                }
            }
        }
        
        if let window = windowScene.windows.first {
            window.rootViewController?.setNeedsUpdateOfSupportedInterfaceOrientations()
        }
    }
    
    @available(iOS 16.0, *)
    private func requestOrientationChangeModern(_ orientation: UIInterfaceOrientationMask, completion: ((Bool) -> Void)?) {
        guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene else {
            print("OrientationTurbo: No window scene available")
            completion?(false)
            return
        }
        
        let geometryPreferences = UIWindowScene.GeometryPreferences.iOS(interfaceOrientations: orientation)
        windowScene.requestGeometryUpdate(geometryPreferences) { error in
            DispatchQueue.main.async {
                let success = error.localizedDescription.isEmpty ||
                             error.localizedDescription.contains("succeeded") ||
                             !error.localizedDescription.contains("failed")
                
                if !success {
                    print("OrientationTurbo: Orientation change failed - \(error.localizedDescription)")
                }
                
                completion?(success)
            }
        }
    }
    
    // MARK: - iOS 15 and Below Implementation
    
    private func updateSupportedOrientationsLegacy() {
        UIViewController.attemptRotationToDeviceOrientation()
        
        NotificationCenter.default.post(
            name: NSNotification.Name("OrientationSupportDidChange"),
            object: nil,
            userInfo: ["supportedOrientations": UIInterfaceOrientationMask.all.rawValue]
        )
    }
    
    private func requestOrientationChangeLegacy(_ orientation: UIInterfaceOrientationMask) {
        // Force device orientation using private API (use with caution)
        if orientation != .all, let targetOrientation = getTargetOrientation(from: orientation) {
            UIDevice.current.setValue(targetOrientation.rawValue, forKey: "orientation")
        }
        
        UIViewController.attemptRotationToDeviceOrientation()
        
        NotificationCenter.default.post(
            name: NSNotification.Name("ForceOrientationChange"),
            object: orientation
        )
    }
    
    // MARK: - Helper Methods
    
    private func getTargetOrientation(from mask: UIInterfaceOrientationMask) -> UIInterfaceOrientation? {
        switch mask {
        case .portrait: return .portrait
        case .landscapeLeft: return .landscapeLeft
        case .landscapeRight: return .landscapeRight
        case .portraitUpsideDown: return .portraitUpsideDown
        default: return nil
        }
    }
}
