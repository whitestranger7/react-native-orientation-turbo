import UIKit

@objc(OrientationTurboImpl)
public class OrientationTurboImpl: NSObject {
  
  // MARK: - Singleton
  @objc public static let shared = OrientationTurboImpl()
  
  // MARK: - Properties
  private let orientationManager = OrientationManager()
  private let orientationTracker: OrientationTracker
  private let eventEmitter: OrientationEventEmitter
  
  @objc public var onOrientationChange: ((NSDictionary) -> Void)? {
    didSet {
      eventEmitter.onOrientationChange = onOrientationChange
      orientationTracker.onOrientationChange = { [weak self] event in
        self?.eventEmitter.emitOrientationChange()
      }
    }
  }
  
  // MARK: - Initialization
  private override init() {
    self.orientationTracker = OrientationTracker(orientationManager: orientationManager)
    self.eventEmitter = OrientationEventEmitter(orientationManager: orientationManager)
    super.init()
  }
  
  deinit {
    orientationTracker.stopOrientationTracking()
  }
  
  // MARK: - AppDelegate Integration
  
  /// Returns the currently supported interface orientations for the AppDelegate to use
  @objc public func getSupportedInterfaceOrientations() -> UIInterfaceOrientationMask {
    return orientationManager.getSupportedInterfaceOrientations()
  }
  
  // MARK: - Orientation Tracking
  
  @objc public func startOrientationTracking() {
    orientationTracker.startOrientationTracking()
  }
  
  @objc public func stopOrientationTracking() {
    orientationTracker.stopOrientationTracking()
  }
  
  // MARK: - Public Orientation Control
  
  @objc public func lockToPortrait() {
    lockToPortrait(nil)
  }
  
  @objc public func lockToPortrait(_ direction: String?) {
    orientationManager.lockToPortrait(direction)
    eventEmitter.emitLockOrientationChange()
  }
  
  @objc public func lockToLandscape(_ direction: String) {
    orientationManager.lockToLandscape(direction)
    eventEmitter.emitLockOrientationChange()
  }
  
  @objc public func unlockAllOrientations() {
    orientationManager.unlockAllOrientations()
    eventEmitter.emitLockOrientationChange()
  }
  
  @objc public func getCurrentOrientation() -> String {
    return orientationManager.getCurrentOrientation()
  }
  
  @objc public func isLocked() -> Bool {
    return orientationManager.isLocked()
  }
}
