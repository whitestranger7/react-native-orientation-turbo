package com.orientationturbo

import com.orientationturbo.enums.Orientation

/**
 * Internal shared state holder for orientation management, safe to use from any thread
 * Package-private - only accessible within com.orientationturbo package
 */
internal object OrientationState {

  data class Snapshot(
    /** `null` when unlocked */
    val lockedOrientation: Orientation?,
    val deviceOrientation: Orientation,
  )

  private val lock = Any()

  @Volatile
  var snapshot = Snapshot(lockedOrientation = null, deviceOrientation = Orientation.PORTRAIT)
    private set

  fun isLocked(): Boolean {
    return snapshot.lockedOrientation != null
  }

  fun getLockedOrientation(): Orientation? {
    return snapshot.lockedOrientation
  }

  fun getCurrentDeviceOrientation(): Orientation {
    return snapshot.deviceOrientation
  }

  fun getCurrentOrientation(): Orientation {
    val current = snapshot
    return current.lockedOrientation ?: current.deviceOrientation
  }

  fun setLockedOrientation(orientation: Orientation?) {
    synchronized(lock) {
      snapshot = snapshot.copy(lockedOrientation = orientation)
    }
  }

  fun setDeviceOrientation(orientation: Orientation) {
    synchronized(lock) {
      snapshot = snapshot.copy(deviceOrientation = orientation)
    }
  }
}
