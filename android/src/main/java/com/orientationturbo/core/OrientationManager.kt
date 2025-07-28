package com.orientationturbo.core

import com.orientationturbo.enums.LandscapeDirection
import com.orientationturbo.enums.Orientation
import com.orientationturbo.OrientationState

import android.content.pm.ActivityInfo
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.UiThreadUtil

internal class OrientationManager(private val reactContext: ReactApplicationContext) {
  private fun setOrientation(orientation: Int) {
    UiThreadUtil.runOnUiThread {
      val activity = reactContext.currentActivity
      activity?.requestedOrientation = orientation
    }
  }

  fun getCurrentDeviceOrientation(): Orientation {
    return OrientationState.getCurrentDeviceOrientation()
  }

  fun getCurrentOrientation(): Orientation {
    return OrientationState.getCurrentOrientation()
  }

  fun getIsLocked(): Boolean {
    return OrientationState.isLocked()
  }

  fun getLockedOrientation(): Orientation {
    return OrientationState.getLockedOrientation()
  }

  fun setDeviceOrientation(orientation: Orientation) {
    OrientationState.setDeviceOrientation(orientation)
  }

  fun lockToPortrait(direction: String?) {
    when (direction) {
      "UPSIDE_DOWN" -> {
        // Note: Android rarely supports upside-down orientation
        // Currently this type will just set Orientation to Portrait
        OrientationState.setState(Orientation.PORTRAIT, true)
      }
      else -> {
        setOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT)
        OrientationState.setState(Orientation.PORTRAIT, true)
      }
    }
  }

  fun lockToLandscape(direction: String) {
    when (direction) {
      LandscapeDirection.LEFT.value -> {
        setOrientation(ActivityInfo.SCREEN_ORIENTATION_REVERSE_LANDSCAPE)
        OrientationState.setState(Orientation.LANDSCAPE_LEFT, true)
      }
      LandscapeDirection.RIGHT.value -> {
        setOrientation(ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE)
        OrientationState.setState(Orientation.LANDSCAPE_RIGHT, true)
      }
      else -> {
        setOrientation(ActivityInfo.SCREEN_ORIENTATION_REVERSE_LANDSCAPE)
        OrientationState.setState(Orientation.LANDSCAPE_LEFT, true)
      }
    }
  }

  fun unlockAllOrientations() {
    setOrientation(ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED)
    OrientationState.setState(Orientation.PORTRAIT, false)
  }
}
