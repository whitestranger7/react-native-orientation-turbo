package com.orientationturbo.core

import java.lang.ref.WeakReference

internal class AppliedOrientation {
  private var target: WeakReference<Any>? = null
  private var requestedOrientation = 0

  fun record(target: Any, requestedOrientation: Int) {
    this.target = WeakReference(target)
    this.requestedOrientation = requestedOrientation
  }

  fun clear() {
    target = null
  }

  /** True if the library already set [requestedOrientation] on [target], even if other code changed it since */
  fun isApplied(target: Any, requestedOrientation: Int): Boolean {
    return this.target?.get() === target && this.requestedOrientation == requestedOrientation
  }
}
