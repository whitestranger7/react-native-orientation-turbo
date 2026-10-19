//
//  OrientationVersionHandler.swift
//
//
//  Created by Ivan Vezhnavets on 22/07/2025.
//

import UIKit

internal class OrientationVersionHandler {

    // MARK: - Public Methods
    
    /// Main thread only
    func apply(_ supportedOrientations: UIInterfaceOrientationMask, to window: UIWindow? = nil) {
        if #available(iOS 16.0, *) {
            if let window = window {
                guard let scene = window.windowScene else { return }
                applyModern(supportedOrientations, to: [scene])
            } else {
                applyModern(supportedOrientations, to: WindowSceneProvider.targetWindowScenes())
            }
        } else {
            applyLegacy(supportedOrientations)
        }
    }
    
    // MARK: - iOS 16+ Implementation
    
    @available(iOS 16.0, *)
    private func applyModern(_ supportedOrientations: UIInterfaceOrientationMask, to windowScenes: [UIWindowScene]) {
        guard !windowScenes.isEmpty else {
            OrientationLogger.warning("Orientation change skipped: no window scene available")
            return
        }

        let geometryPreferences = UIWindowScene.GeometryPreferences.iOS(interfaceOrientations: supportedOrientations)
        for windowScene in windowScenes {
            for viewController in windowScene.windows.flatMap({ WindowSceneProvider.viewControllerChain(of: $0) }) {
                viewController.setNeedsUpdateOfSupportedInterfaceOrientations()
            }

            windowScene.requestGeometryUpdate(geometryPreferences) { error in
                OrientationLogger.error("Orientation change failed: \(error.localizedDescription)")
            }
        }
    }

    // MARK: - iOS 15 Implementation
    
    private func applyLegacy(_ supportedOrientations: UIInterfaceOrientationMask) {
        // Force device orientation using private API (use with caution)
        if WindowSceneProvider.targetWindowScenes().count <= 1,
           supportedOrientations != .all, let targetOrientation = getTargetOrientation(from: supportedOrientations) {
            UIDevice.current.setValue(targetOrientation.rawValue, forKey: "orientation")
        }
        
        UIViewController.attemptRotationToDeviceOrientation()
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
