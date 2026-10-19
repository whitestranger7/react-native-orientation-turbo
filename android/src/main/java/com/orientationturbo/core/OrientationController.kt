package com.orientationturbo.core

import com.orientationturbo.OrientationState
import com.orientationturbo.enums.LandscapeDirection
import com.orientationturbo.enums.Orientation
import com.orientationturbo.enums.PortraitDirection

import android.app.Activity
import android.content.pm.ActivityInfo
import android.util.Log
import com.facebook.react.bridge.UiThreadUtil
import java.lang.ref.WeakReference

/**
 * Applies orientation locks; shared by the React Native module and the native OrientationTurbo API
 */
internal object OrientationController {
  private const val TAG = "OrientationTurbo"

  /** Called after every lock change, whether it comes from JS or from native code */
  @Volatile
  var onLockChange: ((Orientation?) -> Unit)? = null

  @Volatile
  private var currentActivity: (() -> Activity?)? = null

  @Synchronized
  fun attachActivityProvider(provider: () -> Activity?) {
    currentActivity = provider
  }

  @Synchronized
  fun detachActivityProvider(provider: () -> Activity?) {
    if (currentActivity === provider) currentActivity = null
  }

  private val requests = OrientationRequestQueue(
    OrientationState::setLockedOrientation,
    { task ->
      if (UiThreadUtil.isOnUiThread()) task() else UiThreadUtil.runOnUiThread { task() }
    },
    { orientation -> onLockChange?.invoke(orientation) },
    { error ->
      applied.clear()
      Log.w(TAG, "Couldn't apply the orientation request", error)
    },
  )

  fun lock(activity: Activity?, orientation: Orientation) {
    lock(activityProvider(activity), orientation)
  }

  fun lock(activity: () -> Activity?, orientation: Orientation) {
    requests.submit(orientation) {
      setRequestedOrientation(activity(), orientation.toActivityInfoOrientation())
    }
  }

  fun unlock(activity: Activity?) {
    unlock(activityProvider(activity))
  }

  fun unlock(activity: () -> Activity?) {
    requests.submit(null) {
      setRequestedOrientation(activity(), ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED)
    }
  }

  fun initializeFromManifest(orientation: Orientation?) = requests.initializeFromManifest(orientation)

  /** Main thread only, like every apply: written and read while the request queue drains */
  private val applied = AppliedOrientation()

  fun onActivityAvailable(activity: () -> Activity?) {
    requests.replayLatest { orientation, hasPendingApplication ->
      val target = activity()
      val requestedOrientation = orientation?.toActivityInfoOrientation() ?: ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED
      // Already applied to this Activity: keep changes other code made since (e.g. a video player going fullscreen)
      if (!hasPendingApplication && (target == null || applied.isApplied(target, requestedOrientation))) return@replayLatest
      setRequestedOrientation(target, requestedOrientation)
    }
  }

  private fun activityProvider(activity: Activity?): () -> Activity? {
    val reference = WeakReference(activity)
    return {
      reference.get()?.takeUnless { it.isDestroyed || it.isFinishing } ?: currentActivity?.invoke()
    }
  }

  /** `null` for an invalid direction */
  fun portraitOrientation(direction: String?): Orientation? {
    return when (direction) {
      null, PortraitDirection.UP.value -> Orientation.PORTRAIT
      PortraitDirection.UPSIDE_DOWN.value -> Orientation.PORTRAIT_UPSIDE_DOWN
      else -> null
    }
  }

  fun portraitOrientation(direction: PortraitDirection): Orientation {
    return when (direction) {
      PortraitDirection.UP -> Orientation.PORTRAIT
      PortraitDirection.UPSIDE_DOWN -> Orientation.PORTRAIT_UPSIDE_DOWN
    }
  }

  /** `null` for an invalid direction */
  fun landscapeOrientation(direction: String?): Orientation? {
    return when (direction) {
      LandscapeDirection.LEFT.value -> Orientation.LANDSCAPE_LEFT
      LandscapeDirection.RIGHT.value -> Orientation.LANDSCAPE_RIGHT
      else -> null
    }
  }

  fun landscapeOrientation(direction: LandscapeDirection): Orientation {
    return when (direction) {
      LandscapeDirection.LEFT -> Orientation.LANDSCAPE_LEFT
      LandscapeDirection.RIGHT -> Orientation.LANDSCAPE_RIGHT
    }
  }

  private fun setRequestedOrientation(activity: Activity?, requestedOrientation: Int) {
    if (activity == null || activity.isDestroyed || activity.isFinishing) {
      Log.w(TAG, "No usable activity; the latest orientation request will be retried on resume")
      applied.clear()
      return
    }

    try {
      if (activity.requestedOrientation != requestedOrientation) {
        activity.requestedOrientation = requestedOrientation
      }
      applied.record(activity, requestedOrientation)
    } catch (e: RuntimeException) {
      // Android 8.0 throws for translucent activities: "Only fullscreen opaque activities can request orientation"
      Log.w(TAG, "Couldn't set the requested orientation", e)
      applied.clear()
    }
  }

  private fun Orientation.toActivityInfoOrientation(): Int {
    return when (this) {
      Orientation.PORTRAIT -> ActivityInfo.SCREEN_ORIENTATION_PORTRAIT
      Orientation.PORTRAIT_UPSIDE_DOWN -> ActivityInfo.SCREEN_ORIENTATION_REVERSE_PORTRAIT
      Orientation.LANDSCAPE_LEFT -> ActivityInfo.SCREEN_ORIENTATION_REVERSE_LANDSCAPE
      Orientation.LANDSCAPE_RIGHT -> ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE
    }
  }
}
