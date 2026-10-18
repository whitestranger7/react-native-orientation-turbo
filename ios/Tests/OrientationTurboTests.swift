import UIKit
import XCTest

@testable import OrientationTurbo

final class OrientationLockSupportTests: XCTestCase {

  func testHomeButtonModels() {
    for model in ["iPhone8,1", "iPhone8,4", "iPhone9,3", "iPhone10,1", "iPhone10,5", "iPhone12,8", "iPhone14,6"] {
      XCTAssertTrue(OrientationLockSupport.hasHomeButton(model: model), model)
    }
  }

  func testModelsWithoutHomeButton() {
    // iPhone X (10,3 / 10,6), 11, 15 Pro, 17 Pro and any future model
    for model in ["iPhone10,3", "iPhone10,6", "iPhone12,1", "iPhone16,1", "iPhone18,1", "iPhone99,9"] {
      XCTAssertFalse(OrientationLockSupport.hasHomeButton(model: model), model)
    }
  }

  func testInfoPlistOrientations() {
    let mask = OrientationLockSupport.orientations(fromInfoPlistNames: [
      "UIInterfaceOrientationPortrait",
      "UIInterfaceOrientationLandscapeLeft",
      "UIInterfaceOrientationLandscapeRight",
    ])
    XCTAssertEqual(mask, [.portrait, .landscapeLeft, .landscapeRight])
  }

  func testMissingOrEmptyInfoPlistOrientationsMeanAll() {
    XCTAssertEqual(OrientationLockSupport.orientations(fromInfoPlistNames: nil), .all)
    XCTAssertEqual(OrientationLockSupport.orientations(fromInfoPlistNames: []), .all)
    XCTAssertEqual(OrientationLockSupport.orientations(fromInfoPlistNames: ["Unknown"]), .all)
  }
}

final class OrientationDetectorTests: XCTestCase {

  /// UIKit: UIInterfaceOrientationLandscapeLeft = UIDeviceOrientationLandscapeRight (UIOrientation.h)
  func testDeviceOrientationConvertsToTheInterfaceOrientationThatShowsIt() {
    XCTAssertEqual(OrientationDetector.interfaceOrientation(for: .portrait), .portrait)
    XCTAssertEqual(OrientationDetector.interfaceOrientation(for: .portraitUpsideDown), .portraitUpsideDown)
    XCTAssertEqual(OrientationDetector.interfaceOrientation(for: .landscapeRight), .landscapeLeft)
    XCTAssertEqual(OrientationDetector.interfaceOrientation(for: .landscapeLeft), .landscapeRight)
  }

  func testInterfaceOrientationNamesMatchTheLibrary() {
    let detector = OrientationDetector()
    XCTAssertEqual(detector.getOrientation(from: .portrait), "PORTRAIT")
    XCTAssertEqual(detector.getOrientation(from: .portraitUpsideDown), "PORTRAIT_UPSIDE_DOWN")
    XCTAssertEqual(detector.getOrientation(from: .landscapeLeft), "LANDSCAPE_LEFT")
    XCTAssertEqual(detector.getOrientation(from: .landscapeRight), "LANDSCAPE_RIGHT")
    XCTAssertNil(detector.getOrientation(from: .unknown))
  }
}

final class OrientationManagerTests: XCTestCase {

  func testInvalidDirectionsAreIgnored() {
    let manager = OrientationManager()
    XCTAssertFalse(manager.lockToLandscape("UP"))
    XCTAssertFalse(manager.lockToLandscape("left"))
    XCTAssertFalse(manager.lockToPortrait("SIDEWAYS"))
    XCTAssertFalse(manager.isLocked())
  }

  func testValidLocksChangeTheState() {
    let manager = OrientationManager()
    XCTAssertTrue(manager.lockToLandscape("LEFT"))
    XCTAssertTrue(manager.isLocked())
    XCTAssertEqual(manager.getLockedOrientationString(), "LANDSCAPE_LEFT")
    XCTAssertEqual(manager.getSupportedInterfaceOrientations(), .landscapeLeft)

    manager.unlockAllOrientations()
    XCTAssertFalse(manager.isLocked())
    XCTAssertEqual(manager.getSupportedInterfaceOrientations(), .all)
  }
}
