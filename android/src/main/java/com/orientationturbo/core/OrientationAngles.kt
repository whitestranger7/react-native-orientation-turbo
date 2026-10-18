package com.orientationturbo.core

import com.orientationturbo.enums.Orientation

import android.view.OrientationEventListener

internal object OrientationAngles {
  /** Maximum distance from a centre (0°, 90°, 180°, 270°) for an angle to count */
  const val ZONE_HALF_WIDTH_DEGREES = 30

  /** The orientation the angle clearly points to, or `null` if it's between orientations or unknown (device flat) */
  fun zoneFor(angle: Int): Orientation? {
    if (angle == OrientationEventListener.ORIENTATION_UNKNOWN) return null

    val normalized = ((angle % 360) + 360) % 360
    val nearestCenter = ((normalized + 45) / 90 % 4) * 90
    val distance = minOf(Math.abs(normalized - nearestCenter), 360 - Math.abs(normalized - nearestCenter))
    if (distance > ZONE_HALF_WIDTH_DEGREES) return null

    return when (nearestCenter) {
      0 -> Orientation.PORTRAIT
      90 -> Orientation.LANDSCAPE_RIGHT
      180 -> Orientation.PORTRAIT_UPSIDE_DOWN
      else -> Orientation.LANDSCAPE_LEFT
    }
  }
}
