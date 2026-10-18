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
            OrientationState.setLockedOrientation(Orientation.PORTRAIT)
          }
          ActivityInfo.SCREEN_ORIENTATION_REVERSE_PORTRAIT -> {
            OrientationState.setLockedOrientation(Orientation.PORTRAIT_UPSIDE_DOWN)
          }
          ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE -> {
            OrientationState.setLockedOrientation(Orientation.LANDSCAPE_RIGHT)
          }
          ActivityInfo.SCREEN_ORIENTATION_REVERSE_LANDSCAPE -> {
            OrientationState.setLockedOrientation(Orientation.LANDSCAPE_LEFT)
          }
          ActivityInfo.SCREEN_ORIENTATION_SENSOR_PORTRAIT -> {
            OrientationState.setLockedOrientation(Orientation.PORTRAIT)
          }
          ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE -> {
            OrientationState.setLockedOrientation(Orientation.LANDSCAPE_RIGHT)
          }
          ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED,
          ActivityInfo.SCREEN_ORIENTATION_SENSOR,
          ActivityInfo.SCREEN_ORIENTATION_FULL_SENSOR,
          ActivityInfo.SCREEN_ORIENTATION_USER -> {
            OrientationState.setLockedOrientation(null)
          }
          else -> {
            OrientationState.setLockedOrientation(null)
          }
        }
      } else {
        OrientationState.setLockedOrientation(null)
      }
    } catch (e: Exception) {
      OrientationState.setLockedOrientation(null)
    }
  }

  fun initializeSharedState(reactContext: ReactApplicationContext) {
    if (OrientationState.isLocked()) {
      return
    }

    syncWithManifestConfiguration(reactContext)
  }
}
