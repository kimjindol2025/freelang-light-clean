/**
 * FreeLang Timer Module Implementation (Phase 16 Week 2)
 * Implements setTimeout/setInterval using libuv event loop
 * Integrated with Promise Bridge for async/await support
 */

#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include <uv.h>
#include "../ffi/freelang_ffi.h"

/* ===== Global Event Loop Context ===== */

static fl_event_context_t *global_ctx = NULL;

/* ===== Timer Internal Structure ===== */

typedef struct {
  uv_timer_t handle;
  int wrapper_id;
  int callback_id;
  fl_event_context_t *ctx;
  int is_repeat;
} fl_timer_internal_t;

/* ===== Event Loop Initialization ===== */

fl_event_context_t* timer_event_loop_init(void) {
  if (global_ctx != NULL) {
    return global_ctx;
  }

  global_ctx = freelang_event_context_create();
  if (!global_ctx) {
    fprintf(stderr, "[Timer] Failed to create event context\n");
    return NULL;
  }

  fprintf(stderr, "[Timer] Event loop initialized\n");
  return global_ctx;
}

void timer_event_loop_cleanup(void) {
  if (global_ctx) {
    freelang_event_context_destroy(global_ctx);
    global_ctx = NULL;
    fprintf(stderr, "[Timer] Event loop cleaned up\n");
  }
}

/* ===== Timer Callback Wrapper ===== */

static void timer_callback_wrapper(uv_timer_t *handle) {
  fl_timer_internal_t *timer = (fl_timer_internal_t*)handle->data;
  if (!timer || !timer->ctx) return;

  /* Enqueue callback for deferred execution (Promise Bridge) */
  freelang_enqueue_callback(timer->ctx, timer->callback_id, NULL);

  fprintf(stderr, "[Timer] Callback %d executed (timer_id: %p)\n",
          timer->callback_id, (void*)timer);
}

/* ===== Timer Creation ===== */

int fl_timer_create(void) {
  fl_event_context_t *ctx = timer_event_loop_init();
  if (!ctx || !ctx->uv_loop) {
    return -1;
  }

  fl_timer_internal_t *timer = (fl_timer_internal_t*)malloc(sizeof(fl_timer_internal_t));
  if (!timer) {
    return -1;
  }

  int ret = uv_timer_init(ctx->uv_loop, &timer->handle);
  if (ret) {
    fprintf(stderr, "[Timer] uv_timer_init failed: %s\n", uv_strerror(ret));
    free(timer);
    return -1;
  }

  timer->ctx = ctx;
  timer->wrapper_id = -1;
  timer->callback_id = -1;
  timer->is_repeat = 0;
  timer->handle.data = timer;

  fprintf(stderr, "[Timer] Timer created (id: %p)\n", (void*)timer);

  return (int)(intptr_t)timer;
}

/* Note: timer_create() conflicts with POSIX timer_create from time.h
 * Use fl_timer_create() instead */

/* ===== Timer Start ===== */

int timer_start(int timer_id, int timeout_ms, int callback_id, int repeat) {
  fl_timer_internal_t *timer = (fl_timer_internal_t*)(intptr_t)timer_id;
  if (!timer) {
    return -1;
  }

  /* Create handle wrapper for callback tracking */
  int wrapper_id = freelang_handle_create(&timer->handle, callback_id, 1); /* 1 = HANDLE_TIMER */
  if (wrapper_id < 0) {
    fprintf(stderr, "[Timer] Failed to create handle wrapper\n");
    return -1;
  }

  timer->wrapper_id = wrapper_id;
  timer->callback_id = callback_id;
  timer->is_repeat = repeat;

  /* Start the uv timer */
  uint64_t repeat_interval = repeat ? timeout_ms : 0;
  int ret = uv_timer_start(&timer->handle, timer_callback_wrapper,
                          timeout_ms, repeat_interval);
  if (ret) {
    fprintf(stderr, "[Timer] uv_timer_start failed: %s\n", uv_strerror(ret));
    freelang_handle_destroy(wrapper_id);
    timer->wrapper_id = -1;
    return -1;
  }

  fprintf(stderr, "[Timer] Timer started (timer_id: %p, delay: %d ms, repeat: %d)\n",
          (void*)timer, timeout_ms, repeat);

  return 0;
}

/* ===== Timer Stop ===== */

void timer_stop(int timer_id) {
  fl_timer_internal_t *timer = (fl_timer_internal_t*)(intptr_t)timer_id;
  if (!timer) return;

  int ret = uv_timer_stop(&timer->handle);
  if (ret == 0) {
    fprintf(stderr, "[Timer] Timer stopped (timer_id: %p)\n", (void*)timer);
  }
}

/* ===== Timer Close ===== */

void timer_close(int timer_id) {
  fl_timer_internal_t *timer = (fl_timer_internal_t*)(intptr_t)timer_id;
  if (!timer) return;

  /* Stop the timer first */
  uv_timer_stop(&timer->handle);

  /* Cleanup wrapper if exists */
  if (timer->wrapper_id >= 0) {
    freelang_handle_destroy(timer->wrapper_id);
    timer->wrapper_id = -1;
  }

  /* Close the uv handle */
  uv_close((uv_handle_t*)&timer->handle, NULL);

  free(timer);

  fprintf(stderr, "[Timer] Timer closed\n");
}

/* ===== Event Loop Timeout Callback ===== */

static int loop_running = 1;

static void timeout_cb(uv_timer_t *handle) {
  loop_running = 0;
  uv_timer_stop(handle);
  uv_close((uv_handle_t*)handle, NULL);
}

/* ===== Event Loop Execution ===== */

void event_loop_run(int __attribute__((unused)) timeout_ms) {
  if (!global_ctx || !global_ctx->uv_loop) {
    fprintf(stderr, "[Timer] Event loop not initialized\n");
    return;
  }

  /* Run libuv with non-blocking mode (process pending events) */
  uv_run(global_ctx->uv_loop, UV_RUN_NOWAIT);

  /* Process any pending FreeLang callbacks from C */
  freelang_process_callbacks(global_ctx);
}

void event_loop_stop(void) {
  if (global_ctx) {
    freelang_event_loop_stop(global_ctx);
    fprintf(stderr, "[Timer] Event loop stop requested\n");
  }
}

/* ===== VM Callback ===== */

/* vm_execute_callback() is defined in freelang_ffi.c
 * It's a stub that will be replaced by actual VM implementation */
extern void vm_execute_callback(int callback_id, void *args);

/* ===== Blocking Event Loop (for testing) ===== */

void event_loop_run_blocking(int timeout_ms) {
  if (!global_ctx || !global_ctx->uv_loop) {
    fprintf(stderr, "[Timer] Event loop not initialized\n");
    return;
  }

  /* Run libuv in blocking mode for specified duration */
  if (timeout_ms > 0) {
    /* Set a timeout to break the loop */
    uv_timer_t timeout_handle;
    uv_timer_init(global_ctx->uv_loop, &timeout_handle);

    loop_running = 1;
    uv_timer_start(&timeout_handle, timeout_cb, timeout_ms, 0);

    /* Run with blocking mode */
    uv_run(global_ctx->uv_loop, UV_RUN_DEFAULT);

    fprintf(stderr, "[Timer] Blocking event loop completed\n");
  } else {
    /* Run indefinitely */
    uv_run(global_ctx->uv_loop, UV_RUN_DEFAULT);
  }
}

/* ===== Helper: Get global context ===== */

fl_event_context_t* timer_get_context(void) {
  if (!global_ctx) {
    timer_event_loop_init();
  }
  return global_ctx;
}
