package com.orientationturbo.core

import com.orientationturbo.enums.Orientation
import com.orientationturbo.constants.AngleRanges

import android.hardware.SensorManager
import android.view.OrientationEventListener
import com.facebook.react.bridge.ReactApplicationContext

/**
 * Tracks device orientation while JS asked for it and the app is in the foreground
 */
internal class OrientationTracker(
  private val reactContext: ReactApplicationContext,
  private val orientationManager: OrientationManager,
) {
  private var orientationEventListener: OrientationEventListener? = null
  private var isPaused = false

  @Synchronized
  fun startOrientationTracking(emitOnChange: () -> Unit) {
    if (orientationEventListener != null) return

    orientationEventListener = createOrientationListener(emitOnChange)
    if (!isPaused) {
      enableListener()
    }
  }

  @Synchronized
  fun stopOrientationTracking() {
    orientationEventListener?.disable()
    orientationEventListener = null
  }

  /** App went to the background: stop reading the sensor */
  @Synchronized
  fun pause() {
    isPaused = true
    orientationEventListener?.disable()
  }

  /** App is in the foreground again: resume if tracking was started */
  @Synchronized
  fun resume() {
    isPaused = false
    enableListener()
  }

  private fun enableListener() {
    val listener = orientationEventListener ?: return
    if (listener.canDetectOrientation()) {
      listener.enable()
    }
  }

  private fun createOrientationListener(emitOnChange: () -> Unit): OrientationEventListener {
    return object : OrientationEventListener(reactContext, SensorManager.SENSOR_DELAY_NORMAL) {
      override fun onOrientationChanged(orientation: Int) {
        if (orientation == ORIENTATION_UNKNOWN) return

        val newDeviceOrientation = when (orientation) {
          in AngleRanges.PORTRAIT_PRIMARY_START..AngleRanges.PORTRAIT_PRIMARY_END,
          in AngleRanges.PORTRAIT_SECONDARY_START..AngleRanges.PORTRAIT_SECONDARY_END -> Orientation.PORTRAIT

          in AngleRanges.LANDSCAPE_RIGHT_START..AngleRanges.LANDSCAPE_RIGHT_END -> Orientation.LANDSCAPE_RIGHT
          in AngleRanges.PORTRAIT_INVERTED_START..AngleRanges.PORTRAIT_INVERTED_END -> Orientation.PORTRAIT_UPSIDE_DOWN
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
  }
}
