package com.orientationturbo.core

import android.content.pm.ActivityInfo
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.UiThreadUtil
import com.orientationturbo.enums.LandscapeDirection
import com.orientationturbo.enums.Orientation

class OrientationManager(private val reactContext: ReactApplicationContext) {

  private var currentLockedOrientation: Orientation = Orientation.PORTRAIT
  private var isOrientationLocked: Boolean = false
  private var currentDeviceOrientation: Orientation = Orientation.PORTRAIT

  private fun setOrientation(orientation: Int) {
    UiThreadUtil.runOnUiThread {
      val activity = reactContext.currentActivity
      activity?.requestedOrientation = orientation
    }
  }

  fun getCurrentDeviceOrientation(): Orientation {
    return currentDeviceOrientation
  }

  fun getCurrentOrientation(): String {
    return if (isOrientationLocked) {
      currentLockedOrientation.value
    } else {
      currentDeviceOrientation.value
    }
  }

  fun getIsLocked(): Boolean {
    return isOrientationLocked
  }

  fun getLockedOrientation(): Orientation {
    return currentLockedOrientation
  }

  fun setLockedOrientation(orientation: Orientation, isLocked: Boolean?) {
    currentLockedOrientation = orientation
    if (isLocked != null) {
      isOrientationLocked = isLocked
    }
  }

  fun setDeviceOrientation(orientation: Orientation) {
    currentDeviceOrientation = orientation
  }

  fun lockToPortrait(direction: String?) {
    when (direction) {
      "UPSIDE_DOWN" -> {
        // Note: Android rarely supports upside-down orientation
        // Currently this type will just set Orientation to Portrait
        currentLockedOrientation = Orientation.PORTRAIT
      }
      else -> {
        setOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT)
        currentLockedOrientation = Orientation.PORTRAIT
      }
    }
    isOrientationLocked = true
  }

  fun lockToLandscape(direction: String) {
    when (direction) {
      LandscapeDirection.LEFT.value -> {
        setOrientation(ActivityInfo.SCREEN_ORIENTATION_REVERSE_LANDSCAPE)
        currentLockedOrientation = Orientation.LANDSCAPE_LEFT
      }
      LandscapeDirection.RIGHT.value -> {
        setOrientation(ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE)
        currentLockedOrientation = Orientation.LANDSCAPE_RIGHT
      }
      else -> {
        setOrientation(ActivityInfo.SCREEN_ORIENTATION_REVERSE_LANDSCAPE)
        currentLockedOrientation = Orientation.LANDSCAPE_LEFT
      }
    }
    isOrientationLocked = true
  }

  fun unlockAllOrientations() {
    setOrientation(ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED)
    isOrientationLocked = false
  }
}
