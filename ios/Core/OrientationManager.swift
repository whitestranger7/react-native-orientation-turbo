//
//  OrientationManager.swift
//
//
//  Created by Ivan Vezhnavets on 22/07/2025.
//

import UIKit

internal class OrientationManager {
    
    // MARK: - Properties
    private var currentLockedOrientation: UIInterfaceOrientationMask?
    private var isOrientationLocked: Bool = false
    private var currentDeviceOrientation: String = Orientation.portrait.rawValue
    
    private let lockQueue = DispatchQueue(label: "orientation.lock.queue", attributes: .concurrent)
    private let versionHandler = OrientationVersionHandler()
    private let detector = OrientationDetector()
    
    // MARK: - Initialization
    init() {
        currentDeviceOrientation = detector.getOrientationFromDevice()
    }
    
    // MARK: - Public Methods
    
    func getSupportedInterfaceOrientations() -> UIInterfaceOrientationMask {
        return lockQueue.sync {
            if isOrientationLocked, let lockedOrientation = currentLockedOrientation {
                return lockedOrientation
            } else {
                return .all
            }
        }
    }
    
    func lockToPortrait(_ direction: String? = nil) {
        let orientation: UIInterfaceOrientationMask = (direction == "UPSIDE_DOWN") ? .portraitUpsideDown : .portrait
        lockToOrientation(orientation)
    }
    
    func lockToLandscape(_ direction: String) {
        let landscapeDirection = LandscapeDirection(rawValue: direction) ?? .right
        lockToOrientation(landscapeDirection.interfaceOrientationMask)
    }
    
    func unlockAllOrientations() {
        updateLockState(locked: false, orientation: nil)
    }
    
    func getCurrentOrientation() -> String {
        return detector.getCurrentOrientation()
    }
    
    func getCurrentDeviceOrientation() -> String {
        return currentDeviceOrientation
    }
    
    func setCurrentDeviceOrientation(_ orientation: String) {
        currentDeviceOrientation = orientation
    }
    
    func isLocked() -> Bool {
        return lockQueue.sync { isOrientationLocked }
    }
    
    func getLockedOrientation() -> UIInterfaceOrientationMask? {
        return lockQueue.sync { currentLockedOrientation }
    }
    
    func getIsLocked() -> Bool {
        return lockQueue.sync { isOrientationLocked }
    }
    
    func getLockedOrientationString() -> String? {
        guard let mask = getLockedOrientation() else { return nil }
        return getOrientationString(from: mask)
    }
    
    // MARK: - Private Methods
    
    private func lockToOrientation(_ orientation: UIInterfaceOrientationMask) {
        updateLockState(locked: true, orientation: orientation)
        versionHandler.requestOrientationChange(orientation)
    }
    
    private func updateLockState(locked: Bool, orientation: UIInterfaceOrientationMask?) {
        lockQueue.async(flags: .barrier) { [weak self] in
            self?.isOrientationLocked = locked
            self?.currentLockedOrientation = orientation
            
            DispatchQueue.main.async {
                self?.notifyOrientationSupportChanged()
            }
        }
    }
    
    private func notifyOrientationSupportChanged() {
        versionHandler.updateSupportedOrientations(getSupportedInterfaceOrientations())
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
