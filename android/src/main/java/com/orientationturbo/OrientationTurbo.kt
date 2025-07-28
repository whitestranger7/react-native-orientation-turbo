package com.orientationturbo

import android.annotation.SuppressLint
import android.app.Activity
import android.content.pm.ActivityInfo
import com.orientationturbo.enums.LandscapeDirection
import com.orientationturbo.enums.Orientation

/**
 * OrientationTurbo - Shared state manager for orientation control
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
    activity.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_PORTRAIT
    OrientationState.setState(Orientation.PORTRAIT, true)
  }

  /**
   * Locks the device to landscape orientation
   */
  @JvmStatic
  fun lockToLandscape(activity: Activity, direction: LandscapeDirection) {
    when (direction) {
      LandscapeDirection.LEFT -> {
        activity.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_REVERSE_LANDSCAPE
        OrientationState.setState(Orientation.LANDSCAPE_LEFT, true)
      }
      LandscapeDirection.RIGHT -> {
        activity.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE
        OrientationState.setState(Orientation.LANDSCAPE_RIGHT, true)
      }
      else -> {
        activity.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_REVERSE_LANDSCAPE
        OrientationState.setState(Orientation.LANDSCAPE_LEFT, true)
      }
    }
  }

  /**
   * Unlocks all orientations, allowing the device to rotate freely
   */
  @JvmStatic
  fun unlockAllOrientations(activity: Activity) {
    activity.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED
    OrientationState.setState(Orientation.PORTRAIT, false)
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
   * Gets the currently locked orientation
   */
  @JvmStatic
  fun getLockedOrientation(): Orientation {
    return OrientationState.getLockedOrientation()
  }
}
