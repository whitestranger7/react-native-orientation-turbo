package com.orientationturbo.core

import com.orientationturbo.enums.Orientation
import java.util.concurrent.ConcurrentLinkedQueue
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicReference
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class OrientationRequestQueueTest {
  @Test
  fun uiLockDrainsTheEarlierBackgroundLockFirst() {
    val fixture = Fixture()
    fixture.submit(Orientation.PORTRAIT)
    fixture.ui.run { fixture.submit(Orientation.LANDSCAPE_RIGHT) }
    fixture.ui.flush()

    assertEquals(Orientation.LANDSCAPE_RIGHT, fixture.current)
    assertEquals(fixture.current, fixture.applied)
    assertEquals(listOf(Orientation.PORTRAIT, Orientation.LANDSCAPE_RIGHT), fixture.events)
    assertEquals(fixture.events, fixture.applications)
  }

  @Test
  fun uiUnlockCannotBeOverwrittenByAnEarlierBackgroundLock() {
    val fixture = Fixture()
    fixture.submit(Orientation.PORTRAIT)
    fixture.ui.run { fixture.submit(null) }
    fixture.ui.flush()

    assertNull(fixture.current)
    assertNull(fixture.applied)
    assertEquals(listOf(Orientation.PORTRAIT, null), fixture.events)
  }

  @Test
  fun uiLockFollowsAnEarlierBackgroundUnlock() {
    val fixture = Fixture()
    fixture.ui.run { fixture.submit(Orientation.PORTRAIT) }
    fixture.submit(null)
    fixture.ui.run { fixture.submit(Orientation.LANDSCAPE_LEFT) }
    fixture.ui.flush()

    assertEquals(Orientation.LANDSCAPE_LEFT, fixture.current)
    assertEquals(fixture.current, fixture.applied)
    assertEquals(listOf(Orientation.PORTRAIT, null, Orientation.LANDSCAPE_LEFT), fixture.events)
  }

  @Test
  fun backgroundRequestsUpdateStateBeforeUiWorkRunsAndKeepTheirOwnEventPayloads() {
    val fixture = Fixture()
    fixture.submit(Orientation.PORTRAIT)
    assertEquals(Orientation.PORTRAIT, fixture.current)
    fixture.submit(Orientation.LANDSCAPE_RIGHT)
    assertEquals(Orientation.LANDSCAPE_RIGHT, fixture.current)
    fixture.submit(null)
    assertNull(fixture.current)
    assertTrue(fixture.events.isEmpty())
    assertTrue(fixture.applications.isEmpty())

    fixture.ui.flush()
    assertEquals(listOf(Orientation.PORTRAIT, Orientation.LANDSCAPE_RIGHT, null), fixture.events)
    assertEquals(fixture.events, fixture.applications)
    assertNull(fixture.applied)
  }

  @Test
  fun uiOnlyRequestAppliesBeforeReturning() {
    val fixture = Fixture()
    fixture.ui.run {
      fixture.submit(Orientation.PORTRAIT_UPSIDE_DOWN)
      assertEquals(Orientation.PORTRAIT_UPSIDE_DOWN, fixture.applied)
      assertEquals(listOf(Orientation.PORTRAIT_UPSIDE_DOWN), fixture.events)
    }
  }

  @Test
  fun reentrantRequestFromEventWaitsUntilTheCurrentEventFinishes() {
    val fixture = Fixture()
    val order = mutableListOf<String>()
    fixture.afterEvent = { orientation ->
      order.add("start:$orientation")
      if (orientation == Orientation.PORTRAIT) fixture.submit(null)
      order.add("end:$orientation")
    }
    fixture.ui.run { fixture.submit(Orientation.PORTRAIT) }

    assertEquals(listOf("start:PORTRAIT", "end:PORTRAIT", "start:null", "end:null"), order)
    assertNull(fixture.current)
    assertNull(fixture.applied)
    assertEquals(listOf(Orientation.PORTRAIT, null), fixture.events)
  }

  @Test
  fun requestDuringApplicationDoesNotChangeTheEarlierEventPayload() {
    val fixture = Fixture()
    fixture.afterApply = { orientation ->
      if (orientation == Orientation.PORTRAIT) fixture.submit(Orientation.LANDSCAPE_LEFT)
    }
    fixture.ui.run { fixture.submit(Orientation.PORTRAIT) }

    assertEquals(listOf(Orientation.PORTRAIT, Orientation.LANDSCAPE_LEFT), fixture.events)
    assertEquals(Orientation.LANDSCAPE_LEFT, fixture.current)
    assertEquals(fixture.current, fixture.applied)
  }

  @Test
  fun repeatedRequestsStillEmitOncePerCall() {
    val fixture = Fixture()
    repeat(3) { fixture.submit(Orientation.PORTRAIT) }
    fixture.ui.flush()

    assertEquals(List(3) { Orientation.PORTRAIT }, fixture.events)
    assertEquals(fixture.events, fixture.applications)
  }

  @Test
  fun requestWithoutAnActivityStillRecordsStateAndEmitsItsPayload() {
    val ui = TestUiThread()
    var current: Orientation? = null
    val events = mutableListOf<Orientation?>()
    val requests = OrientationRequestQueue({ current = it }, ui::dispatch, events::add)

    requests.submit(Orientation.LANDSCAPE_RIGHT) { /* No Activity to update. */ }
    assertEquals(Orientation.LANDSCAPE_RIGHT, current)
    ui.flush()
    assertEquals(listOf(Orientation.LANDSCAPE_RIGHT), events)
  }

  @Test
  fun uiRequestCanDrainAnEarlierWorkerRequestBeforeThatWorkerPostsItsTask() {
    val fixture = Fixture()
    val reachedDispatch = CountDownLatch(1)
    val allowPost = CountDownLatch(1)
    val failure = AtomicReference<Throwable?>()
    fixture.ui.beforePost = {
      reachedDispatch.countDown()
      check(allowPost.await(5, TimeUnit.SECONDS))
    }
    val worker = Thread {
      try {
        fixture.submit(Orientation.PORTRAIT)
      } catch (error: Throwable) {
        failure.set(error)
      }
    }
    worker.start()
    try {
      assertTrue(reachedDispatch.await(5, TimeUnit.SECONDS))
      fixture.ui.run { fixture.submit(Orientation.LANDSCAPE_RIGHT) }
      assertEquals(listOf(Orientation.PORTRAIT, Orientation.LANDSCAPE_RIGHT), fixture.events)
      assertEquals(Orientation.LANDSCAPE_RIGHT, fixture.current)
      assertEquals(fixture.current, fixture.applied)
    } finally {
      allowPost.countDown()
      worker.join(5000)
    }
    assertFalse(worker.isAlive)
    assertNull(failure.get())
    fixture.ui.flush()
    assertEquals(2, fixture.events.size)
  }

  @Test
  fun manifestDefaultsInitializeOnceWithoutAnEventOrActivityUpdate() {
    val fixture = ReplayFixture()
    fixture.requests.initializeFromManifest(Orientation.PORTRAIT)
    fixture.requests.initializeFromManifest(Orientation.LANDSCAPE_LEFT)
    fixture.resume()

    assertEquals(Orientation.PORTRAIT, fixture.current)
    assertTrue(fixture.events.isEmpty())
    assertTrue(fixture.applications.isEmpty())
  }

  @Test
  fun explicitUnlockBeforeManifestInitializationWins() {
    val fixture = ReplayFixture()
    fixture.submit(null)
    fixture.requests.initializeFromManifest(Orientation.PORTRAIT)
    fixture.resume()

    assertNull(fixture.current)
    assertEquals(listOf<Orientation?>(null), fixture.events)
  }

  @Test
  fun explicitLockBeforeManifestInitializationWins() {
    val fixture = ReplayFixture()
    fixture.submit(Orientation.LANDSCAPE_LEFT)
    fixture.requests.initializeFromManifest(Orientation.PORTRAIT)
    fixture.resume()

    assertEquals(Orientation.LANDSCAPE_LEFT, fixture.current)
    assertEquals(listOf(Orientation.LANDSCAPE_LEFT), fixture.events)
  }

  @Test
  fun missingActivityLockIsAppliedOnResumeWithoutAnotherEvent() {
    val fixture = ReplayFixture()
    fixture.submit(Orientation.LANDSCAPE_RIGHT)
    fixture.ui.flush()
    assertTrue(fixture.applications.isEmpty())
    val activity = fixture.attach()
    fixture.resume()

    assertEquals(listOf(Orientation.LANDSCAPE_RIGHT), activity.applications)
    assertEquals(listOf(Orientation.LANDSCAPE_RIGHT), fixture.events)
  }

  @Test
  fun missingActivityUnlockSurvivesDeferredManifestInitialization() {
    val fixture = ReplayFixture()
    fixture.submit(null)
    fixture.ui.flush()
    val activity = fixture.attach()
    fixture.requests.initializeFromManifest(Orientation.PORTRAIT)
    fixture.resume()

    assertNull(fixture.current)
    assertEquals(listOf<Orientation?>(null), activity.applications)
    assertEquals(listOf<Orientation?>(null), fixture.events)
  }

  @Test
  fun onlyTheFinalMissingActivityRequestIsReplayed() {
    val fixture = ReplayFixture()
    fixture.submit(Orientation.PORTRAIT)
    fixture.submit(Orientation.LANDSCAPE_LEFT)
    fixture.submit(null)
    fixture.ui.flush()
    val activity = fixture.attach()
    fixture.resume()

    assertEquals(listOf<Orientation?>(null), activity.applications)
    assertEquals(listOf(Orientation.PORTRAIT, Orientation.LANDSCAPE_LEFT, null), fixture.events)
  }

  @Test
  fun attachmentBeforeTheFirstDrainAppliesOnlyTheLatestPendingRequest() {
    val fixture = ReplayFixture()
    fixture.submit(Orientation.PORTRAIT)
    fixture.submit(Orientation.LANDSCAPE_RIGHT)
    val activity = fixture.attach()
    fixture.resume()
    fixture.ui.flush()

    assertEquals(listOf(Orientation.LANDSCAPE_RIGHT), activity.applications)
    assertEquals(listOf(Orientation.PORTRAIT, Orientation.LANDSCAPE_RIGHT), fixture.events)
  }

  @Test
  fun replacementBeforeDrainDoesNotUpdateTheOldActivity() {
    val fixture = ReplayFixture()
    val oldActivity = fixture.attach()
    fixture.submit(Orientation.PORTRAIT)
    fixture.submit(Orientation.LANDSCAPE_RIGHT)
    val newActivity = fixture.attach()
    fixture.resume()
    fixture.ui.flush()

    assertTrue(oldActivity.applications.isEmpty())
    assertEquals(listOf(Orientation.LANDSCAPE_RIGHT), newActivity.applications)
    assertEquals(listOf(Orientation.PORTRAIT, Orientation.LANDSCAPE_RIGHT), fixture.events)
  }

  @Test
  fun targetIsResolvedWhenTheQueuedApplicationRuns() {
    val fixture = ReplayFixture()
    val oldActivity = fixture.attach()
    fixture.submit(Orientation.LANDSCAPE_LEFT)
    val newActivity = fixture.attach()
    fixture.ui.flush()

    assertTrue(oldActivity.applications.isEmpty())
    assertEquals(listOf(Orientation.LANDSCAPE_LEFT), newActivity.applications)
  }

  @Test
  fun recreationReplaysAnAlreadyAppliedRequestWithoutAnotherEvent() {
    val fixture = ReplayFixture()
    val oldActivity = fixture.attach()
    fixture.submit(Orientation.LANDSCAPE_LEFT)
    fixture.ui.flush()
    val newActivity = fixture.attach()
    fixture.resume()
    fixture.resume()

    assertEquals(listOf(Orientation.LANDSCAPE_LEFT), oldActivity.applications)
    assertEquals(listOf(Orientation.LANDSCAPE_LEFT), newActivity.applications)
    assertEquals(listOf(Orientation.LANDSCAPE_LEFT), fixture.events)
  }

  @Test
  fun latestRequestIsRetainedIfResumeStillHasNoActivity() {
    val fixture = ReplayFixture()
    fixture.submit(null)
    fixture.resume()
    val activity = fixture.attach()
    fixture.resume()

    assertEquals(listOf<Orientation?>(null), activity.applications)
    assertEquals(listOf<Orientation?>(null), fixture.events)
  }

  @Test
  fun newerRequestAfterReplayWinsAndDoesNotLoseItsEvent() {
    val fixture = ReplayFixture()
    val activity = fixture.attach()
    fixture.submit(Orientation.LANDSCAPE_LEFT)
    fixture.requests.replayLatest { orientation, _ -> fixture.apply(orientation) }
    fixture.submit(null)
    fixture.ui.flush()

    assertEquals(listOf(Orientation.LANDSCAPE_LEFT, null), activity.applications)
    assertEquals(listOf(Orientation.LANDSCAPE_LEFT, null), fixture.events)
    assertNull(fixture.current)
  }

  @Test
  fun explicitUnlockAfterManifestInitializationIsNotRestoredOnRecreation() {
    val fixture = ReplayFixture()
    fixture.requests.initializeFromManifest(Orientation.PORTRAIT)
    fixture.submit(null)
    val activity = fixture.attach()
    fixture.requests.initializeFromManifest(Orientation.PORTRAIT)
    fixture.resume()

    assertNull(fixture.current)
    assertEquals(listOf<Orientation?>(null), activity.applications)
    assertEquals(listOf<Orientation?>(null), fixture.events)
  }

  @Test
  fun sameActivityResumePreservesAnExternalOrientationChange() {
    for (orientation in listOf(Orientation.PORTRAIT, null)) {
      val fixture = ReplayFixture()
      val activity = fixture.attach()
      fixture.submit(orientation)
      fixture.ui.flush()
      activity.orientation = Orientation.LANDSCAPE_RIGHT // Native player changes the Activity directly.
      fixture.resume()
      fixture.resume()

      assertEquals(Orientation.LANDSCAPE_RIGHT, activity.orientation)
      assertEquals(listOf(orientation), activity.applications)
      assertEquals(listOf(orientation), fixture.events)
    }
  }

  @Test
  fun aNewIdenticalExplicitRequestStillAppliesWhenResumePrecedesItsDrain() {
    val fixture = ReplayFixture()
    val activity = fixture.attach()
    fixture.submit(Orientation.PORTRAIT)
    fixture.ui.flush()
    activity.orientation = Orientation.LANDSCAPE_RIGHT
    fixture.submit(Orientation.PORTRAIT)
    fixture.resume()
    fixture.ui.flush()

    assertEquals(Orientation.PORTRAIT, activity.orientation)
    assertEquals(listOf(Orientation.PORTRAIT, Orientation.PORTRAIT), activity.applications)
    assertEquals(listOf(Orientation.PORTRAIT, Orientation.PORTRAIT), fixture.events)
  }

  @Test
  fun temporarilyMissingActivityOnResumeDoesNotForgetASuccessfulApplication() {
    val fixture = ReplayFixture()
    val activity = fixture.attach()
    fixture.submit(Orientation.PORTRAIT)
    fixture.ui.flush()
    activity.orientation = Orientation.LANDSCAPE_RIGHT
    fixture.detach()
    fixture.resume()
    fixture.attach(activity)
    fixture.resume()

    assertEquals(Orientation.LANDSCAPE_RIGHT, activity.orientation)
    assertEquals(listOf(Orientation.PORTRAIT), activity.applications)
  }

  @Test
  fun failedApplicationDoesNotStrandAReentrantRequestAndItsEvent() {
    val ui = TestUiThread()
    val errors = mutableListOf<RuntimeException>()
    val events = mutableListOf<Orientation?>()
    val applied = mutableListOf<Orientation?>()
    val requests = OrientationRequestQueue({}, ui::dispatch, events::add, errors::add)
    val failure = IllegalStateException("Only fullscreen opaque activities can request orientation")
    ui.run {
      requests.submit(Orientation.PORTRAIT) {
        requests.submit(Orientation.LANDSCAPE_RIGHT) { applied.add(Orientation.LANDSCAPE_RIGHT) }
        throw failure
      }
    }

    assertEquals(listOf(failure), errors)
    assertEquals(listOf(Orientation.LANDSCAPE_RIGHT), applied)
    assertEquals(listOf(Orientation.PORTRAIT, Orientation.LANDSCAPE_RIGHT), events)
  }

  @Test
  fun successiveQueuedReplaysRetainThePendingExplicitApplication() {
    val ui = TestUiThread()
    val events = mutableListOf<Orientation?>()
    val pendingApplications = mutableListOf<Boolean>()
    val requests = OrientationRequestQueue({}, ui::dispatch, events::add)
    requests.submit(Orientation.PORTRAIT) {}
    repeat(2) {
      requests.replayLatest { _, hasPending -> pendingApplications.add(hasPending) }
    }
    ui.flush()

    assertEquals(listOf(true), pendingApplications)
    assertEquals(listOf(Orientation.PORTRAIT), events)
  }

  @Test
  fun failedReplayDoesNotStrandTheFollowingUnlockOrEmitAnotherEvent() {
    val ui = TestUiThread()
    val errors = mutableListOf<RuntimeException>()
    val events = mutableListOf<Orientation?>()
    val applied = mutableListOf<Orientation?>()
    val requests = OrientationRequestQueue({}, ui::dispatch, events::add, errors::add)
    requests.submit(Orientation.PORTRAIT) {}
    ui.flush()
    ui.run {
      requests.replayLatest { _, _ ->
        requests.submit(null) { applied.add(null) }
        throw IllegalStateException("Activity rejected orientation")
      }
    }

    assertEquals(1, errors.size)
    assertEquals(listOf<Orientation?>(null), applied)
    assertEquals(listOf(Orientation.PORTRAIT, null), events)
  }

  private class ReplayFixture {
    class Activity {
      val applications = mutableListOf<Orientation?>()
      var orientation: Orientation? = null
    }

    val ui = TestUiThread()
    var current: Orientation? = null
    private var activity: Activity? = null
    val applications = mutableListOf<Orientation?>()
    val events = mutableListOf<Orientation?>()
    private val applied = AppliedOrientation()
    val requests = OrientationRequestQueue({ current = it }, ui::dispatch, events::add)

    fun attach(target: Activity = Activity()): Activity = target.also { activity = it }
    fun detach() { activity = null }

    fun apply(orientation: Orientation?) {
      assertTrue(ui.isOnUiThread)
      activity?.let {
        it.orientation = orientation
        it.applications.add(orientation)
        applications.add(orientation)
        applied.record(it, orientation?.ordinal ?: -1)
      } ?: applied.clear()
    }

    fun submit(orientation: Orientation?) = requests.submit(orientation) { apply(orientation) }
    fun resume() = ui.run {
      requests.replayLatest { orientation, hasPendingApplication ->
        val target = activity
        if (hasPendingApplication || (target != null && !applied.isApplied(target, orientation?.ordinal ?: -1))) {
          apply(orientation)
        }
      }
    }
  }

  private class Fixture {
    val ui = TestUiThread()
    var current: Orientation? = null
    var applied: Orientation? = null
    val applications = mutableListOf<Orientation?>()
    val events = mutableListOf<Orientation?>()
    var afterEvent: (Orientation?) -> Unit = {}
    var afterApply: (Orientation?) -> Unit = {}
    private val requests = OrientationRequestQueue(
      { current = it },
      ui::dispatch,
      { orientation ->
        assertTrue(ui.isOnUiThread)
        events.add(orientation)
        afterEvent(orientation)
      },
    )

    fun submit(orientation: Orientation?) {
      requests.submit(orientation) {
        assertTrue(ui.isOnUiThread)
        applied = orientation
        applications.add(orientation)
        afterApply(orientation)
      }
    }
  }

  private class TestUiThread {
    private val onUi = ThreadLocal.withInitial { false }
    private val tasks = ConcurrentLinkedQueue<() -> Unit>()
    val isOnUiThread: Boolean get() = onUi.get() == true
    var beforePost: () -> Unit = {}

    fun dispatch(task: () -> Unit) {
      if (isOnUiThread) task() else {
        beforePost()
        tasks.add(task)
      }
    }

    fun run(task: () -> Unit) {
      val previous = onUi.get()
      onUi.set(true)
      try {
        task()
      } finally {
        onUi.set(previous)
      }
    }

    fun flush() = run {
      while (true) (tasks.poll() ?: break).invoke()
    }
  }
}
