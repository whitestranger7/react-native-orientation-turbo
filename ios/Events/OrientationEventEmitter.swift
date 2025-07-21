//
//  OrientationEventEmitter.swift
//
//
//  Created by Ivan Vezhnavets on 22/07/2025.
//

import Foundation

internal class OrientationEventEmitter {
  
  // MARK: - Properties
  private weak var orientationManager: OrientationManager?
  
  var onOrientationChange: ((NSDictionary) -> Void)?
  var onLockOrientationChange: ((NSDictionary) -> Void)?
  
  // MARK: - Initialization
  init(orientationManager: OrientationManager) {
    self.orientationManager = orientationManager
  }
  
  // MARK: - Public Methods
  
  func emitOrientationChange() {
    guard let orientationManager = orientationManager else { return }
    
    let eventData: NSDictionary = [
      "orientation": orientationManager.getCurrentDeviceOrientation()
    ]
    onOrientationChange?(eventData)
  }
  
  func emitLockOrientationChange() {
    guard let orientationManager = orientationManager else { return }
    
    let isLocked = orientationManager.getIsLocked()
    var eventData: [String: Any] = [
      "isLocked": isLocked
    ]
    
    if isLocked, let orientationString = orientationManager.getLockedOrientationString() {
      eventData["orientation"] = orientationString
    } else {
      eventData["orientation"] = NSNull()
    }
    
    onLockOrientationChange?(eventData as NSDictionary)
  }
}
