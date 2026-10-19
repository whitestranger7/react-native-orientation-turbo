package com.orientationturbo.core

import com.orientationturbo.enums.Orientation

import android.hardware.SensorManager
import android.os.Handler
import android.os.Looper
import android.view.OrientationEventListener
import com.facebook.react.bridge.ReactApplicationContext

/**
 * Tracks device orientation while JS asked for it and the app is in the foreground.
 * A new orientation is reported after readings remain in its zone for [SETTLE_DELAY_MS].
 * A dead-band or unknown reading cancels the candidate; re-entry starts a fresh interval.
 */
internal class OrientationTracker(
  private val currentDeviceOrientation: () -> Orientation,
  private val setDeviceOrientation: (Orientation) -> Unit,
  private val scheduler: Scheduler,
  private val naturalPortrait: () -> Boolean,
  private val createListener: ((Int) -> Unit) -> Listener,
) {
  constructor(reactContext: ReactApplicationContext, orientationManager: OrientationManager) : this(
    orientationManager::getCurrentDeviceOrientation,
    orientationManager::setDeviceOrientation,
    MainThreadScheduler(),
    { DisplayOrientation.isNaturalPortrait(reactContext, reactContext.currentActivity) },
    { onAngleChanged -> AndroidListener(reactContext, onAngleChanged) },
  )

  internal interface Scheduler {
    fun postDelayed(callback: Runnable, delayMillis: Long)
    fun removeCallbacks(callback: Runnable)
  }

  internal interface Listener {
    fun enable()
    fun disable()
  }

  private var orientationEventListener: Listener? = null
  private var emitOnChange: (() -> Unit)? = null
  private var isPaused = false
  private var pendingOrientation: Orientation? = null
  private var isNaturalPortrait = true
  private var pendingCommit: Runnable? = null

  @Synchronized
  fun startOrientationTracking(emitOnChange: () -> Unit) {
    if (orientationEventListener != null) return

    this.emitOnChange = emitOnChange
    isNaturalPortrait = naturalPortrait()
    orientationEventListener = createListener(::onAngleChanged)
    if (!isPaused) {
      orientationEventListener?.enable()
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
    orientationEventListener?.enable()
  }

  @Synchronized
  private fun onAngleChanged(angle: Int) {
    if (isPaused || orientationEventListener == null) return
    val candidate = OrientationAngles.zoneFor(angle, isNaturalPortrait)

    if (candidate == null || candidate == currentDeviceOrientation()) {
      cancelPendingOrientation()
      return
    }
    if (candidate != pendingOrientation) {
      cancelPendingOrientation()
      pendingOrientation = candidate
      val commit = object : Runnable {
        override fun run() = commitPendingOrientation(this)
      }
      pendingCommit = commit
      scheduler.postDelayed(commit, SETTLE_DELAY_MS)
    }
  }

  @Synchronized
  private fun commitPendingOrientation(callback: Runnable) {
    if (callback !== pendingCommit) return
    val newOrientation = pendingOrientation ?: return
    pendingOrientation = null
    pendingCommit = null

    if (newOrientation != currentDeviceOrientation()) {
      setDeviceOrientation(newOrientation)
      emitOnChange?.invoke()
    }
  }

  private fun cancelPendingOrientation() {
    pendingOrientation = null
    pendingCommit?.let(scheduler::removeCallbacks)
    pendingCommit = null
  }

  private class MainThreadScheduler : Scheduler {
    private val handler = Handler(Looper.getMainLooper())

    override fun postDelayed(callback: Runnable, delayMillis: Long) {
      handler.postDelayed(callback, delayMillis)
    }

    override fun removeCallbacks(callback: Runnable) {
      handler.removeCallbacks(callback)
    }
  }

  private class AndroidListener(context: ReactApplicationContext, onAngleChanged: (Int) -> Unit) : Listener {
    private val listener = object : OrientationEventListener(context, SensorManager.SENSOR_DELAY_NORMAL) {
      override fun onOrientationChanged(orientation: Int) = onAngleChanged(orientation)
    }

    override fun enable() {
      if (listener.canDetectOrientation()) {
        listener.enable()
      }
    }

    override fun disable() = listener.disable()
  }

  private companion object {
    const val SETTLE_DELAY_MS = 200L
  }
}
