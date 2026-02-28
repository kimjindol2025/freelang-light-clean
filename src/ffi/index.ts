/**
 * FreeLang FFI Module Index
 * 모든 FFI 모듈을 통합 export
 */

// Type bindings
export * from './type-bindings';

// Registry
export { FFIRegistry, ffiRegistry, initializeFFI, callFFIFunction } from './registry';

// Callback bridge
export {
  CallbackContext,
  CallbackQueue,
  globalCallbackQueue,
  initializeCallbackBridge,
  processCallbacks,
  getCallbackStats,
  onStreamData,
  onWebSocketMessage,
  onWebSocketOpen,
  onWebSocketClose,
  onWebSocketError,
  onHttp2Data,
  onTimerTick
} from './callback-bridge';

// Loader
export { FFILoader, ffiLoader, setupFFI, handleFFICallbacks } from './loader';

/**
 * FFI 통합 초기화
 * FreeLang VM 시작 시 호출해야 함
 *
 * 사용법:
 * ```typescript
 * import { initializeFFISystem } from './ffi';
 *
 * // VM 시작
 * const vm = createVM();
 *
 * // FFI 초기화
 * initializeFFISystem(vm);
 *
 * // 메인 루프
 * while (running) {
 *   vm.executeNextInstruction();
 *   handleFFICallbacks();
 * }
 * ```
 */
export function initializeFFISystem(vmInstance: any): boolean {
  return setupFFI(vmInstance);
}
