//
//  LandscapeDirection.swift
//  
//
//  Created by Ivan Vezhnavets on 22/07/2025.
//

import Foundation
import UIKit

public enum LandscapeDirection: String, CaseIterable {
    case left = "LEFT"
    case right = "RIGHT"
    
    public var orientation: Orientation {
        switch self {
        case .left:
            return .landscapeLeft
        case .right:
            return .landscapeRight
        }
    }
    
    public var interfaceOrientationMask: UIInterfaceOrientationMask {
        switch self {
        case .left:
            return .landscapeLeft
        case .right:
            return .landscapeRight
        }
    }
}
