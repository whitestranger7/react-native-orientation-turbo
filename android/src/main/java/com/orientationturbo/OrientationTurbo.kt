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

  @JvmStatic
  var sharedState: OrientationState? = null
    private set

  data class OrientationState(
    val orientation: Orientation,
    val isLocked: Boolean
  )

  /**
   * Locks the device to portrait orientation
   */
  @SuppressLint("SourceLockedOrientationActivity")
  @JvmStatic
  fun lockToPortrait(activity: Activity, direction: String? = null) {
    when (direction) {
      "UPSIDE_DOWN" -> {
        activity.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_REVERSE_PORTRAIT
        sharedState = OrientationState(Orientation.PORTRAIT, true)
      }
      else -> {
        activity.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_PORTRAIT
        sharedState = OrientationState(Orientation.PORTRAIT, true)
      }
    }
  }

  /**
   * Locks the device to landscape orientation
   */
  @JvmStatic
  fun lockToLandscape(activity: Activity, direction: String) {
    when (direction) {
      LandscapeDirection.LEFT.value -> {
        activity.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE
        sharedState = OrientationState(Orientation.LANDSCAPE_LEFT, true)
      }
      LandscapeDirection.RIGHT.value -> {
        activity.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_REVERSE_LANDSCAPE
        sharedState = OrientationState(Orientation.LANDSCAPE_RIGHT, true)
      }
      else -> {
        activity.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE
        sharedState = OrientationState(Orientation.LANDSCAPE_LEFT, true)
      }
    }
  }

  /**
   * Unlocks all orientations, allowing the device to rotate freely
   */
  @JvmStatic
  fun unlockAllOrientations(activity: Activity) {
    activity.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED
    sharedState = OrientationState(Orientation.PORTRAIT, false)
  }

  @JvmStatic
  internal fun clearSharedState() {
    sharedState = null
  }

  @JvmStatic
  internal fun updateSharedState(orientation: Orientation, isLocked: Boolean) {
    sharedState = OrientationState(orientation, isLocked)
  }
}
