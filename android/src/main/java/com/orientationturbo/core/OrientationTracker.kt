package com.orientationturbo.core

import com.orientationturbo.enums.Orientation
import com.orientationturbo.constants.AngleRanges

import android.hardware.SensorManager
import android.view.OrientationEventListener
import com.facebook.react.bridge.ReactApplicationContext

internal class OrientationTracker(
  private val reactContext: ReactApplicationContext,
  private val orientationManager: OrientationManager,
) {
  private var orientationEventListener: OrientationEventListener? = null
  private var isOrientationTrackingEnabled = false

  private fun setupOrientationListener(emitOnChange: () -> Unit) {
    orientationEventListener =
      object : OrientationEventListener(reactContext, SensorManager.SENSOR_DELAY_NORMAL) {
        override fun onOrientationChanged(orientation: Int) {
          if (orientation == ORIENTATION_UNKNOWN) return

          val newDeviceOrientation = when (orientation) {
            in AngleRanges.PORTRAIT_PRIMARY_START..AngleRanges.PORTRAIT_PRIMARY_END,
            in AngleRanges.PORTRAIT_SECONDARY_START..AngleRanges.PORTRAIT_SECONDARY_END -> Orientation.PORTRAIT

            in AngleRanges.LANDSCAPE_RIGHT_START..AngleRanges.LANDSCAPE_RIGHT_END -> Orientation.LANDSCAPE_RIGHT
            in AngleRanges.PORTRAIT_INVERTED_START..AngleRanges.PORTRAIT_INVERTED_END -> Orientation.PORTRAIT
            in AngleRanges.LANDSCAPE_LEFT_START..AngleRanges.LANDSCAPE_LEFT_END -> Orientation.LANDSCAPE_LEFT
            else -> return
          }

          val currentDeviceOrientation = orientationManager.getCurrentDeviceOrientation()
          if (newDeviceOrientation != currentDeviceOrientation) {
            orientationManager.setDeviceOrientation(newDeviceOrientation)
            emitOnChange()
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

  fun startOrientationTracking(emitOnChange: () -> Unit) {
    if (!isOrientationTrackingEnabled) {
      setupOrientationListener(emitOnChange)
      isOrientationTrackingEnabled = true
    }
  }

  fun stopOrientationTracking() {
    if (isOrientationTrackingEnabled) {
      stopOrientationListener()
      isOrientationTrackingEnabled = false
    }
  }
}
