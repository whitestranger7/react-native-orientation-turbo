package com.orientationturbo.core

import com.orientationturbo.enums.Orientation

import android.view.Surface
import org.junit.Assert.assertEquals
import org.junit.Test

class DisplayOrientationTest {

  // Same mapping as Android's DisplayRotation: ROTATION_90 = device turned counter-clockwise
  // (bottom edge on the right, SCREEN_ORIENTATION_LANDSCAPE), ROTATION_270 = turned clockwise.

  @Test
  fun naturalPortraitRotations() {
    val expected = mapOf(
      Surface.ROTATION_0 to Orientation.PORTRAIT,
      Surface.ROTATION_90 to Orientation.LANDSCAPE_RIGHT,
      Surface.ROTATION_180 to Orientation.PORTRAIT_UPSIDE_DOWN,
      Surface.ROTATION_270 to Orientation.LANDSCAPE_LEFT,
    )
    for ((rotation, orientation) in expected) {
      assertEquals("rotation $rotation", orientation, DisplayOrientation.orientationForRotation(rotation, isNaturalPortrait = true))
    }
  }

  @Test
  fun naturalLandscapeRotations() {
    val expected = mapOf(
      Surface.ROTATION_0 to Orientation.LANDSCAPE_RIGHT,
      Surface.ROTATION_90 to Orientation.PORTRAIT_UPSIDE_DOWN,
      Surface.ROTATION_180 to Orientation.LANDSCAPE_LEFT,
      Surface.ROTATION_270 to Orientation.PORTRAIT,
    )
    for ((rotation, orientation) in expected) {
      assertEquals("rotation $rotation", orientation, DisplayOrientation.orientationForRotation(rotation, isNaturalPortrait = false))
    }
  }

  @Test
  fun physicalDisplayModesKeepDisplayAndSensorOrientationsAligned() {
    // These are physical display modes, not the app's independently resizable bounds.
    for ((width, height, expected) in listOf(
      Triple(1080, 2400, Orientation.LANDSCAPE_RIGHT),
      Triple(2400, 1080, Orientation.PORTRAIT_UPSIDE_DOWN),
    )) {
      val naturalPortrait = DisplayOrientation.isNaturalPortrait(width, height)
      assertEquals(expected, DisplayOrientation.orientationForRotation(Surface.ROTATION_90, naturalPortrait))
      assertEquals(expected, OrientationAngles.zoneFor(270, naturalPortrait))
    }
  }

  @Test
  fun eventsAndDisplayAgree() {
    // A device turned clockwise reports angle 90; the system rotates the display to 270
    for (isNaturalPortrait in listOf(true, false)) {
      for ((angle, rotation) in listOf(0 to Surface.ROTATION_0, 90 to Surface.ROTATION_270, 180 to Surface.ROTATION_180, 270 to Surface.ROTATION_90)) {
        assertEquals(
          "angle $angle, natural portrait $isNaturalPortrait",
          DisplayOrientation.orientationForRotation(rotation, isNaturalPortrait),
          OrientationAngles.zoneFor(angle, isNaturalPortrait),
        )
      }
    }
  }
}
