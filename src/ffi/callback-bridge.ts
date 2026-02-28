/**
 * FreeLang FFI Callback Bridge
 * C 라이브러리의 콜백을 FreeLang VM과 연결
 */

/**
 * 콜백 컨텍스트 타입
 */
export interface CallbackContext {
  id: number;              // 콜백 ID
  functionName: string;    // FreeLang 함수명
  eventType: string;       // 이벤트 타입 (data, message, close, error 등)
  data?: any;              // 콜백 데이터
  timestamp: number;       // 호출 시간
}

/**
 * 콜백 큐
 * C 라이브러리에서 호출된 콜백을 큐에 넣고,
 * FreeLang VM이 메인 루프에서 처리
 */
export class CallbackQueue {
  private queue: CallbackContext[] = [];
  private handlers: Map<string, (ctx: CallbackContext) => void> = new Map();
  private idCounter: number = 0;

  /**
   * 콜백 등록
   */
  public registerHandler(
    eventType: string,
    handler: (ctx: CallbackContext) => void
  ): void {
    this.handlers.set(eventType, handler);
  }

  /**
   * 콜백 큐에 추가 (C 라이브러리에서 호출)
   */
  public enqueue(context: Omit<CallbackContext, 'id' | 'timestamp'>): number {
    const ctx: CallbackContext = {
      ...context,
      id: this.idCounter++,
      timestamp: Date.now()
    };

    this.queue.push(ctx);
    return ctx.id;
  }

  /**
   * 큐에서 콜백 처리
   */
  public processNext(): boolean {
    if (this.queue.length === 0) {
      return false;
    }

    const ctx = this.queue.shift();
    if (!ctx) return false;

    const handler = this.handlers.get(ctx.eventType);
    if (handler) {
      try {
        handler(ctx);
      } catch (error) {
        console.error(
          `❌ Error in callback handler (${ctx.eventType}):`,
          error
        );
      }
    }

    return true;
  }

  /**
   * 모든 콜백 처리
   */
  public processAll(): number {
    let count = 0;
    while (this.processNext()) {
      count++;
    }
    return count;
  }

  /**
   * 큐 크기
   */
  public size(): number {
    return this.queue.length;
  }

  /**
   * 큐 비우기
   */
  public clear(): void {
    this.queue = [];
  }
}

/**
 * 글로벌 콜백 큐
 */
export const globalCallbackQueue = new CallbackQueue();

/**
 * 콜백 브릿지 초기화
 * (이 함수는 FreeLang VM 시작 시 호출)
 */
export function initializeCallbackBridge(): void {
  console.log('🌉 Initializing FFI Callback Bridge...\n');

  // Stream 콜백
  globalCallbackQueue.registerHandler('stream:data', (ctx) => {
    console.log(`📨 Stream data received: ${ctx.data}`);
    // FreeLang 콜백 실행
    // vm.executeCallback(ctx.functionName, [ctx.data]);
  });

  // WebSocket 콜백
  globalCallbackQueue.registerHandler('ws:message', (ctx) => {
    console.log(`💬 WebSocket message: ${ctx.data}`);
    // vm.executeCallback(ctx.functionName, [ctx.data]);
  });

  globalCallbackQueue.registerHandler('ws:open', (ctx) => {
    console.log(`🔓 WebSocket opened`);
    // vm.executeCallback(ctx.functionName, []);
  });

  globalCallbackQueue.registerHandler('ws:close', (ctx) => {
    console.log(`🔒 WebSocket closed`);
    // vm.executeCallback(ctx.functionName, []);
  });

  globalCallbackQueue.registerHandler('ws:error', (ctx) => {
    console.error(`❌ WebSocket error: ${ctx.data}`);
    // vm.executeCallback(ctx.functionName, [ctx.data]);
  });

  // HTTP/2 콜백
  globalCallbackQueue.registerHandler('http2:data', (ctx) => {
    console.log(`📦 HTTP/2 data received: ${ctx.data}`);
    // vm.executeCallback(ctx.functionName, [ctx.data]);
  });

  globalCallbackQueue.registerHandler('http2:frame', (ctx) => {
    console.log(`📋 HTTP/2 frame received`);
    // vm.executeCallback(ctx.functionName, [ctx.data]);
  });

  // Timer 콜백
  globalCallbackQueue.registerHandler('timer:tick', (ctx) => {
    // console.log(`⏱️  Timer tick`);
    // vm.executeCallback(ctx.functionName, []);
  });

  console.log('✅ Callback Bridge initialized\n');
}

/**
 * 메인 루프에 통합되는 콜백 처리
 * (FreeLang VM의 이벤트 루프에서 주기적으로 호출)
 */
export function processCallbacks(): number {
  return globalCallbackQueue.processAll();
}

/**
 * 콜백 통계
 */
export function getCallbackStats(): {
  queueSize: number;
  handlersCount: number;
} {
  return {
    queueSize: globalCallbackQueue.size(),
    handlersCount: 0 // 핸들러 수는 내부적으로 관리
  };
}

/**
 * C 라이브러리가 호출하는 콜백 함수들
 * (이 함수들은 FFI를 통해 C 코드에서 호출됨)
 */

/**
 * Stream 데이터 콜백
 */
export function onStreamData(
  streamHandle: number,
  data: string
): number {
  return globalCallbackQueue.enqueue({
    functionName: `stream_${streamHandle}_ondata`,
    eventType: 'stream:data',
    data
  });
}

/**
 * WebSocket 메시지 콜백
 */
export function onWebSocketMessage(
  socketHandle: number,
  message: string
): number {
  return globalCallbackQueue.enqueue({
    functionName: `ws_${socketHandle}_onmessage`,
    eventType: 'ws:message',
    data: message
  });
}

/**
 * WebSocket 연결 열림 콜백
 */
export function onWebSocketOpen(socketHandle: number): number {
  return globalCallbackQueue.enqueue({
    functionName: `ws_${socketHandle}_onopen`,
    eventType: 'ws:open'
  });
}

/**
 * WebSocket 연결 닫힘 콜백
 */
export function onWebSocketClose(socketHandle: number): number {
  return globalCallbackQueue.enqueue({
    functionName: `ws_${socketHandle}_onclose`,
    eventType: 'ws:close'
  });
}

/**
 * WebSocket 에러 콜백
 */
export function onWebSocketError(
  socketHandle: number,
  error: string
): number {
  return globalCallbackQueue.enqueue({
    functionName: `ws_${socketHandle}_onerror`,
    eventType: 'ws:error',
    data: error
  });
}

/**
 * HTTP/2 데이터 콜백
 */
export function onHttp2Data(
  sessionHandle: number,
  data: string
): number {
  return globalCallbackQueue.enqueue({
    functionName: `http2_${sessionHandle}_ondata`,
    eventType: 'http2:data',
    data
  });
}

/**
 * Timer 틱 콜백
 */
export function onTimerTick(timerHandle: number): number {
  return globalCallbackQueue.enqueue({
    functionName: `timer_${timerHandle}_ontick`,
    eventType: 'timer:tick'
  });
}
