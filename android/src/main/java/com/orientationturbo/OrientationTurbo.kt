package com.orientationturbo

import android.annotation.SuppressLint
import android.app.Activity
import com.orientationturbo.core.OrientationController
import com.orientationturbo.enums.LandscapeDirection
import com.orientationturbo.enums.Orientation
import com.orientationturbo.enums.PortraitDirection

/**
 * OrientationTurbo - Shared controller for orientation management
 * For native integration with Activity
 * Can be used before React Native loads and syncs with OrientationTurboModule
 */
object OrientationTurbo {

  /**
   * Locks the device to portrait orientation
   */
  @SuppressLint("SourceLockedOrientationActivity")
  @JvmStatic
  fun lockToPortrait(activity: Activity) {
    OrientationController.lock(activity, Orientation.PORTRAIT)
  }

  /**
   * Locks the device to portrait orientation in the given direction
   */
  @SuppressLint("SourceLockedOrientationActivity")
  @JvmStatic
  fun lockToPortrait(activity: Activity, direction: PortraitDirection) {
    OrientationController.lock(activity, OrientationController.portraitOrientation(direction))
  }

  /**
   * Locks the device to landscape orientation
   */
  @JvmStatic
  fun lockToLandscape(activity: Activity, direction: LandscapeDirection) {
    OrientationController.lock(activity, OrientationController.landscapeOrientation(direction))
  }

  /**
   * Unlocks all orientations, allowing the device to rotate freely
   */
  @JvmStatic
  fun unlockAllOrientations(activity: Activity) {
    OrientationController.unlock(activity)
  }

  /**
   * Gets the current orientation (locked orientation if locked, device orientation if unlocked)
   */
  @JvmStatic
  fun getCurrentOrientation(): Orientation {
    return OrientationState.getCurrentOrientation()
  }

  /**
   * Checks if orientation is currently locked
   */
  @JvmStatic
  fun isLocked(): Boolean {
    return OrientationState.isLocked()
  }

  /**
   * Gets the currently locked orientation (PORTRAIT when unlocked)
   */
  @JvmStatic
  fun getLockedOrientation(): Orientation {
    return OrientationState.getLockedOrientation() ?: Orientation.PORTRAIT
  }
}
