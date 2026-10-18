package com.orientationturbo

import android.annotation.SuppressLint
import android.app.Activity
import com.orientationturbo.core.DisplayOrientation
import com.orientationturbo.core.OrientationController
import com.orientationturbo.core.OrientationLockSupport
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
   * Gets the orientation the screen currently shows
   */
  @JvmStatic
  fun getCurrentOrientation(activity: Activity): Orientation {
    return DisplayOrientation.currentOrientation(activity, activity) ?: OrientationState.getCurrentOrientation()
  }

  /**
   * Gets the current orientation from the stored state (locked orientation if locked, device orientation if unlocked).
   * Prefer getCurrentOrientation(activity), which returns what the screen shows.
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
   * Checks whether the system applies orientation locks for this app
   * (false on Android 16+ large screens for apps targeting API 36+)
   */
  @JvmStatic
  fun canLockOrientation(activity: Activity): Boolean {
    return OrientationLockSupport.canLockOrientation(activity, activity)
  }

  /**
   * Gets the currently locked orientation (PORTRAIT when unlocked)
   */
  @JvmStatic
  fun getLockedOrientation(): Orientation {
    return OrientationState.getLockedOrientation() ?: Orientation.PORTRAIT
  }
}
