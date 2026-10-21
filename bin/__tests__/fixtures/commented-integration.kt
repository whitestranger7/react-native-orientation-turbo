// TODO: import com.orientationturbo.OrientationTurbo
/*
override fun onCreate(savedInstanceState: Bundle?) {
  OrientationTurbo.lockToPortrait(this)
  super.onCreate(savedInstanceState)
}
/* Nested example: OrientationTurbo.lockToLandscape(this, LandscapeDirection.LEFT) */
import com.orientationturbo.OrientationTurbo
*/
val setupExample = """
OrientationTurbo.lockToPortrait(this)
super.onCreate(savedInstanceState)
"""
val setupURL = "https://example.com/*not-a-comment*/"
val interpolationExample = "${listOf("OrientationTurbo.lockToPortrait(this)")}"
