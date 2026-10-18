//
//  WindowSceneProvider.swift
//
//
//  Created by Ivan Vezhnavets on 18/10/2026.
//

import UIKit

/// Main thread only. Works for SceneDelegate apps and AppDelegate-only apps (UIKit creates a window scene for those too).
internal enum WindowSceneProvider {

  /// The scene the user is looking at: foreground-active, then foreground-inactive (e.g. during launch), then any
  static func activeWindowScene() -> UIWindowScene? {
    let windowScenes = allWindowScenes()
    return windowScenes.first { $0.activationState == .foregroundActive }
      ?? windowScenes.first { $0.activationState == .foregroundInactive }
      ?? windowScenes.first
  }

  /// Scenes an orientation change should be applied to: all foreground scenes, or all scenes if none is in the foreground yet
  static func targetWindowScenes() -> [UIWindowScene] {
    let windowScenes = allWindowScenes()
    let foregroundScenes = windowScenes.filter {
      $0.activationState == .foregroundActive || $0.activationState == .foregroundInactive
    }
    return foregroundScenes.isEmpty ? windowScenes : foregroundScenes
  }

  static func mainWindow(of windowScene: UIWindowScene) -> UIWindow? {
    return windowScene.keyWindow ?? windowScene.windows.first
  }

  private static func allWindowScenes() -> [UIWindowScene] {
    return UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
  }
}
