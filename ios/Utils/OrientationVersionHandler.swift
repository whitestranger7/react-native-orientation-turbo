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

    func requestOrientationChange(_ orientation: UIInterfaceOrientationMask) {
        DispatchQueue.main.async { [weak self] in
            if #available(iOS 16.0, *) {
                self?.requestOrientationChangeModern(orientation)
            } else {
                self?.requestOrientationChangeLegacy(orientation)
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
            OrientationLogger.error("Failed to update supported orientations: \(error.localizedDescription)")
        }

        if let window = windowScene.windows.first {
            window.rootViewController?.setNeedsUpdateOfSupportedInterfaceOrientations()
        }
    }

    @available(iOS 16.0, *)
    private func requestOrientationChangeModern(_ orientation: UIInterfaceOrientationMask) {
        guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene else {
            OrientationLogger.warning("Orientation change skipped: no window scene available")
            return
        }

        let geometryPreferences = UIWindowScene.GeometryPreferences.iOS(interfaceOrientations: orientation)

        windowScene.requestGeometryUpdate(geometryPreferences) { error in
            OrientationLogger.error("Orientation change failed: \(error.localizedDescription)")
        }
    }

    // MARK: - iOS 15 Implementation

    private func updateSupportedOrientationsLegacy() {
        UIViewController.attemptRotationToDeviceOrientation()
    }

    private func requestOrientationChangeLegacy(_ orientation: UIInterfaceOrientationMask) {
        // Force device orientation using private API (use with caution)
        if orientation != .all, let targetOrientation = getTargetOrientation(from: orientation) {
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
