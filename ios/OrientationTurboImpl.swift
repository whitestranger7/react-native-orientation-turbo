import UIKit

@objc(OrientationTurboImpl)
public class OrientationTurboImpl: NSObject {
  
  // MARK: - Singleton
  @objc public static let shared = OrientationTurboImpl()
  
  // MARK: - Properties
  private var currentLockedOrientation: UIInterfaceOrientationMask?
  private var isOrientationLocked: Bool = false
  private var isOrientationTrackingEnabled: Bool = false
  private var currentDeviceOrientation: String = "PORTRAIT"
  
  private let lockQueue = DispatchQueue(label: "orientation.lock.queue", attributes: .concurrent)
  
  @objc public var onOrientationChange: ((NSDictionary) -> Void)?
  
  // MARK: - Initialization
  private override init() {
    super.init()
    currentDeviceOrientation = getOrientationFromDevice()
  }
  
  deinit {
    stopOrientationTracking()
  }
  
  // MARK: - AppDelegate Integration
  
  /// Returns the currently supported interface orientations for the AppDelegate to use
  @objc public func getSupportedInterfaceOrientations() -> UIInterfaceOrientationMask {
    return lockQueue.sync {
      if isOrientationLocked, let lockedOrientation = currentLockedOrientation {
        return lockedOrientation
      } else {
        return .all
      }
    }
  }
  
  // MARK: - Orientation Tracking
  
  @objc public func startOrientationTracking() {
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
  
  @objc public func stopOrientationTracking() {
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
  
  @objc private func deviceOrientationDidChange() {
    let newOrientation = getOrientationFromDevice()
    
    guard newOrientation != currentDeviceOrientation else {
      return
    }
    
    let orientationEvent: NSDictionary = [
       "orientation": newOrientation,
       "faceDirection": getFaceDirection(for: newOrientation),
       "platform": "ios"
     ]
    
    currentDeviceOrientation = newOrientation
    onOrientationChange?(orientationEvent)
  }
  
  // MARK: - Public Orientation Control
  
  @objc public func lockToPortrait() {
    lockToPortrait(nil)
  }
  
  @objc public func lockToPortrait(_ direction: String?) {
    let orientation: UIInterfaceOrientationMask = (direction == "UPSIDE_DOWN") ? .portraitUpsideDown : .portrait
    lockToOrientation(orientation)
  }
  
  @objc public func lockToLandscape(_ direction: String) {
    let orientation: UIInterfaceOrientationMask = (direction == "LEFT") ? .landscapeLeft : .landscapeRight
    lockToOrientation(orientation)
  }
  
  @objc public func unlockAllOrientations() {
    updateLockState(locked: false, orientation: nil)
  }
  
  @objc public func getCurrentOrientation() -> String {
    guard Thread.isMainThread else {
      return DispatchQueue.main.sync {
        return getCurrentOrientationInternal()
      }
    }
    return getCurrentOrientationInternal()
  }
  
  @objc public func isLocked() -> Bool {
    return lockQueue.sync { isOrientationLocked }
  }
  
  // MARK: - Private Implementation
  
  private func lockToOrientation(_ orientation: UIInterfaceOrientationMask) {
    updateLockState(locked: true, orientation: orientation)
    requestOrientationChange(orientation)
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
    if #available(iOS 16.0, *) {
      updateSupportedOrientationsModern()
    } else {
      updateSupportedOrientationsLegacy()
    }
  }
  
  private func requestOrientationChange(_ orientation: UIInterfaceOrientationMask, completion: ((Bool) -> Void)? = nil) {
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
  private func updateSupportedOrientationsModern() {
    guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene else {
      return
    }
    
    let supportedOrientations = getSupportedInterfaceOrientations()
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
      userInfo: ["supportedOrientations": getSupportedInterfaceOrientations().rawValue]
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
  
  // MARK: - Orientation Helpers
  
  private func getTargetOrientation(from mask: UIInterfaceOrientationMask) -> UIInterfaceOrientation? {
    switch mask {
    case .portrait: return .portrait
    case .landscapeLeft: return .landscapeLeft
    case .landscapeRight: return .landscapeRight
    case .portraitUpsideDown: return .portraitUpsideDown
    default: return nil
    }
  }
  
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
    case .portrait: return "PORTRAIT"
    case .portraitUpsideDown: return "PORTRAIT_UPSIDE_DOWN"
    case .landscapeLeft: return "LANDSCAPE_LEFT"
    case .landscapeRight: return "LANDSCAPE_RIGHT"
    case .unknown: return nil
    @unknown default: return nil
    }
  }
  
  private func getOrientationFromDevice() -> String {
    switch UIDevice.current.orientation {
    case .portrait: return "PORTRAIT"
    case .portraitUpsideDown: return "PORTRAIT_UPSIDE_DOWN"
    case .landscapeLeft: return "LANDSCAPE_LEFT"
    case .landscapeRight: return "LANDSCAPE_RIGHT"
    case .faceUp: return "FACE_UP"
    case .faceDown: return "FACE_DOWN"
    case .unknown:
      return getOrientationFallback()
    @unknown default: return "PORTRAIT"
    }
  }
  
  private func getOrientationFallback() -> String {
    if #available(iOS 13.0, *) {
      return "PORTRAIT"
    } else {
      switch UIApplication.shared.statusBarOrientation {
      case .portrait: return "PORTRAIT"
      case .portraitUpsideDown: return "PORTRAIT_UPSIDE_DOWN"
      case .landscapeLeft: return "LANDSCAPE_LEFT"
      case .landscapeRight: return "LANDSCAPE_RIGHT"
      default: return "PORTRAIT"
      }
    }
  }
  
  private func getFaceDirection(for orientation: String) -> String {
    switch orientation {
    case "FACE_DOWN":
      return "DOWN"
    case "FACE_UP", "PORTRAIT", "LANDSCAPE_LEFT", "LANDSCAPE_RIGHT", "PORTRAIT_UPSIDE_DOWN":
      return "UP"
    default:
      return "UP"
    }
  }
}
