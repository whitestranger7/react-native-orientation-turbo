package com.orientationturbo.utils

import android.content.pm.ActivityInfo
import android.content.pm.PackageManager
import com.facebook.react.bridge.ReactApplicationContext
import com.orientationturbo.core.OrientationController
import com.orientationturbo.enums.Orientation

/**
 * Sync functions for orientation configuration and state management
 */
object OrientationSync {

  fun initializeSharedState(reactContext: ReactApplicationContext) {
    val activity = reactContext.currentActivity ?: return
    val orientation = try {
      val activityInfo = reactContext.packageManager.getActivityInfo(activity.componentName, PackageManager.GET_META_DATA)
      when (activityInfo.screenOrientation) {
        ActivityInfo.SCREEN_ORIENTATION_PORTRAIT,
        ActivityInfo.SCREEN_ORIENTATION_SENSOR_PORTRAIT -> Orientation.PORTRAIT
        ActivityInfo.SCREEN_ORIENTATION_REVERSE_PORTRAIT -> Orientation.PORTRAIT_UPSIDE_DOWN
        ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE,
        ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE -> Orientation.LANDSCAPE_RIGHT
        ActivityInfo.SCREEN_ORIENTATION_REVERSE_LANDSCAPE -> Orientation.LANDSCAPE_LEFT
        else -> null
      }
    } catch (e: Exception) {
      return
    }
    OrientationController.initializeFromManifest(orientation)
  }
}
