package com.orientationturbo

import com.orientationturbo.core.OrientationController
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
  private val orientationEventEmitter = OrientationEventEmitter(
    orientationManager,
    ::emitOnOrientationChange,
    ::emitOnLockOrientationChange,
  )
  private val onLockChange: () -> Unit = orientationEventEmitter::onLockOrientationChange

  init {
    OrientationSync.initializeSharedState(reactContext)
    OrientationController.onLockChange = onLockChange
  }

  override fun invalidate() {
    if (OrientationController.onLockChange === onLockChange) {
      OrientationController.onLockChange = null
    }
    super.invalidate()
  }

  override fun startOrientationTracking() {
    orientationTracker.startOrientationTracking(orientationEventEmitter::onOrientationChange)
  }

  override fun stopOrientationTracking() {
    orientationTracker.stopOrientationTracking()
  }

  override fun lockToPortrait(direction: String?) {
    orientationManager.lockToPortrait(direction)
  }

  override fun lockToLandscape(direction: String) {
    orientationManager.lockToLandscape(direction)
  }

  override fun unlockAllOrientations() {
    orientationManager.unlockAllOrientations()
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
