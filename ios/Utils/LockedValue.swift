//
//  LockedValue.swift
//
//
//  Created by Ivan Vezhnavets on 18/10/2026.
//

import Foundation

/// A value that can be read and written from any thread
internal final class LockedValue<Value> {
  private let lock = NSLock()
  private var value: Value

  init(_ value: Value) {
    self.value = value
  }

  func get() -> Value {
    lock.lock()
    defer { lock.unlock() }
    return value
  }

  func set(_ newValue: Value) {
    lock.lock()
    defer { lock.unlock() }
    value = newValue
  }
}
