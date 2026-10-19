package com.orientationturbo.core

import com.orientationturbo.enums.Orientation
import java.util.ArrayDeque

/** Records requested state synchronously; applies requests and emits their payloads in order on UI. */
internal class OrientationRequestQueue(
  private val setLockedOrientation: (Orientation?) -> Unit,
  private val runOnUiThread: (() -> Unit) -> Unit,
  private val onLockChange: (Orientation?) -> Unit,
) {
  private data class Request(val orientation: Orientation?, val apply: () -> Unit)

  private val lock = Any()
  private val requests = ArrayDeque<Request>()
  private var isDraining = false

  fun submit(orientation: Orientation?, apply: () -> Unit) {
    synchronized(lock) {
      setLockedOrientation(orientation)
      requests.addLast(Request(orientation, apply))
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
        val request = synchronized(lock) { requests.pollFirst() } ?: return
        request.apply()
        onLockChange(request.orientation)
      }
    } finally {
      synchronized(lock) { isDraining = false }
    }
  }
}
