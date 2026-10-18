package com.orientationturbo.core

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorManager
import android.provider.Settings
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.WritableMap

internal class OrientationStatus(private val reactContext: ReactApplicationContext) {
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

    // Same check as OrientationEventListener.canDetectOrientation()
    val canDetectOrientation = try {
      val sensorManager = reactContext.getSystemService(Context.SENSOR_SERVICE) as? SensorManager
      sensorManager?.getDefaultSensor(Sensor.TYPE_ACCELEROMETER) != null
    } catch (e: Exception) {
      false
    }

    result.putBoolean("isAutoRotateEnabled", isAutoRotateEnabled)
    result.putBoolean("canDetectOrientation", canDetectOrientation)

    return result
  }
}
