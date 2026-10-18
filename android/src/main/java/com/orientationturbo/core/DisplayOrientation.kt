package com.orientationturbo.core

import com.orientationturbo.enums.Orientation

import android.app.Activity
import android.content.Context
import android.content.res.Configuration
import android.os.Build
import android.view.Display
import android.view.Surface
import android.view.WindowManager

/**
 * Converts display rotations to orientations, with LANDSCAPE_LEFT = bottom edge on the left
 * (SCREEN_ORIENTATION_REVERSE_LANDSCAPE) and LANDSCAPE_RIGHT = bottom edge on the right (SCREEN_ORIENTATION_LANDSCAPE).
 * Rotations are relative to the device's natural orientation, which is landscape on most tablets.
 */
internal object DisplayOrientation {

  /** Same mapping as Android's DisplayRotation for natural-portrait and natural-landscape devices */
  fun orientationForRotation(rotation: Int, isNaturalPortrait: Boolean): Orientation {
    return if (isNaturalPortrait) {
      when (rotation) {
        Surface.ROTATION_0 -> Orientation.PORTRAIT
        Surface.ROTATION_90 -> Orientation.LANDSCAPE_RIGHT
        Surface.ROTATION_180 -> Orientation.PORTRAIT_UPSIDE_DOWN
        else -> Orientation.LANDSCAPE_LEFT
      }
    } else {
      when (rotation) {
        Surface.ROTATION_0 -> Orientation.LANDSCAPE_RIGHT
        Surface.ROTATION_90 -> Orientation.PORTRAIT_UPSIDE_DOWN
        Surface.ROTATION_180 -> Orientation.LANDSCAPE_LEFT
        else -> Orientation.PORTRAIT
      }
    }
  }

  /** What the screen currently shows, or `null` if there's no display to read */
  fun currentOrientation(context: Context, activity: Activity?): Orientation? {
    val visualContext = activity ?: context
    val rotation = displayOf(visualContext)?.rotation ?: return null
    return orientationForRotation(rotation, isNaturalPortrait(visualContext, rotation))
  }

  fun isNaturalPortrait(context: Context, activity: Activity?): Boolean {
    val visualContext = activity ?: context
    val rotation = displayOf(visualContext)?.rotation ?: Surface.ROTATION_0
    return isNaturalPortrait(visualContext, rotation)
  }

  private fun isNaturalPortrait(context: Context, rotation: Int): Boolean {
    val isLandscape = context.resources.configuration.orientation == Configuration.ORIENTATION_LANDSCAPE
    val isRotatedSideways = rotation == Surface.ROTATION_90 || rotation == Surface.ROTATION_270
    return isLandscape == isRotatedSideways
  }

  @Suppress("DEPRECATION")
  private fun displayOf(context: Context): Display? {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R && context is Activity) {
      return context.display
    }
    return (context.getSystemService(Context.WINDOW_SERVICE) as? WindowManager)?.defaultDisplay
  }
}
