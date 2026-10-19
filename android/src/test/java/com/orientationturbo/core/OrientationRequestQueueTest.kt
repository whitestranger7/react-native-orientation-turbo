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
