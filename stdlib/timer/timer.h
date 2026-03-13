/**
 * FreeLang Timer Module Header
 * Public API for setTimeout/setInterval integration with libuv
 */

#ifndef FREELANG_TIMER_H
#define FREELANG_TIMER_H

#include "../ffi/freelang_ffi.h"

/* ===== Timer API ===== */

/**
 * Initialize the global event loop context
 * Must be called before using any timer functions
 */
fl_event_context_t* timer_event_loop_init(void);

/**
 * Clean up the global event loop
 */
void timer_event_loop_cleanup(void);

/**
 * Create a new timer
 * @return timer_id (opaque pointer), or -1 on error
 * Note: Uses fl_timer_create() to avoid POSIX time.h conflict
 */
int fl_timer_create(void);

/**
 * Start a timer with a callback
 * @param timer_id: ID returned by timer_create()
 * @param timeout_ms: delay in milliseconds
 * @param callback_id: FreeLang callback ID
 * @param repeat: 0 for one-shot, 1 for repeating timer
 * @return 0 on success, -1 on error
 */
int timer_start(int timer_id, int timeout_ms, int callback_id, int repeat);

/**
 * Stop a running timer (but don't close it)
 */
void timer_stop(int timer_id);

/**
 * Close and free a timer
 */
void timer_close(int timer_id);

/* ===== Event Loop Control ===== */

/**
 * Run the event loop once (non-blocking, process pending events)
 */
void event_loop_run(int timeout_ms);

/**
 * Run the event loop in blocking mode (for testing)
 */
void event_loop_run_blocking(int timeout_ms);

/**
 * Request the event loop to stop
 */
void event_loop_stop(void);

/**
 * Get the global event context
 */
fl_event_context_t* timer_get_context(void);

#endif /* FREELANG_TIMER_H */
