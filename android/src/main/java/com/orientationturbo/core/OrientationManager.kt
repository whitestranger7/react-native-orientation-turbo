package com.orientationturbo.core

import com.orientationturbo.enums.Orientation
import com.orientationturbo.OrientationState

import com.facebook.react.bridge.ReactApplicationContext

internal class OrientationManager(private val reactContext: ReactApplicationContext) {
  fun getCurrentDeviceOrientation(): Orientation {
    return OrientationState.getCurrentDeviceOrientation()
  }

  fun getCurrentOrientation(): Orientation {
    return OrientationState.getCurrentOrientation()
  }

  fun getIsLocked(): Boolean {
    return OrientationState.isLocked()
  }

  /** `null` when unlocked */
  fun getLockedOrientation(): Orientation? {
    return OrientationState.getLockedOrientation()
  }

  fun setDeviceOrientation(orientation: Orientation) {
    OrientationState.setDeviceOrientation(orientation)
  }

  fun lockToPortrait(direction: String?) {
    OrientationController.lock(reactContext.currentActivity, OrientationController.portraitOrientation(direction))
  }

  fun lockToLandscape(direction: String) {
    OrientationController.lock(reactContext.currentActivity, OrientationController.landscapeOrientation(direction))
  }

  fun unlockAllOrientations() {
    OrientationController.unlock(reactContext.currentActivity)
  }
}
