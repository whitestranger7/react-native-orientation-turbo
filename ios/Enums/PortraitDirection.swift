//
//  PortraitDirection.swift
//
//
//  Created by Ivan Vezhnavets on 18/10/2026.
//

import UIKit

public enum PortraitDirection: String, CaseIterable {
  case up = "UP"
  case upsideDown = "UPSIDE_DOWN"

  public var interfaceOrientationMask: UIInterfaceOrientationMask {
    switch self {
    case .up:
      return .portrait
    case .upsideDown:
      return .portraitUpsideDown
    }
  }
}
