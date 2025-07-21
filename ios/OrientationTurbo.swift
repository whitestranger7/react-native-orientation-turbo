//
//  OrientationTurbo.swift
//
//
//  Created by Ivan Vezhnavets on 22/07/2025.
//

import UIKit

/// Main public interface for OrientationTurbo library
/// Use this class for all native iOS interactions
@objc public class OrientationTurbo: NSObject {
  @objc public static let shared: OrientationTurboPublicProtocol = OrientationTurboShared(implementation: OrientationTurboImpl.shared)
  
  private override init() {
    super.init()
  }
}
