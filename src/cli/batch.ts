/**
 * Phase 9.1: Batch Mode CLI
 *
 * 배치 모드: 파일 입력, 결과 저장
 */

import { interactiveMode } from './interactive';
import { dashboard } from '../dashboard/dashboard';

export interface BatchResult {
  input: string;
  fnName: string;
  confidence: number;
  action: 'approve' | 'reject' | 'modify';
  success: boolean;
  timestamp: Date;
}

export class BatchMode {
  private results: BatchResult[] = [];

  /**
   * 파일에서 입력 읽기
   */
  async readInputFile(filepath: string): Promise<string[]> {
    try {
      // 실제 구현에서는 fs를 사용
      // const fs = require('fs');
      // const content = fs.readFileSync(filepath, 'utf-8');
      // return content.split('\n').filter(line => line.trim());

      // 테스트용 목업
      return [];
    } catch (error) {
      throw new Error(`파일 읽기 실패: ${filepath}`);
    }
  }

  /**
   * 배치 처리
   */
  async processBatch(inputs: string[]): Promise<BatchResult[]> {
    this.results = [];

    for (const input of inputs) {
      if (!input.trim()) continue;

      const result = this.processInput(input);
      this.results.push(result);
    }

    return this.results;
  }

  /**
   * 개별 입력 처리
   */
  private processInput(input: string): BatchResult {
    try {
      // 실제로는 AutoHeaderEngine을 사용하여 제안 생성
      // 여기서는 목업
      const fnName = 'process';
      const confidence = 0.75;
      const action = 'approve';

      // 피드백 기록
      const success = interactiveMode.recordFeedback(
        input,
        fnName,
        action as 'approve' | 'reject' | 'modify'
      );

      return {
        input,
        fnName,
        confidence,
        action: action as 'approve' | 'reject' | 'modify',
        success,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        input,
        fnName: 'error',
        confidence: 0,
        action: 'reject',
        success: false,
        timestamp: new Date(),
      };
    }
  }

  /**
   * 결과 저장
   */
  async saveResults(filepath: string): Promise<boolean> {
    try {
      // 실제 구현에서는 fs를 사용
      // const fs = require('fs');
      // fs.writeFileSync(filepath, JSON.stringify(this.results, null, 2));

      // 테스트용
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 결과를 JSON 형식으로 내보내기
   */
  exportAsJSON(): string {
    return JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        total: this.results.length,
        successful: this.results.filter(r => r.success).length,
        results: this.results,
      },
      null,
      2
    );
  }

  /**
   * 결과를 CSV 형식으로 내보내기
   */
  exportAsCSV(): string {
    const headers = ['Input', 'FunctionName', 'Confidence', 'Action', 'Success', 'Timestamp'];
    const rows = this.results.map(r => [
      `"${r.input}"`,
      r.fnName,
      r.confidence.toFixed(2),
      r.action,
      r.success ? 'Yes' : 'No',
      r.timestamp.toISOString(),
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  /**
   * 결과 요약
   */
  summarize(): string {
    const total = this.results.length;
    const successful = this.results.filter(r => r.success).length;
    const approved = this.results.filter(r => r.action === 'approve').length;
    const rejected = this.results.filter(r => r.action === 'reject').length;
    const modified = this.results.filter(r => r.action === 'modify').length;

    return `
📊 배치 처리 결과

총계:
  • 처리됨: ${total}개
  • 성공: ${successful}개 (${total > 0 ? ((successful / total) * 100).toFixed(0) : 0}%)
  • 실패: ${total - successful}개

액션:
  • 승인: ${approved}개
  • 거부: ${rejected}개
  • 수정: ${modified}개

평균 신뢰도: ${
      this.results.length > 0
        ? (
            this.results.reduce((sum, r) => sum + r.confidence, 0) /
            this.results.length
          ).toFixed(2)
        : '0.00'
    }
    `;
  }

  /**
   * 초기화 (테스트용)
   */
  clear(): void {
    this.results = [];
  }
}

// 싱글톤 인스턴스
export const batchMode = new BatchMode();
