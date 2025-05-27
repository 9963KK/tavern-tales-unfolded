/**
 * 自动对话调试工具
 * 帮助诊断和修复自动对话启动问题
 */

export interface AutoConversationState {
  isAutoConversationActive: boolean;
  messagesLength: number;
  autoConversationTimer: NodeJS.Timeout | null;
  thinkingCharacterId: string | null;
  charactersCount: number;
  activeSpeakerId: string | null;
}

export interface DiagnosticResult {
  canStart: boolean;
  issues: string[];
  suggestions: string[];
  debugInfo: Record<string, any>;
}

/**
 * 诊断自动对话启动问题
 */
export function diagnoseAutoConversation(state: AutoConversationState): DiagnosticResult {
  const issues: string[] = [];
  const suggestions: string[] = [];
  
  // 检查各项条件
  if (!state.isAutoConversationActive) {
    issues.push('自动对话未激活');
    suggestions.push('点击头像区域的播放按钮激活自动对话');
  }
  
  if (state.messagesLength === 0) {
    issues.push('没有消息历史');
    suggestions.push('发送一条消息或等待AI角色的欢迎消息');
  }
  
  if (state.autoConversationTimer) {
    issues.push('存在残留定时器');
    suggestions.push('点击"强制重启对话"按钮清理定时器状态');
  }
  
  if (state.thinkingCharacterId) {
    issues.push('有角色正在思考中');
    suggestions.push('等待当前角色完成思考，或点击"强制重启对话"');
  }
  
  if (state.charactersCount === 0) {
    issues.push('没有可用角色');
    suggestions.push('生成新角色或重置会话');
  }
  
  const canStart = issues.length === 0;
  
  return {
    canStart,
    issues,
    suggestions,
    debugInfo: {
      条件检查: {
        自动对话激活: state.isAutoConversationActive ? '✅' : '❌',
        消息历史: state.messagesLength > 0 ? '✅' : '❌',
        无定时器: !state.autoConversationTimer ? '✅' : '❌',
        无思考角色: !state.thinkingCharacterId ? '✅' : '❌',
        有可用角色: state.charactersCount > 0 ? '✅' : '❌'
      },
      详细信息: {
        消息数量: state.messagesLength,
        角色数量: state.charactersCount,
        当前发言者: state.activeSpeakerId || '无',
        思考中角色: state.thinkingCharacterId || '无',
        定时器状态: state.autoConversationTimer ? '存在' : '不存在'
      }
    }
  };
}

/**
 * 生成修复建议
 */
export function generateFixSuggestions(diagnostic: DiagnosticResult): string[] {
  if (diagnostic.canStart) {
    return ['✅ 自动对话应该可以正常启动'];
  }
  
  const fixes = [
    '🔧 修复建议：',
    ...diagnostic.suggestions,
    '',
    '🚨 如果问题仍然存在：',
    '1. 点击"强制重启对话"按钮',
    '2. 刷新页面重新加载',
    '3. 检查浏览器控制台错误信息'
  ];
  
  return fixes;
}

/**
 * 自动对话状态监控器
 */
export class AutoConversationMonitor {
  private lastState: string = '';
  
  monitor(state: AutoConversationState): void {
    const stateKey = this.getStateKey(state);
    
    // 只在状态变化时输出诊断
    if (stateKey !== this.lastState) {
      const diagnostic = diagnoseAutoConversation(state);
      
      console.group('🔍 自动对话状态诊断');
      console.log('📊 当前状态:', diagnostic.debugInfo);
      
      if (!diagnostic.canStart) {
        console.warn('⚠️ 发现问题:', diagnostic.issues);
        console.log('💡 建议:', diagnostic.suggestions);
      } else {
        console.log('✅ 状态正常，可以启动自动对话');
      }
      
      console.groupEnd();
      this.lastState = stateKey;
    }
  }
  
  private getStateKey(state: AutoConversationState): string {
    return JSON.stringify({
      active: state.isAutoConversationActive,
      messages: state.messagesLength,
      hasTimer: !!state.autoConversationTimer,
      thinking: state.thinkingCharacterId,
      characters: state.charactersCount
    });
  }
}

/**
 * 全局监控器实例
 */
export const autoConversationMonitor = new AutoConversationMonitor();

/**
 * 控制台调试助手
 * 在浏览器控制台中使用：window.debugAutoConversation()
 */
export function setupDebugHelper(): void {
  if (typeof window !== 'undefined') {
    (window as any).debugAutoConversation = function() {
      console.log('🔧 自动对话调试助手');
      console.log('请在组件中调用 diagnoseAutoConversation() 获取详细诊断信息');
      console.log('或查看控制台中的自动诊断日志');
    };
  }
}

// 自动设置调试助手
setupDebugHelper(); 