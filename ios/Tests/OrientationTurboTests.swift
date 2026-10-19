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

  func testPhonesWithoutHomeButtonSupportBothLandscapesButNotUpsideDown() {
    for model in ["iPhone10,3", "iPhone16,1", "iPhone99,9"] {
      XCTAssertEqual(
        OrientationLockSupport.deviceOrientations(idiom: .phone, model: model),
        [.portrait, .landscapeLeft, .landscapeRight],
        model
      )
    }
  }

  func testHomeButtonPhonesAndIPadsSupportAllOrientations() {
    XCTAssertEqual(OrientationLockSupport.deviceOrientations(idiom: .phone, model: "iPhone14,6"), .all)
    XCTAssertEqual(OrientationLockSupport.deviceOrientations(idiom: .pad, model: "iPad16,6"), .all)
  }
}

final class OrientationDetectorTests: XCTestCase {

  /// Keep main occupied while reading on another thread: a queued refresh cannot hide a stale first value,
  /// and a synchronous dispatch to main would time out rather than deadlocking the test suite.
  private func readFromBackground(_ detector: OrientationDetector) -> String? {
    let result = LockedValue<String?>(nil)
    let finished = DispatchSemaphore(value: 0)
    DispatchQueue.global().async {
      result.set(detector.getCurrentOrientation())
      finished.signal()
    }
    XCTAssertEqual(finished.wait(timeout: .now() + 1), .success)
    return result.get()
  }

  func testFirstBackgroundReadIsSeededFromTheInterfaceWithoutAnEarlierQuery() {
    XCTAssertTrue(Thread.isMainThread)
    let detector = OrientationDetector(interfaceOrientation: { _ in .landscapeLeft })
    XCTAssertEqual(readFromBackground(detector), "LANDSCAPE_LEFT")
  }

  func testLifecycleUpdatesAreVisibleToTheFirstBackgroundRead() {
    let center = NotificationCenter()
    var orientation: UIInterfaceOrientation = .portrait
    let detector = OrientationDetector(notificationCenter: center, interfaceOrientation: { _ in orientation })
    for name in [UIScene.didActivateNotification, UIWindow.didBecomeKeyNotification, UIApplication.didBecomeActiveNotification] {
      orientation = orientation == .landscapeRight ? .portrait : .landscapeRight
      center.post(name: name, object: nil)
      XCTAssertEqual(readFromBackground(detector), OrientationDetector.getOrientation(from: orientation))
    }
  }

  func testMissingOrUnknownSceneKeepsTheLastKnownUIOrientation() {
    var orientation: UIInterfaceOrientation?
    let detector = OrientationDetector(interfaceOrientation: { _ in orientation })
    XCTAssertEqual(readFromBackground(detector), "PORTRAIT")
    orientation = .landscapeRight
    XCTAssertEqual(detector.refreshInterfaceOrientation(), "LANDSCAPE_RIGHT")
    orientation = nil
    XCTAssertEqual(detector.refreshInterfaceOrientation(), "LANDSCAPE_RIGHT")
    orientation = .unknown
    XCTAssertEqual(detector.refreshInterfaceOrientation(), "LANDSCAPE_RIGHT")
    XCTAssertEqual(readFromBackground(detector), "LANDSCAPE_RIGHT")
  }

  func testLifecycleObserversDoNotKeepTheDetectorAlive() {
    let center = NotificationCenter()
    weak var reference: OrientationDetector?
    autoreleasepool {
      let detector = OrientationDetector(notificationCenter: center, interfaceOrientation: { _ in .landscapeLeft })
      reference = detector
      XCTAssertEqual(detector.getCurrentOrientation(), "LANDSCAPE_LEFT")
    }
    XCTAssertNil(reference)
    center.post(name: UIScene.didActivateNotification, object: nil)
  }

  func testBackgroundInitializationDoesNotWaitForMain() {
    let detector = LockedValue<OrientationDetector?>(nil)
    let initialized = DispatchSemaphore(value: 0)
    DispatchQueue.global().async {
      detector.set(OrientationDetector(interfaceOrientation: { _ in .landscapeRight }))
      initialized.signal()
    }
    XCTAssertEqual(initialized.wait(timeout: .now() + 1), .success)

    let ready = expectation(description: "main-queue initialization")
    DispatchQueue.main.async {
      if let detector = detector.get() {
        XCTAssertEqual(self.readFromBackground(detector), "LANDSCAPE_RIGHT")
      } else {
        XCTFail("Detector was not initialized")
      }
      ready.fulfill()
    }
    wait(for: [ready], timeout: 2)
  }

  /// UIKit: UIInterfaceOrientationLandscapeLeft = UIDeviceOrientationLandscapeRight (UIOrientation.h)
  func testDeviceOrientationConvertsToTheInterfaceOrientationThatShowsIt() {
    XCTAssertEqual(OrientationDetector.interfaceOrientation(for: .portrait), .portrait)
    XCTAssertEqual(OrientationDetector.interfaceOrientation(for: .portraitUpsideDown), .portraitUpsideDown)
    XCTAssertEqual(OrientationDetector.interfaceOrientation(for: .landscapeRight), .landscapeLeft)
    XCTAssertEqual(OrientationDetector.interfaceOrientation(for: .landscapeLeft), .landscapeRight)
  }

  func testInterfaceOrientationNamesMatchTheLibrary() {
    XCTAssertEqual(OrientationDetector.getOrientation(from: .portrait), "PORTRAIT")
    XCTAssertEqual(OrientationDetector.getOrientation(from: .portraitUpsideDown), "PORTRAIT_UPSIDE_DOWN")
    XCTAssertEqual(OrientationDetector.getOrientation(from: .landscapeLeft), "LANDSCAPE_LEFT")
    XCTAssertEqual(OrientationDetector.getOrientation(from: .landscapeRight), "LANDSCAPE_RIGHT")
    XCTAssertNil(OrientationDetector.getOrientation(from: .unknown))
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

  func testRejectedUpsideDownLockPreservesAnExistingLandscapeLock() throws {
    guard !OrientationLockSupport.applicableOrientations.contains(.portraitUpsideDown) else {
      throw XCTSkip("This device supports portrait upside-down")
    }
    let manager = OrientationManager()
    XCTAssertTrue(manager.lockToLandscape("RIGHT"))
    XCTAssertFalse(manager.lockToPortrait("UPSIDE_DOWN"))
    XCTAssertTrue(manager.isLocked())
    XCTAssertEqual(manager.getLockedOrientationString(), "LANDSCAPE_RIGHT")
    XCTAssertEqual(manager.getSupportedInterfaceOrientations(), .landscapeRight)
  }
}
