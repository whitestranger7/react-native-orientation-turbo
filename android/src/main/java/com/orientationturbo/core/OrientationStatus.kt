package com.orientationturbo.core

import android.hardware.SensorManager
import android.provider.Settings
import android.view.OrientationEventListener
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.WritableMap

class OrientationStatus(private val reactContext: ReactApplicationContext) {
  fun getDeviceAutoRotateStatus(): WritableMap {
    val result = Arguments.createMap()

    val isAutoRotateEnabled = try {
      Settings.System.getInt(
        reactContext.contentResolver,
        Settings.System.ACCELEROMETER_ROTATION,
        0
      ) == 1
    } catch (e: Exception) {
      true
    }

    val canDetectOrientation = try {
      val testListener = object : OrientationEventListener(reactContext, SensorManager.SENSOR_DELAY_NORMAL) {
        override fun onOrientationChanged(orientation: Int) {}
      }
      val canDetect = testListener.canDetectOrientation()
      testListener.disable()
      canDetect
    } catch (e: Exception) {
      false
    }

    result.putBoolean("isAutoRotateEnabled", isAutoRotateEnabled)
    result.putBoolean("canDetectOrientation", canDetectOrientation)

    return result
  }
}
