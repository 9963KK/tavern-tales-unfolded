// 多响应功能调试工具
import { AICharacter, Message } from '@/types/tavern';
import { MultiResponseConfig, MultiResponsePlan } from '@/lib/multiResponseEvaluator';

export interface DebugInfo {
  timestamp: Date;
  mode: 'traditional' | 'single';
  playerMessage: string;
  selectedCharacters: string[];
  executionTime: number;
  errors: string[];
  success: boolean;
}

class MultiResponseDebugger {
  private debugHistory: DebugInfo[] = [];
  private isEnabled: boolean = false;

  enable() {
    this.isEnabled = true;
    console.log('🐛 多响应调试器已启用');
  }

  disable() {
    this.isEnabled = false;
    console.log('🐛 多响应调试器已禁用');
  }

  logExecution(
    mode: DebugInfo['mode'],
    playerMessage: string,
    selectedCharacters: string[],
    executionTime: number,
    errors: string[] = []
  ) {
    if (!this.isEnabled) return;

    const debugInfo: DebugInfo = {
      timestamp: new Date(),
      mode,
      playerMessage,
      selectedCharacters,
      executionTime,
      errors,
      success: errors.length === 0
    };

    this.debugHistory.push(debugInfo);
    
    console.log('🐛 多响应执行记录:', {
      模式: mode,
      玩家消息: playerMessage,
      选中角色: selectedCharacters,
      执行时间: `${executionTime}ms`,
      错误数量: errors.length,
      成功: debugInfo.success
    });

    // 保持最近50条记录
    if (this.debugHistory.length > 50) {
      this.debugHistory = this.debugHistory.slice(-50);
    }
  }

  getHistory(): DebugInfo[] {
    return [...this.debugHistory];
  }

  getStatistics() {
    const total = this.debugHistory.length;
    const successful = this.debugHistory.filter(d => d.success).length;
    const byMode = this.debugHistory.reduce((acc, d) => {
      acc[d.mode] = (acc[d.mode] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const avgExecutionTime = this.debugHistory.length > 0
      ? this.debugHistory.reduce((sum, d) => sum + d.executionTime, 0) / this.debugHistory.length
      : 0;

    return {
      总执行次数: total,
      成功次数: successful,
      成功率: total > 0 ? `${((successful / total) * 100).toFixed(1)}%` : '0%',
      模式分布: byMode,
      平均执行时间: `${avgExecutionTime.toFixed(0)}ms`,
      最近错误: this.debugHistory
        .filter(d => !d.success)
        .slice(-5)
        .map(d => ({
          时间: d.timestamp.toLocaleTimeString(),
          模式: d.mode,
          错误: d.errors
        }))
    };
  }

  clear() {
    this.debugHistory = [];
    console.log('🐛 调试历史已清空');
  }

  // 验证配置有效性
  validateConfig(config: MultiResponseConfig, characters: AICharacter[]): string[] {
    const issues: string[] = [];

    if (config.maxResponders > characters.length) {
      issues.push(`最大响应者数量(${config.maxResponders})超过角色总数(${characters.length})`);
    }

    if (config.responseThreshold < 0.1 || config.responseThreshold > 0.9) {
      issues.push(`响应阈值(${config.responseThreshold})应在0.1-0.9之间`);
    }

    if (config.responseInterval < 500 || config.responseInterval > 10000) {
      issues.push(`响应间隔(${config.responseInterval}ms)应在500-10000ms之间`);
    }

    return issues;
  }

  // 模拟多响应计划
  simulateResponsePlan(
    characters: AICharacter[],
    config: MultiResponseConfig,
    playerMessage: string
  ): { plan: Partial<MultiResponsePlan>; warnings: string[] } {
    const warnings: string[] = [];
    
    // 模拟候选者生成
    const mockCandidates = characters.map(char => ({
      characterId: char.id,
      characterName: char.name,
      responseScore: Math.random() * 0.8 + 0.2, // 0.2-1.0
      speakingDesire: Math.random(),
      topicRelevance: Math.random(),
      priority: 'normal' as const,
      reasoning: `模拟评分: ${Math.random().toFixed(3)}`
    }));

    // 模拟选择逻辑
    const selectedResponders = mockCandidates
      .filter(c => c.responseScore >= config.responseThreshold)
      .sort((a, b) => b.responseScore - a.responseScore)
      .slice(0, config.maxResponders);

    if (selectedResponders.length === 0) {
      warnings.push('没有角色达到响应阈值，将回退到单一响应模式');
    }

    if (selectedResponders.length === 1) {
      warnings.push('只有一个角色响应，建议降低响应阈值或检查角色配置');
    }

    const estimatedDuration = selectedResponders.length > 0
      ? (selectedResponders.length - 1) * config.responseInterval + 3000
      : 0;

    return {
      plan: {
        candidates: mockCandidates,
        selectedResponders,
        totalResponders: selectedResponders.length,
        estimatedDuration,
        shouldEnableMultiResponse: selectedResponders.length > 1
      },
      warnings
    };
  }
}

// 全局调试器实例
export const multiResponseDebugger = new MultiResponseDebugger();

// 开发环境下自动启用
if (process.env.NODE_ENV === 'development') {
  multiResponseDebugger.enable();
  
  // 添加到全局对象以便在控制台中使用
  (window as any).multiResponseDebugger = multiResponseDebugger;
}

export default multiResponseDebugger; 