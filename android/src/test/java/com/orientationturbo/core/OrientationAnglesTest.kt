package com.orientationturbo.core

import com.orientationturbo.enums.Orientation

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class OrientationAnglesTest {

  // Natural-portrait device (phone): the angle grows as the device turns clockwise

  @Test
  fun phoneUprightIsPortrait() {
    for (angle in listOf(0, 15, 30, 330, 345, 359)) {
      assertEquals("angle $angle", Orientation.PORTRAIT, OrientationAngles.zoneFor(angle, isNaturalPortrait = true))
    }
  }

  @Test
  fun phoneTurnedClockwiseIsLandscapeLeft() {
    // Turned clockwise = bottom edge on the left = LANDSCAPE_LEFT (same as a LEFT lock)
    for (angle in listOf(60, 90, 120)) {
      assertEquals("angle $angle", Orientation.LANDSCAPE_LEFT, OrientationAngles.zoneFor(angle, isNaturalPortrait = true))
    }
  }

  @Test
  fun phoneTurnedCounterClockwiseIsLandscapeRight() {
    for (angle in listOf(240, 270, 300)) {
      assertEquals("angle $angle", Orientation.LANDSCAPE_RIGHT, OrientationAngles.zoneFor(angle, isNaturalPortrait = true))
    }
  }

  @Test
  fun phoneUpsideDownIsPortraitUpsideDown() {
    for (angle in listOf(150, 180, 210)) {
      assertEquals("angle $angle", Orientation.PORTRAIT_UPSIDE_DOWN, OrientationAngles.zoneFor(angle, isNaturalPortrait = true))
    }
  }

  @Test
  fun anglesBetweenZonesDontCount() {
    for (angle in listOf(31, 45, 59, 121, 135, 149, 211, 225, 239, 301, 315, 329)) {
      assertNull("angle $angle", OrientationAngles.zoneFor(angle, isNaturalPortrait = true))
    }
  }

  @Test
  fun unknownAngleIsIgnored() {
    assertNull(OrientationAngles.zoneFor(-1, isNaturalPortrait = true))
  }

  @Test
  fun everyAngleMapsToAtMostOneZoneWithDeadBandsInBetween() {
    val zones = (0 until 360).map { OrientationAngles.zoneFor(it, isNaturalPortrait = true) }
    assertEquals(61 * 4, zones.count { it != null })
    assertEquals(29 * 4, zones.count { it == null })
  }

  // Natural-landscape device (most tablets)

  @Test
  fun tabletUprightIsLandscapeRight() {
    assertEquals(Orientation.LANDSCAPE_RIGHT, OrientationAngles.zoneFor(0, isNaturalPortrait = false))
  }

  @Test
  fun tabletTurnedClockwiseIsPortrait() {
    assertEquals(Orientation.PORTRAIT, OrientationAngles.zoneFor(90, isNaturalPortrait = false))
  }

  @Test
  fun tabletTurnedCounterClockwiseIsPortraitUpsideDown() {
    assertEquals(Orientation.PORTRAIT_UPSIDE_DOWN, OrientationAngles.zoneFor(270, isNaturalPortrait = false))
  }

  @Test
  fun tabletUpsideDownIsLandscapeLeft() {
    assertEquals(Orientation.LANDSCAPE_LEFT, OrientationAngles.zoneFor(180, isNaturalPortrait = false))
  }
}
