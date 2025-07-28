package com.orientationturbo.utils

import android.content.pm.ActivityInfo
import android.content.pm.PackageManager
import com.facebook.react.bridge.ReactApplicationContext
import com.orientationturbo.OrientationState
import com.orientationturbo.enums.Orientation

/**
 * Sync functions for orientation configuration and state management
 */
object OrientationSync {

  private fun syncWithManifestConfiguration(reactContext: ReactApplicationContext) {
    try {
      val activity = reactContext.currentActivity
      if (activity != null) {
        val packageManager = reactContext.packageManager
        val componentName = activity.componentName
        val activityInfo = packageManager.getActivityInfo(componentName, PackageManager.GET_META_DATA)

        when (activityInfo.screenOrientation) {
          ActivityInfo.SCREEN_ORIENTATION_PORTRAIT -> {
            OrientationState.setState(Orientation.PORTRAIT, true)
          }
          ActivityInfo.SCREEN_ORIENTATION_REVERSE_PORTRAIT -> {
            OrientationState.setState(Orientation.PORTRAIT, true)
          }
          ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE -> {
            OrientationState.setState(Orientation.LANDSCAPE_RIGHT, true)
          }
          ActivityInfo.SCREEN_ORIENTATION_REVERSE_LANDSCAPE -> {
            OrientationState.setState(Orientation.LANDSCAPE_LEFT, true)
          }
          ActivityInfo.SCREEN_ORIENTATION_SENSOR_PORTRAIT -> {
            OrientationState.setState(Orientation.PORTRAIT, true)
          }
          ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE -> {
            OrientationState.setState(Orientation.LANDSCAPE_RIGHT, true)
          }
          ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED,
          ActivityInfo.SCREEN_ORIENTATION_SENSOR,
          ActivityInfo.SCREEN_ORIENTATION_FULL_SENSOR,
          ActivityInfo.SCREEN_ORIENTATION_USER -> {
            OrientationState.setState(Orientation.PORTRAIT, false)
          }
          else -> {
            OrientationState.setState(Orientation.PORTRAIT, false)
          }
        }
      } else {
        OrientationState.setState(Orientation.PORTRAIT, false)
      }
    } catch (e: Exception) {
      OrientationState.setState(Orientation.PORTRAIT, false)
    }
  }

  fun initializeSharedState(reactContext: ReactApplicationContext) {
    val (currentOrientation, isLocked, _) = OrientationState.getState()

    if (isLocked || currentOrientation != Orientation.PORTRAIT) {
      return
    }

    syncWithManifestConfiguration(reactContext)
  }
}
