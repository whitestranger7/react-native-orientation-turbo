import UIKit

@objc(OrientationTurboImpl)
public class OrientationTurboImpl: NSObject {
  
  @objc public static let shared = OrientationTurboImpl()
  
  private var currentLockedOrientation: UIInterfaceOrientationMask?
  private var isOrientationLocked: Bool = false
  
  private let lockQueue = DispatchQueue(label: "orientation.lock.queue", attributes: .concurrent)
  
  private override init() {
    super.init()
  }
  
  // MARK: - Public Methods
  
  @objc public func lockToPortrait() {
    self.updateLockState(locked: true, orientation: .portrait)
    self.changeOrientation(.portrait)
  }
  
  @objc public func lockToLandscape(_ direction: String) {
    let orientation: UIInterfaceOrientationMask = direction == "LEFT" ? .landscapeLeft : .landscapeRight
    self.updateLockState(locked: true, orientation: orientation)
    self.changeOrientation(orientation)
  }
  
  @objc public func unlockAllOrientations() {
    self.updateLockState(locked: false, orientation: nil)
    
    self.changeOrientation(.portrait) { [weak self] success in
      if success {
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
          self?.changeOrientation(.all)
        }
      }
    }
  }
  
  @objc public func getCurrentOrientation() -> String {
    guard Thread.isMainThread else {
      var result = "UNKNOWN"
      DispatchQueue.main.sync {
        result = self.getCurrentOrientationInternal()
      }
      return result
    }
    
    return self.getCurrentOrientationInternal()
  }
  
  @objc public func isLocked() -> Bool {
    return lockQueue.sync { self.isOrientationLocked }
  }
  
  // MARK: - Private Methods
  
  private func updateLockState(locked: Bool, orientation: UIInterfaceOrientationMask?) {
    lockQueue.async(flags: .barrier) {
      self.isOrientationLocked = locked
      self.currentLockedOrientation = orientation
    }
  }
  
  private func changeOrientation(_ orientation: UIInterfaceOrientationMask, completion: ((Bool) -> Void)? = nil) {
    DispatchQueue.main.async {
      if #available(iOS 16.0, *) {
        self.updateOrientationModern(orientation, completion: completion)
      } else {
        self.updateOrientationLegacy(orientation)
        completion?(true)
      }
    }
  }
  
  @available(iOS 16.0, *)
  private func updateOrientationModern(_ orientation: UIInterfaceOrientationMask, completion: ((Bool) -> Void)?) {
    guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene else {
      print("OrientationController: No window scene available")
      completion?(false)
      return
    }
    
    let geometryPreferences = UIWindowScene.GeometryPreferences.iOS(interfaceOrientations: orientation)
    windowScene.requestGeometryUpdate(geometryPreferences) { error in
      DispatchQueue.main.async {
        let success = error.localizedDescription.contains("succeeded") ||
                     error.localizedDescription.isEmpty ||
                     !error.localizedDescription.contains("failed")
        
        if !success {
          print("OrientationController: Orientation update failed - \(error.localizedDescription)")
        }
        
        completion?(success)
      }
    }
  }
  
  private func updateOrientationLegacy(_ orientation: UIInterfaceOrientationMask) {
    NotificationCenter.default.post(
      name: NSNotification.Name("OrientationDidChange"),
      object: nil,
      userInfo: ["orientation": orientation.rawValue]
    )
    
    self.forceInterfaceOrientationUpdate(orientation)
  }
  
      private func forceInterfaceOrientationUpdate(_ orientation: UIInterfaceOrientationMask) {
        guard #available(iOS 13.0, *),
              let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene else {
            return
        }
        
        if #available(iOS 16.0, *) {
            if let window = windowScene.windows.first {
                window.rootViewController?.setNeedsUpdateOfSupportedInterfaceOrientations()
            }
        }
        
        let targetOrientation = self.getTargetOrientation(from: orientation)
        NotificationCenter.default.post(
            name: NSNotification.Name("ForceOrientation"),
            object: targetOrientation
        )
        
        if #available(iOS 13.0, *) {
            if #available(iOS 16.0, *) {
                // iOS 16+ already handled above
            } else {
                DispatchQueue.main.async {
                    UIViewController.attemptRotationToDeviceOrientation()
                }
            }
        }
    }
  
  private func getTargetOrientation(from mask: UIInterfaceOrientationMask) -> UIInterfaceOrientation? {
    switch mask {
    case .portrait:
      return .portrait
    case .landscapeLeft:
      return .landscapeLeft
    case .landscapeRight:
      return .landscapeRight
    case .portraitUpsideDown:
      return .portraitUpsideDown
    default:
      return nil
    }
  }
  
  private func getCurrentOrientationInternal() -> String {
    if #available(iOS 13.0, *) {
      return self.getOrientationFromWindowScene() ?? self.getOrientationFromDevice()
    } else {
      return self.getOrientationFromDevice()
    }
  }
  
  @available(iOS 13.0, *)
  private func getOrientationFromWindowScene() -> String? {
    guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene else {
      return nil
    }
    
    switch windowScene.interfaceOrientation {
    case .portrait:
      return "PORTRAIT"
    case .portraitUpsideDown:
      return "PORTRAIT_UPSIDE_DOWN"
    case .landscapeLeft:
      return "LANDSCAPE_LEFT"
    case .landscapeRight:
      return "LANDSCAPE_RIGHT"
    case .unknown:
      return nil
    @unknown default:
      return nil
    }
  }
  
  private func getOrientationFromDevice() -> String {
    switch UIDevice.current.orientation {
    case .portrait:
      return "PORTRAIT"
    case .portraitUpsideDown:
      return "PORTRAIT_UPSIDE_DOWN"
    case .landscapeLeft:
      return "LANDSCAPE_LEFT"
    case .landscapeRight:
      return "LANDSCAPE_RIGHT"
    case .faceUp, .faceDown, .unknown:
      if #available(iOS 13.0, *) {
        return "PORTRAIT"
      } else {
        switch UIApplication.shared.statusBarOrientation {
        case .portrait:
          return "PORTRAIT"
        case .portraitUpsideDown:
          return "PORTRAIT_UPSIDE_DOWN"
        case .landscapeLeft:
          return "LANDSCAPE_LEFT"
        case .landscapeRight:
          return "LANDSCAPE_RIGHT"
        default:
          return "PORTRAIT"
        }
      }
    @unknown default:
      return "PORTRAIT"
    }
  }
}
