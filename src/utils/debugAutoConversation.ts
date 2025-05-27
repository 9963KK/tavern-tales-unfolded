/**
 * 自动对话调试工具
 */

export function logAutoConversationState(
  context: string,
  state: {
    isAutoConversationActive: boolean;
    messagesLength: number;
    autoConversationTimer: NodeJS.Timeout | null;
    thinkingCharacterId: string | null;
    charactersCount: number;
    activeSpeakerId: string | null;
  }
) {
  console.group(`🔍 自动对话状态检查 - ${context}`);
  console.log('📊 当前状态:', {
    自动对话激活: state.isAutoConversationActive ? '✅ 是' : '❌ 否',
    消息数量: state.messagesLength,
    有定时器: state.autoConversationTimer ? '⏰ 是' : '❌ 否',
    思考中角色: state.thinkingCharacterId || '❌ 无',
    激活发言者: state.activeSpeakerId || '❌ 无',
    角色总数: state.charactersCount,
  });
  
  // 分析问题
  const issues = [];
  if (!state.isAutoConversationActive) {
    issues.push('自动对话未激活');
  }
  if (state.messagesLength === 0) {
    issues.push('没有消息历史');
  }
  if (state.autoConversationTimer) {
    issues.push('已有定时器运行');
  }
  if (state.thinkingCharacterId) {
    issues.push('有角色正在思考');
  }
  if (state.charactersCount === 0) {
    issues.push('没有可用角色');
  }

  if (issues.length > 0) {
    console.warn('⚠️ 发现问题:', issues);
  } else {
    console.log('✅ 状态正常，应该能启动自动对话');
  }

  console.groupEnd();
}

export function createAutoConversationMonitor() {
  let lastState: any = null;
  
  return function monitor(context: string, newState: any) {
    // 只在状态变化时记录
    const stateStr = JSON.stringify({
      isAutoConversationActive: newState.isAutoConversationActive,
      messagesLength: newState.messagesLength,
      hasTimer: !!newState.autoConversationTimer,
      thinkingCharacterId: newState.thinkingCharacterId,
      charactersCount: newState.charactersCount,
    });
    
    if (lastState !== stateStr) {
      logAutoConversationState(context, newState);
      lastState = stateStr;
    }
  };
} 