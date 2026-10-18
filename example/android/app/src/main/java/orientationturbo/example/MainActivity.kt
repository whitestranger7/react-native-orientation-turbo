package orientationturbo.example

import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.orientationturbo.OrientationTurbo

class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "OrientationTurboExample"

  override fun onCreate(savedInstanceState: Bundle?) {
    // Static class to call before OrientationTurboModule is instantiated
    // This lock state will be synced with OrientationTurboModule after app is run
    OrientationTurbo.lockToPortrait(this)
    super.onCreate(savedInstanceState)
  }

  /**
   * Returns the instance of the [ReactActivityDelegate]. The New Architecture is always enabled,
   * so [DefaultReactActivityDelegate] no longer takes a `fabricEnabled` flag.
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName)
}
