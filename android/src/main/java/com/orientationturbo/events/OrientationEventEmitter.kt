package com.orientationturbo.events

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableMap
import com.orientationturbo.core.OrientationManager

internal class OrientationEventEmitter(
  private val orientationManager: OrientationManager,
  private val emitOnOrientationChange: (ReadableMap) -> Unit,
  private val emitOnLockOrientationChange: (ReadableMap) -> Unit
) {
  fun onOrientationChange() {
    val eventData = Arguments.createMap().apply {
      putString("orientation", orientationManager.getCurrentDeviceOrientation().value)
    }
    emitOnOrientationChange(eventData)
  }

  fun onLockOrientationChange() {
    val eventData = Arguments.createMap().apply {
      val lockedOrientation = orientationManager.getLockedOrientation()
      if (lockedOrientation != null) {
        putString("orientation", lockedOrientation.value)
      } else {
        putNull("orientation")
      }
      putBoolean("isLocked", lockedOrientation != null)
    }
    emitOnLockOrientationChange(eventData)
  }
}
