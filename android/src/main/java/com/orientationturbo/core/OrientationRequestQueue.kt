package com.orientationturbo.core

import com.orientationturbo.enums.Orientation
import java.util.ArrayDeque

/** Records requested state synchronously; applies requests and emits their payloads in order on UI. */
internal class OrientationRequestQueue(
  private val setLockedOrientation: (Orientation?) -> Unit,
  private val runOnUiThread: (() -> Unit) -> Unit,
  private val onLockChange: (Orientation?) -> Unit,
  private val onApplyError: (RuntimeException) -> Unit = {},
) {
  private data class Request(
    val orientation: Orientation?,
    val apply: () -> Unit,
    val generation: Long,
    val emitEvent: Boolean = true,
    val hasPendingApplication: Boolean = emitEvent,
  )

  private val lock = Any()
  private val requests = ArrayDeque<Request>()
  private var isDraining = false
  private var hasExplicitRequest = false
  private var hasManifestDefault = false
  private var latestOrientation: Orientation? = null
  private var applicationGeneration = 0L

  fun submit(orientation: Orientation?, apply: () -> Unit) {
    synchronized(lock) {
      setLockedOrientation(orientation)
      hasExplicitRequest = true
      latestOrientation = orientation
      requests.addLast(Request(orientation, apply, applicationGeneration))
    }
    runOnUiThread(::drain)
  }

  fun initializeFromManifest(orientation: Orientation?) {
    synchronized(lock) {
      if (hasExplicitRequest || hasManifestDefault) return
      setLockedOrientation(orientation)
      hasManifestDefault = true
    }
  }

  /** On attachment/recreation only the latest request needs applying; keep queued events in order. */
  fun replayLatest(apply: (Orientation?, Boolean) -> Unit) {
    synchronized(lock) {
      if (!hasExplicitRequest) return
      val hasPendingApplication = requests.any { it.hasPendingApplication && it.generation == applicationGeneration }
      applicationGeneration++
      val orientation = latestOrientation
      requests.addLast(Request(
        orientation,
        { apply(orientation, hasPendingApplication) },
        applicationGeneration,
        emitEvent = false,
        hasPendingApplication = hasPendingApplication,
      ))
    }
    runOnUiThread(::drain)
  }

  private fun drain() {
    synchronized(lock) {
      if (isDraining) return
      isDraining = true
    }
    try {
      while (true) {
        val (request, shouldApply) = synchronized(lock) {
          val next = requests.pollFirst() ?: return
          next to (next.generation == applicationGeneration)
        }
        if (shouldApply) {
          try {
            request.apply()
          } catch (error: RuntimeException) {
            onApplyError(error)
          }
        }
        if (request.emitEvent) onLockChange(request.orientation)
      }
    } finally {
      synchronized(lock) { isDraining = false }
    }
  }
}
