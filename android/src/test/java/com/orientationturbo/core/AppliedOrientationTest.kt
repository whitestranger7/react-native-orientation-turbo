package com.orientationturbo.core

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class AppliedOrientationTest {
  private val activity = Any()
  private val recreatedActivity = Any()

  @Test
  fun nothingIsAppliedInitially() {
    assertFalse(AppliedOrientation().isApplied(activity, PORTRAIT))
  }

  @Test
  fun sameActivityAndOrientationIsApplied() {
    val applied = AppliedOrientation()
    applied.record(activity, PORTRAIT)
    assertTrue(applied.isApplied(activity, PORTRAIT))
  }

  @Test
  fun newerRequestOrRecreatedActivityIsNotApplied() {
    val applied = AppliedOrientation()
    applied.record(activity, PORTRAIT)
    assertFalse(applied.isApplied(activity, LANDSCAPE))
    assertFalse(applied.isApplied(recreatedActivity, PORTRAIT))
  }

  @Test
  fun clearedAfterAFailedApplication() {
    val applied = AppliedOrientation()
    applied.record(activity, PORTRAIT)
    applied.clear()
    assertFalse(applied.isApplied(activity, PORTRAIT))
  }

  private companion object {
    const val PORTRAIT = 1 // ActivityInfo.SCREEN_ORIENTATION_PORTRAIT
    const val LANDSCAPE = 0 // ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE
  }
}
