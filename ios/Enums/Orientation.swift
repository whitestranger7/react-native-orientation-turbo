//
//  Orientation.swift
//  
//
//  Created by Ivan Vezhnavets on 22/07/2025.
//

import Foundation
import UIKit

public enum Orientation: String, CaseIterable {
    case portrait = "PORTRAIT"
    case portraitUpsideDown = "PORTRAIT_UPSIDE_DOWN"
    case landscapeLeft = "LANDSCAPE_LEFT"
    case landscapeRight = "LANDSCAPE_RIGHT"
    case faceUp = "FACE_UP"
    case faceDown = "FACE_DOWN"
    
    public var interfaceOrientationMask: UIInterfaceOrientationMask {
        switch self {
        case .portrait:
            return .portrait
        case .portraitUpsideDown:
            return .portraitUpsideDown
        case .landscapeLeft:
            return .landscapeLeft
        case .landscapeRight:
            return .landscapeRight
        case .faceUp, .faceDown:
            return .all
        }
    }
    
    public var interfaceOrientation: UIInterfaceOrientation? {
        switch self {
        case .portrait:
            return .portrait
        case .portraitUpsideDown:
            return .portraitUpsideDown
        case .landscapeLeft:
            return .landscapeLeft
        case .landscapeRight:
            return .landscapeRight
        case .faceUp, .faceDown:
            return nil
        }
    }
}
