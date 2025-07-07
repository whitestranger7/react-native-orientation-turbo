package com.orientationturbo

import android.content.pm.ActivityInfo
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.module.annotations.ReactModule
import com.orientationturbo.enums.LandscapeDirection
import com.orientationturbo.enums.Orientation

@ReactModule(name = OrientationTurboModule.NAME)
class OrientationTurboModule(private val reactContext: ReactApplicationContext) :
  NativeOrientationTurboSpec(reactContext) {

  override fun getName(): String {
    return NAME
  }

  private var currentOrientation: Orientation = Orientation.PORTRAIT
  private var isOrientationLocked: Boolean = false

  private fun emitOnLockOrientationChange() {
    val eventData = Arguments.createMap().apply {
      putString("orientation", currentOrientation.value)
      putBoolean("isLocked", isOrientationLocked)
    }
    emitOnLockOrientationChange(eventData)
  }

  private fun setOrientation(orientation: Int) {
    UiThreadUtil.runOnUiThread {
      val activity = reactContext.currentActivity
      activity?.requestedOrientation = orientation
    }
  }

  override fun lockToPortrait() {
    setOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT)
    currentOrientation = Orientation.PORTRAIT
    isOrientationLocked = true
    emitOnLockOrientationChange()
  }

  override fun lockToLandscape(direction: String) {
    when (direction) {
      LandscapeDirection.LEFT.value -> {
        setOrientation(ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE)
        currentOrientation = Orientation.LANDSCAPE_LEFT
      }
      LandscapeDirection.RIGHT.value -> {
        setOrientation(ActivityInfo.SCREEN_ORIENTATION_REVERSE_LANDSCAPE)
        currentOrientation = Orientation.LANDSCAPE_RIGHT
      }
      else -> {
        setOrientation(ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE)
        currentOrientation = Orientation.LANDSCAPE_LEFT
      }
    }
    isOrientationLocked = true
    emitOnLockOrientationChange()
  }

  override fun unlockAllOrientations() {
    setOrientation(ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED)
    isOrientationLocked = false
    emitOnLockOrientationChange()
  }

  override fun getCurrentOrientation(): String {
    return currentOrientation.value
  }

  override fun isLocked(): Boolean {
    return isOrientationLocked
  }

  companion object {
    const val NAME = "OrientationTurbo"
  }
}
