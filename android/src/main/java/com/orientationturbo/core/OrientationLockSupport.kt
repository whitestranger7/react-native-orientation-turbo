package com.orientationturbo.core

import android.app.Activity
import android.content.Context
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.os.Build
import android.view.WindowManager

/**
 * Whether the system applies orientation locks for this app.
 * Android 16 (API 36) ignores them on displays with smallest width >= 600dp for apps targeting
 * API 36+, except for games and apps that opt out (the opt-out stops working when targeting API 37).
 * See https://developer.android.com/about/versions/16/behavior-changes-16
 *
 * Uses literal API levels and names: apps on older React Native versions compile with compileSdk 35.
 */
internal object OrientationLockSupport {
  private const val ANDROID_16 = 36
  private const val ANDROID_17 = 37
  private const val LARGE_SCREEN_MIN_WIDTH_DP = 600
  private const val ALLOW_RESTRICTED_RESIZABILITY = "android.window.PROPERTY_COMPAT_ALLOW_RESTRICTED_RESIZABILITY"

  fun canLockOrientation(context: Context, activity: Activity?): Boolean {
    if (Build.VERSION.SDK_INT < ANDROID_16) return true

    val applicationInfo = context.applicationInfo
    val targetSdk = applicationInfo.targetSdkVersion
    if (targetSdk < ANDROID_16) return true
    if (applicationInfo.category == ApplicationInfo.CATEGORY_GAME) return true
    if (!isLargeScreen(activity ?: context)) return true

    return targetSdk < ANDROID_17 && hasRestrictedResizabilityOptOut(context, activity)
  }

  private fun isLargeScreen(context: Context): Boolean {
    val windowManager = context.getSystemService(Context.WINDOW_SERVICE) as? WindowManager ?: return false
    val bounds = windowManager.maximumWindowMetrics.bounds
    val density = context.resources.displayMetrics.density
    val smallestWidthDp = minOf(bounds.width(), bounds.height()) / density
    return smallestWidthDp >= LARGE_SCREEN_MIN_WIDTH_DP
  }

  private fun hasRestrictedResizabilityOptOut(context: Context, activity: Activity?): Boolean {
    val packageManager = context.packageManager
    val activityOptOut = activity?.let {
      readBooleanProperty { packageManager.getProperty(ALLOW_RESTRICTED_RESIZABILITY, it.componentName) }
    }
    return activityOptOut
      ?: readBooleanProperty { packageManager.getProperty(ALLOW_RESTRICTED_RESIZABILITY, context.packageName) }
      ?: false
  }

  private fun readBooleanProperty(read: () -> PackageManager.Property): Boolean? {
    return try {
      read().boolean
    } catch (e: PackageManager.NameNotFoundException) {
      null
    }
  }
}
