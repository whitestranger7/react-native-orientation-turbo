package com.orientationturbo.core

import com.orientationturbo.OrientationState
import com.orientationturbo.enums.LandscapeDirection
import com.orientationturbo.enums.Orientation

import android.app.Activity
import android.content.pm.ActivityInfo
import android.util.Log
import com.facebook.react.bridge.UiThreadUtil

/**
 * Applies orientation locks; shared by the React Native module and the native OrientationTurbo API
 */
internal object OrientationController {
  private const val TAG = "OrientationTurbo"
  private const val UPSIDE_DOWN = "UPSIDE_DOWN"

  /** Called after every lock change, whether it comes from JS or from native code */
  @Volatile
  var onLockChange: (() -> Unit)? = null

  fun lock(activity: Activity?, orientation: Orientation) {
    OrientationState.setLockedOrientation(orientation)
    setRequestedOrientation(activity, orientation.toActivityInfoOrientation())
    onLockChange?.invoke()
  }

  fun unlock(activity: Activity?) {
    OrientationState.setLockedOrientation(null)
    setRequestedOrientation(activity, ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED)
    onLockChange?.invoke()
  }

  fun portraitOrientation(direction: String?): Orientation {
    return if (direction == UPSIDE_DOWN) Orientation.PORTRAIT_UPSIDE_DOWN else Orientation.PORTRAIT
  }

  fun landscapeOrientation(direction: String?): Orientation {
    return when (direction) {
      LandscapeDirection.RIGHT.value -> Orientation.LANDSCAPE_RIGHT
      else -> Orientation.LANDSCAPE_LEFT
    }
  }

  fun landscapeOrientation(direction: LandscapeDirection): Orientation {
    return when (direction) {
      LandscapeDirection.LEFT -> Orientation.LANDSCAPE_LEFT
      LandscapeDirection.RIGHT -> Orientation.LANDSCAPE_RIGHT
    }
  }

  private fun setRequestedOrientation(activity: Activity?, requestedOrientation: Int) {
    if (activity == null) {
      Log.w(TAG, "No current activity, the orientation lock is only stored in the state")
      return
    }

    if (UiThreadUtil.isOnUiThread()) {
      activity.requestedOrientation = requestedOrientation
    } else {
      UiThreadUtil.runOnUiThread {
        activity.requestedOrientation = requestedOrientation
      }
    }
  }

  private fun Orientation.toActivityInfoOrientation(): Int {
    return when (this) {
      Orientation.PORTRAIT -> ActivityInfo.SCREEN_ORIENTATION_PORTRAIT
      Orientation.PORTRAIT_UPSIDE_DOWN -> ActivityInfo.SCREEN_ORIENTATION_REVERSE_PORTRAIT
      Orientation.LANDSCAPE_LEFT -> ActivityInfo.SCREEN_ORIENTATION_REVERSE_LANDSCAPE
      Orientation.LANDSCAPE_RIGHT -> ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE
    }
  }
}
