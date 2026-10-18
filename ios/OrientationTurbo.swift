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
  /// Typed as the protocol, so the React Native-only methods of the implementation stay hidden
  @objc public static let shared: OrientationTurboPublicProtocol = OrientationTurboImpl.shared
  
  private override init() {
    super.init()
  }
}
