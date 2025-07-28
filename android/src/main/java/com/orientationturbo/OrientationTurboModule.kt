package com.orientationturbo

import com.orientationturbo.core.OrientationManager
import com.orientationturbo.core.OrientationTracker
import com.orientationturbo.core.OrientationStatus
import com.orientationturbo.events.OrientationEventEmitter
import com.orientationturbo.utils.OrientationSync

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.module.annotations.ReactModule

@ReactModule(name = OrientationTurboModule.NAME)
class OrientationTurboModule(private val reactContext: ReactApplicationContext) :
  NativeOrientationTurboSpec(reactContext) {

  override fun getName(): String {
    return NAME
  }

  private val orientationManager = OrientationManager(reactContext)

  private val orientationStatus = OrientationStatus(reactContext)
  private val orientationTracker = OrientationTracker(reactContext, orientationManager)
  private val orientationEvenEmitter = OrientationEventEmitter(
    orientationManager,
    ::emitOnOrientationChange,
    ::emitOnLockOrientationChange,
  )

  init {
    OrientationSync.initializeSharedState(reactContext)
  }

  override fun startOrientationTracking() {
    orientationTracker.startOrientationTracking(orientationEvenEmitter::onOrientationChange)
  }

  override fun stopOrientationTracking() {
    orientationTracker.stopOrientationTracking()
  }

  override fun lockToPortrait(direction: String?) {
    orientationManager.lockToPortrait(direction)
    orientationEvenEmitter.onLockOrientationChange()
  }

  override fun lockToLandscape(direction: String) {
    orientationManager.lockToLandscape(direction)
    orientationEvenEmitter.onLockOrientationChange()
  }

  override fun unlockAllOrientations() {
    orientationManager.unlockAllOrientations()
    orientationEvenEmitter.onLockOrientationChange()
  }

  override fun getCurrentOrientation(): String {
    return orientationManager.getCurrentOrientation().value
  }

  override fun isLocked(): Boolean {
    return orientationManager.getIsLocked()
  }

  override fun getDeviceAutoRotateStatus(): WritableMap {
    return orientationStatus.getDeviceAutoRotateStatus()
  }

  companion object {
    const val NAME = "OrientationTurbo"
  }
}
