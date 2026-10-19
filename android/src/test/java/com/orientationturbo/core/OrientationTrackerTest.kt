package com.orientationturbo.core

import com.orientationturbo.enums.Orientation

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class OrientationTrackerTest {

  @Test
  fun stableCandidateEmitsOnceAfterTheFullInterval() {
    val fixture = Fixture()
    fixture.listener.angle(90)
    fixture.clock.advanceBy(199)
    fixture.assertUnchanged()
    fixture.listener.angle(100) // Still in the same zone: don't restart the timer.
    fixture.clock.advanceBy(1)
    assertEquals(listOf(Orientation.LANDSCAPE_LEFT), fixture.events)
    fixture.listener.angle(105)
    fixture.clock.advanceBy(500)
    assertEquals(listOf(Orientation.LANDSCAPE_LEFT), fixture.events)
  }

  @Test
  fun leavingForTheDeadBandCancelsTheCandidate() {
    val fixture = Fixture()
    fixture.listener.angle(90)
    fixture.clock.advanceBy(100)
    fixture.listener.angle(45)
    fixture.clock.advanceBy(500)
    fixture.assertUnchanged()
  }

  @Test
  fun unknownReadingCancelsTheCandidate() {
    val fixture = Fixture()
    fixture.listener.angle(90)
    fixture.clock.advanceBy(100)
    fixture.listener.angle(-1) // OrientationEventListener.ORIENTATION_UNKNOWN
    fixture.clock.advanceBy(500)
    fixture.assertUnchanged()
  }

  @Test
  fun reentryAfterDeadBandOrUnknownNeedsAFreshFullInterval() {
    for (outside in listOf(45, -1)) {
      val fixture = Fixture()
      fixture.listener.angle(90)
      fixture.clock.advanceBy(100)
      fixture.listener.angle(outside)
      fixture.clock.advanceBy(50)
      fixture.listener.angle(90)
      fixture.clock.advanceBy(199)
      fixture.assertUnchanged()
      fixture.clock.advanceBy(1)
      assertEquals(listOf(Orientation.LANDSCAPE_LEFT), fixture.events)
    }
  }

  @Test
  fun replacingTheCandidateRestartsTheInterval() {
    val fixture = Fixture()
    fixture.listener.angle(90)
    fixture.clock.advanceBy(150)
    fixture.listener.angle(180)
    fixture.clock.advanceBy(199)
    fixture.assertUnchanged()
    fixture.clock.advanceBy(1)
    assertEquals(listOf(Orientation.PORTRAIT_UPSIDE_DOWN), fixture.events)
  }

  @Test
  fun returningToTheCurrentOrientationCancelsTheCandidate() {
    val fixture = Fixture()
    fixture.listener.angle(90)
    fixture.clock.advanceBy(150)
    fixture.listener.angle(0)
    fixture.clock.advanceBy(500)
    fixture.assertUnchanged()
  }

  @Test
  fun anAlreadyDequeuedOldCallbackCannotCommitAReenteredCandidateEarly() {
    val fixture = Fixture()
    fixture.listener.angle(90)
    val oldCallback = fixture.clock.lastCallback
    fixture.clock.advanceBy(100)
    fixture.listener.angle(45)
    fixture.listener.angle(90)
    oldCallback.run()
    fixture.assertUnchanged()
    fixture.clock.advanceBy(199)
    fixture.assertUnchanged()
    fixture.clock.advanceBy(1)
    assertEquals(listOf(Orientation.LANDSCAPE_LEFT), fixture.events)
  }

  @Test
  fun pauseCancelsWorkAndIgnoresLateSensorDeliveryUntilResume() {
    val fixture = Fixture()
    fixture.listener.angle(90)
    val oldCallback = fixture.clock.lastCallback
    fixture.clock.advanceBy(100)
    fixture.tracker.pause()
    assertFalse(fixture.listener.enabled)
    fixture.listener.deliverLate(90)
    oldCallback.run()
    fixture.clock.advanceBy(500)
    fixture.assertUnchanged()
    fixture.tracker.resume()
    assertTrue(fixture.listener.enabled)
    fixture.listener.angle(90)
    fixture.clock.advanceBy(199)
    fixture.assertUnchanged()
    fixture.clock.advanceBy(1)
    assertEquals(listOf(Orientation.LANDSCAPE_LEFT), fixture.events)
  }

  @Test
  fun stopCancelsWorkAndResumeDoesNotRestartStoppedTracking() {
    val fixture = Fixture()
    fixture.listener.angle(90)
    val oldCallback = fixture.clock.lastCallback
    fixture.tracker.stopOrientationTracking()
    assertFalse(fixture.listener.enabled)
    fixture.listener.deliverLate(90)
    oldCallback.run()
    fixture.tracker.resume()
    assertFalse(fixture.listener.enabled)
    fixture.clock.advanceBy(500)
    fixture.assertUnchanged()
    fixture.start()
    assertEquals(2, fixture.listeners.size)
    fixture.listener.angle(90)
    fixture.clock.advanceBy(199)
    fixture.assertUnchanged()
    fixture.clock.advanceBy(1)
    assertEquals(listOf(Orientation.LANDSCAPE_LEFT), fixture.events)
  }

  @Test
  fun startingWhilePausedWaitsForResume() {
    val fixture = Fixture(autoStart = false)
    fixture.tracker.pause()
    fixture.start()
    assertFalse(fixture.listener.enabled)
    fixture.listener.deliverLate(90)
    fixture.clock.advanceBy(500)
    fixture.assertUnchanged()
    fixture.tracker.resume()
    fixture.listener.angle(90)
    fixture.clock.advanceBy(200)
    assertEquals(listOf(Orientation.LANDSCAPE_LEFT), fixture.events)
  }

  @Test
  fun naturalLandscapeDevicesUseTheSameStabilityRule() {
    val fixture = Fixture(isNaturalPortrait = false)
    fixture.listener.angle(0)
    fixture.clock.advanceBy(200)
    assertEquals(listOf(Orientation.LANDSCAPE_RIGHT), fixture.events)
  }

  @Test
  fun commitDoesNotEmitIfTheDeviceStateAlreadyMatches() {
    val fixture = Fixture()
    fixture.listener.angle(90)
    fixture.current = Orientation.LANDSCAPE_LEFT
    fixture.clock.advanceBy(200)
    assertTrue(fixture.events.isEmpty())
  }

  private class Fixture(isNaturalPortrait: Boolean = true, autoStart: Boolean = true) {
    var current = Orientation.PORTRAIT
    val events = mutableListOf<Orientation>()
    val clock = VirtualClock()
    val listeners = mutableListOf<TestListener>()
    val listener: TestListener get() = listeners.last()
    val tracker = OrientationTracker(
      currentDeviceOrientation = { current },
      setDeviceOrientation = { current = it },
      scheduler = clock,
      naturalPortrait = { isNaturalPortrait },
      createListener = { callback -> TestListener(callback).also { listeners.add(it) } },
    )

    init {
      if (autoStart) start()
    }

    fun start() = tracker.startOrientationTracking { events.add(current) }

    fun assertUnchanged() {
      assertEquals(Orientation.PORTRAIT, current)
      assertTrue(events.isEmpty())
    }
  }

  private class TestListener(private val onAngle: (Int) -> Unit) : OrientationTracker.Listener {
    var enabled = false
      private set

    override fun enable() { enabled = true }
    override fun disable() { enabled = false }

    fun angle(angle: Int) {
      check(enabled)
      onAngle(angle)
    }

    fun deliverLate(angle: Int) = onAngle(angle)
  }

  private class VirtualClock : OrientationTracker.Scheduler {
    private data class Entry(val callback: Runnable, val due: Long)
    private val queue = mutableListOf<Entry>()
    private var now = 0L
    val lastCallback: Runnable get() = queue.last().callback

    override fun postDelayed(callback: Runnable, delayMillis: Long) {
      queue.add(Entry(callback, now + delayMillis))
    }

    override fun removeCallbacks(callback: Runnable) {
      queue.removeAll { it.callback === callback }
    }

    fun advanceBy(millis: Long) {
      val target = now + millis
      while (true) {
        val next = queue.minByOrNull { it.due } ?: break
        if (next.due > target) break
        queue.remove(next)
        now = next.due
        next.callback.run()
      }
      now = target
    }
  }
}
