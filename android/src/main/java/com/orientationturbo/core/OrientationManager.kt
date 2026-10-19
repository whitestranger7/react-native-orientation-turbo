package com.orientationturbo.core

import com.orientationturbo.enums.Orientation
import com.orientationturbo.OrientationState

import android.util.Log
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
    val orientation = OrientationController.portraitOrientation(direction)
    if (orientation == null) {
      Log.w(TAG, "lockToPortrait ignored: invalid direction \"$direction\" (expected UP or UPSIDE_DOWN)")
      return
    }
    OrientationController.lock({ reactContext.currentActivity }, orientation)
  }

  fun lockToLandscape(direction: String) {
    val orientation = OrientationController.landscapeOrientation(direction)
    if (orientation == null) {
      Log.w(TAG, "lockToLandscape ignored: invalid direction \"$direction\" (expected LEFT or RIGHT)")
      return
    }
    OrientationController.lock({ reactContext.currentActivity }, orientation)
  }

  /** What the screen shows; falls back to the stored state when there's no display to read */
  fun getUiOrientation(): Orientation {
    return DisplayOrientation.currentOrientation(reactContext, reactContext.currentActivity)
      ?: OrientationState.getCurrentOrientation()
  }

  fun unlockAllOrientations() {
    OrientationController.unlock { reactContext.currentActivity }
  }

  private companion object {
    const val TAG = "OrientationTurbo"
  }
}
