package com.orientationturbo

import android.content.pm.ActivityInfo
import android.hardware.SensorManager
import android.view.OrientationEventListener
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

  private var currentLockedOrientation: Orientation = Orientation.PORTRAIT
  private var currentDeviceOrientation: Orientation = Orientation.PORTRAIT
  private var isOrientationLocked: Boolean = false
  private var orientationEventListener: OrientationEventListener? = null
  private var isOrientationTrackingEnabled = false


  private fun emitOnOrientationChange() {
    val eventData = Arguments.createMap().apply {
      putString("orientation", currentDeviceOrientation.value)
    }
    emitOnOrientationChange(eventData)
  }

  private fun emitOnLockOrientationChange() {
    val eventData = Arguments.createMap().apply {
      if (isOrientationLocked) {
        putString("orientation", currentLockedOrientation.value)
      } else {
        putNull("orientation")
      }
      putBoolean("isLocked", isOrientationLocked)
    }
    emitOnLockOrientationChange(eventData)
  }

  private fun setupOrientationListener() {
    orientationEventListener = object : OrientationEventListener(reactContext, SensorManager.SENSOR_DELAY_NORMAL) {
      override fun onOrientationChanged(orientation: Int) {
        if (orientation == ORIENTATION_UNKNOWN) return

        val newDeviceOrientation = when (orientation) {
          in 0..44, in 315..359 -> Orientation.PORTRAIT
          in 45..134 -> Orientation.LANDSCAPE_RIGHT
          in 135..224 -> Orientation.PORTRAIT
          in 225..314 -> Orientation.LANDSCAPE_LEFT
          else -> return
        }

        if (newDeviceOrientation != currentDeviceOrientation) {
          currentDeviceOrientation = newDeviceOrientation
          emitOnOrientationChange()
        }
      }
    }

    if (orientationEventListener?.canDetectOrientation() == true) {
      orientationEventListener?.enable()
    }
  }

  private fun stopOrientationListener() {
    orientationEventListener?.disable()
    orientationEventListener = null
  }

  private fun setOrientation(orientation: Int) {
    UiThreadUtil.runOnUiThread {
      val activity = reactContext.currentActivity
      activity?.requestedOrientation = orientation
    }
  }

  override fun startOrientationTracking() {
    if (!isOrientationTrackingEnabled) {
      setupOrientationListener()
      isOrientationTrackingEnabled = true
    }
  }

  override fun stopOrientationTracking() {
    if (isOrientationTrackingEnabled) {
      stopOrientationListener()
      isOrientationTrackingEnabled = false
    }
  }

  override fun lockToPortrait() {
    setOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT)
    currentLockedOrientation = Orientation.PORTRAIT
    isOrientationLocked = true
    emitOnLockOrientationChange()
  }

  override fun lockToLandscape(direction: String) {
    when (direction) {
      LandscapeDirection.LEFT.value -> {
        setOrientation(ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE)
        currentLockedOrientation = Orientation.LANDSCAPE_LEFT
      }
      LandscapeDirection.RIGHT.value -> {
        setOrientation(ActivityInfo.SCREEN_ORIENTATION_REVERSE_LANDSCAPE)
        currentLockedOrientation = Orientation.LANDSCAPE_RIGHT
      }
      else -> {
        setOrientation(ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE)
        currentLockedOrientation = Orientation.LANDSCAPE_LEFT
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
    return currentLockedOrientation.value
  }

  override fun isLocked(): Boolean {
    return isOrientationLocked
  }

  companion object {
    const val NAME = "OrientationTurbo"
  }
}
