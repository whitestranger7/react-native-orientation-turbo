package com.orientationturbo.core

import com.orientationturbo.enums.LandscapeDirection
import com.orientationturbo.enums.Orientation
import com.orientationturbo.enums.PortraitDirection

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class OrientationControllerTest {

  @Test
  fun portraitDirections() {
    assertEquals(Orientation.PORTRAIT, OrientationController.portraitOrientation(null as String?))
    assertEquals(Orientation.PORTRAIT, OrientationController.portraitOrientation("UP"))
    assertEquals(Orientation.PORTRAIT_UPSIDE_DOWN, OrientationController.portraitOrientation("UPSIDE_DOWN"))
    assertEquals(Orientation.PORTRAIT, OrientationController.portraitOrientation(PortraitDirection.UP))
    assertEquals(Orientation.PORTRAIT_UPSIDE_DOWN, OrientationController.portraitOrientation(PortraitDirection.UPSIDE_DOWN))
  }

  @Test
  fun landscapeDirections() {
    assertEquals(Orientation.LANDSCAPE_LEFT, OrientationController.landscapeOrientation("LEFT"))
    assertEquals(Orientation.LANDSCAPE_RIGHT, OrientationController.landscapeOrientation("RIGHT"))
    assertEquals(Orientation.LANDSCAPE_LEFT, OrientationController.landscapeOrientation(LandscapeDirection.LEFT))
    assertEquals(Orientation.LANDSCAPE_RIGHT, OrientationController.landscapeOrientation(LandscapeDirection.RIGHT))
  }

  @Test
  fun invalidDirectionsAreRejected() {
    for (direction in listOf("", "up", "DOWN", "SIDEWAYS", "LANDSCAPE_LEFT")) {
      assertNull("portrait $direction", OrientationController.portraitOrientation(direction))
    }
    for (direction in listOf(null, "", "left", "UP", "UPSIDE_DOWN")) {
      assertNull("landscape $direction", OrientationController.landscapeOrientation(direction))
    }
  }
}
