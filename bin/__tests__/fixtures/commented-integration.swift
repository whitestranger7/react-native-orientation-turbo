// TODO: import OrientationTurbo
/*
extension AppDelegate {
  func application(_ application: UIApplication, supportedInterfaceOrientationsFor window: UIWindow?) -> UIInterfaceOrientationMask {
    return OrientationTurbo.shared.getSupportedInterfaceOrientations(for: window)
  }
}
/* Nested example: OrientationTurbo.shared.lockToPortrait() */
factory.startReactNative()
import OrientationTurbo
*/
let setupExample = #"""
OrientationTurbo.shared.lockToPortrait()
func application(_ application: UIApplication, supportedInterfaceOrientationsFor window: UIWindow?) -> UIInterfaceOrientationMask {
  return OrientationTurbo.shared.getSupportedInterfaceOrientations()
}
"""#
let setupURL = "https://example.com/*not-a-comment*/"
let interpolationExample = "\(String("OrientationTurbo.shared.lockToPortrait()"))"
