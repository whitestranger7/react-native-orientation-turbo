package com.orientationturbo.utils

import android.content.pm.ActivityInfo
import android.content.pm.PackageManager
import com.facebook.react.bridge.ReactApplicationContext
import com.orientationturbo.OrientationTurbo
import com.orientationturbo.enums.Orientation

/**
 * Sync functions for orientation configuration and state management
 */
object OrientationSync {

  data class OrientationState(
    val orientation: Orientation,
    val isLocked: Boolean
  )

  private fun syncWithSharedState(): OrientationState? {
    return OrientationTurbo.sharedState?.let { sharedState ->
      OrientationTurbo.clearSharedState()
      OrientationState(
        orientation = sharedState.orientation,
        isLocked = sharedState.isLocked
      )
    }
  }

  private fun syncWithManifestConfiguration(reactContext: ReactApplicationContext): OrientationState {
    return try {
      val activity = reactContext.currentActivity
      if (activity != null) {
        val packageManager = reactContext.packageManager
        val componentName = activity.componentName
        val activityInfo = packageManager.getActivityInfo(componentName, PackageManager.GET_META_DATA)

        when (activityInfo.screenOrientation) {
          ActivityInfo.SCREEN_ORIENTATION_PORTRAIT -> {
            OrientationState(Orientation.PORTRAIT, true)
          }
          ActivityInfo.SCREEN_ORIENTATION_REVERSE_PORTRAIT -> {
            OrientationState(Orientation.PORTRAIT, true)
          }
          ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE -> {
            OrientationState(Orientation.LANDSCAPE_LEFT, true)
          }
          ActivityInfo.SCREEN_ORIENTATION_REVERSE_LANDSCAPE -> {
            OrientationState(Orientation.LANDSCAPE_RIGHT, true)
          }
          ActivityInfo.SCREEN_ORIENTATION_SENSOR_PORTRAIT -> {
            OrientationState(Orientation.PORTRAIT, true)
          }
          ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE -> {
            OrientationState(Orientation.LANDSCAPE_LEFT, true)
          }
          ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED,
          ActivityInfo.SCREEN_ORIENTATION_SENSOR,
          ActivityInfo.SCREEN_ORIENTATION_FULL_SENSOR,
          ActivityInfo.SCREEN_ORIENTATION_USER -> {
            OrientationState(Orientation.PORTRAIT, false)
          }
          else -> {
            OrientationState(Orientation.PORTRAIT, false)
          }
        }
      } else {
        OrientationState(Orientation.PORTRAIT, false)
      }
    } catch (e: Exception) {
      OrientationState(Orientation.PORTRAIT, false)
    }
  }

  fun getInitialOrientationState(reactContext: ReactApplicationContext): OrientationState {
    if (OrientationTurbo.sharedState != null) {
      syncWithSharedState()?.let { sharedState ->
        return sharedState
      }
    }

    return syncWithManifestConfiguration(reactContext)
  }
}
