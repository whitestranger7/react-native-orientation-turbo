package com.orientationturbo

import com.orientationturbo.enums.Orientation

/**
 * Internal shared state holder for orientation management
 * Package-private - only accessible within com.orientationturbo package
 */
internal object OrientationState {

  private var currentLockedOrientation: Orientation = Orientation.PORTRAIT
  private var isOrientationLocked: Boolean = false
  private var currentDeviceOrientation: Orientation = Orientation.PORTRAIT

  fun setLockedOrientation(orientation: Orientation) {
    currentLockedOrientation = orientation
  }

  fun getLockedOrientation(): Orientation {
    return currentLockedOrientation
  }

  fun setLocked(locked: Boolean) {
    isOrientationLocked = locked
  }

  fun isLocked(): Boolean {
    return isOrientationLocked
  }

  fun setDeviceOrientation(orientation: Orientation) {
    currentDeviceOrientation = orientation
  }

  fun getCurrentOrientation(): Orientation {
    return if (isOrientationLocked) {
      currentLockedOrientation
    } else {
      currentDeviceOrientation
    }
  }

  fun getCurrentDeviceOrientation(): Orientation {
    return currentDeviceOrientation
  }

  fun setState(lockedOrientation: Orientation, locked: Boolean, deviceOrientation: Orientation? = null) {
    currentLockedOrientation = lockedOrientation
    isOrientationLocked = locked
    deviceOrientation?.let { currentDeviceOrientation = it }
  }

  fun getState(): Triple<Orientation, Boolean, Orientation> {
    return Triple(currentLockedOrientation, isOrientationLocked, currentDeviceOrientation)
  }
}
