//
//  OrientationLogger.swift
//
//
//  Created by Ivan Vezhnavets on 18/10/2026.
//

import os

internal enum OrientationLogger {
  private static let logger = Logger(subsystem: "react-native-orientation-turbo", category: "OrientationTurbo")

  static func warning(_ message: String) {
    logger.warning("\(message, privacy: .public)")
  }

  static func error(_ message: String) {
    logger.error("\(message, privacy: .public)")
  }
}
