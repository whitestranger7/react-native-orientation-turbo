package com.orientationturbo.core

import com.orientationturbo.enums.Orientation

import android.hardware.SensorManager
import android.os.Handler
import android.os.Looper
import android.view.OrientationEventListener
import com.facebook.react.bridge.ReactApplicationContext

/**
 * Tracks device orientation while JS asked for it and the app is in the foreground.
 * A new orientation is only reported after it stayed stable for [SETTLE_DELAY_MS].
 */
internal class OrientationTracker(
  private val reactContext: ReactApplicationContext,
  private val orientationManager: OrientationManager,
) {
  private val handler = Handler(Looper.getMainLooper())
  private var orientationEventListener: OrientationEventListener? = null
  private var emitOnChange: (() -> Unit)? = null
  private var isPaused = false
  private var pendingOrientation: Orientation? = null
  private val commitPendingOrientation = Runnable { commitPendingOrientation() }

  @Synchronized
  fun startOrientationTracking(emitOnChange: () -> Unit) {
    if (orientationEventListener != null) return

    this.emitOnChange = emitOnChange
    orientationEventListener = createOrientationListener()
    if (!isPaused) {
      enableListener()
    }
  }

  @Synchronized
  fun stopOrientationTracking() {
    orientationEventListener?.disable()
    orientationEventListener = null
    emitOnChange = null
    cancelPendingOrientation()
  }

  /** App went to the background: stop reading the sensor */
  @Synchronized
  fun pause() {
    isPaused = true
    orientationEventListener?.disable()
    cancelPendingOrientation()
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

  @Synchronized
  private fun onAngleChanged(angle: Int) {
    val candidate = OrientationAngles.zoneFor(angle) ?: return

    if (candidate == orientationManager.getCurrentDeviceOrientation()) {
      cancelPendingOrientation()
      return
    }
    if (candidate != pendingOrientation) {
      pendingOrientation = candidate
      handler.removeCallbacks(commitPendingOrientation)
      handler.postDelayed(commitPendingOrientation, SETTLE_DELAY_MS)
    }
  }

  @Synchronized
  private fun commitPendingOrientation() {
    val newOrientation = pendingOrientation ?: return
    pendingOrientation = null

    if (newOrientation != orientationManager.getCurrentDeviceOrientation()) {
      orientationManager.setDeviceOrientation(newOrientation)
      emitOnChange?.invoke()
    }
  }

  private fun cancelPendingOrientation() {
    pendingOrientation = null
    handler.removeCallbacks(commitPendingOrientation)
  }

  private fun createOrientationListener(): OrientationEventListener {
    return object : OrientationEventListener(reactContext, SensorManager.SENSOR_DELAY_NORMAL) {
      override fun onOrientationChanged(orientation: Int) {
        onAngleChanged(orientation)
      }
    }
  }

  private companion object {
    const val SETTLE_DELAY_MS = 200L
  }
}
