// 多AI响应评估系统 - 任务2.2
import { AICharacter, Message } from '@/types/tavern';
import { batchAnalyzeTopicRelevance, TopicAnalysisConfig } from './topicAnalysis';
import { batchCalculateSpeakingDesire } from './speakingDesire';

export interface MultiResponseConfig {
  maxResponders: number;           // 最大响应者数量 (动态设置为角色总数)
  responseThreshold: number;       // 响应阈值 (0-1)
  responseInterval: number;        // 响应间隔时间 (毫秒)
  enableMultiResponse: boolean;    // 是否启用多AI响应
  prioritizeMentioned: boolean;    // 是否优先处理@提及角色
}

export interface ResponseCandidate {
  characterId: string;
  characterName: string;
  responseScore: number;           // 综合响应评分
  speakingDesire: number;         // 发言欲望分数
  topicRelevance: number;         // 话题相关性
  priority: 'mentioned' | 'high' | 'normal' | 'low';
  reasoning: string;
}

export interface MultiResponsePlan {
  candidates: ResponseCandidate[];
  selectedResponders: ResponseCandidate[];
  totalResponders: number;
  estimatedDuration: number;      // 预估总响应时间 (毫秒)
  shouldEnableMultiResponse: boolean;
}

// 默认配置
export const defaultMultiResponseConfig: MultiResponseConfig = {
  maxResponders: 5, // 将根据实际角色数量动态调整
  responseThreshold: 0.4,
  responseInterval: 2000, // 恢复为2秒间隔，便于阅读
  enableMultiResponse: true,
  prioritizeMentioned: true,
};

/**
 * 评估多个AI角色的响应意愿
 * @param characters 所有AI角色
 * @param messages 对话历史
 * @param playerMessage 玩家消息内容
 * @param mentionedCharacters 被@提及的角色名列表
 * @param config 多响应配置
 * @param topicConfig 主题分析配置
 * @returns 多响应计划
 */
export async function evaluateMultipleAIResponses(
  characters: AICharacter[],
  messages: Message[],
  playerMessage: string,
  mentionedCharacters?: string[],
  config: MultiResponseConfig = defaultMultiResponseConfig,
  topicConfig?: TopicAnalysisConfig
): Promise<MultiResponsePlan> {
  
  console.log('🎭 开始多AI响应评估...');
  console.log(`📝 玩家消息: "${playerMessage}"`);
  console.log(`🎯 被@角色: ${mentionedCharacters?.join(', ') || '无'}`);
  console.log(`⚙️ 配置: 最大${config.maxResponders}位角色，阈值${config.responseThreshold}`);

  if (!config.enableMultiResponse || characters.length === 0) {
    return {
      candidates: [],
      selectedResponders: [],
      totalResponders: 0,
      estimatedDuration: 0,
      shouldEnableMultiResponse: false
    };
  }

  // 第一步：评估话题相关性（如果配置了topicConfig）
  let topicRelevanceResults = [];
  if (topicConfig && messages.length >= 2) {
    try {
      const contextMessages = [...messages, {
        id: 'temp_player_msg',
        sender: '玩家',
        text: playerMessage,
        isPlayer: true,
        timestamp: new Date()
      }];
      
      topicRelevanceResults = await batchAnalyzeTopicRelevance(
        contextMessages,
        characters,
        topicConfig
      );
      console.log('📊 话题相关性分析完成');
    } catch (error) {
      console.warn('⚠️ 话题相关性分析失败，使用默认评分:', error);
    }
  }

  // 第二步：计算发言欲望
  const speakingDesireResults = batchCalculateSpeakingDesire(characters, topicRelevanceResults);
  console.log('💭 发言欲望评估完成');

  // 第三步：生成响应候选者列表
  const candidates: ResponseCandidate[] = characters.map((character, index) => {
    const speakingDesire = speakingDesireResults[index]?.desireScore || 0.5;
    const topicRelevance = topicRelevanceResults.find(r => r.characterId === character.id)?.relevanceScore || 0.5;
    
    // 检查是否被@提及
    const isMentioned = mentionedCharacters?.some(name => 
      character.name.includes(name) || name.includes(character.name)
    ) || false;

    // 计算综合响应评分
    let responseScore = speakingDesire * 0.6 + topicRelevance * 0.4;
    
    // @提及加成
    if (isMentioned && config.prioritizeMentioned) {
      responseScore = Math.min(responseScore + 0.3, 1.0);
    }

    // 确定优先级
    let priority: ResponseCandidate['priority'];
    if (isMentioned) {
      priority = 'mentioned';
    } else if (responseScore >= 0.7) {
      priority = 'high';
    } else if (responseScore >= 0.4) {
      priority = 'normal';
    } else {
      priority = 'low';
    }

    const reasoning = generateCandidateReasoning(character, speakingDesire, topicRelevance, isMentioned, responseScore);

    return {
      characterId: character.id,
      characterName: character.name,
      responseScore,
      speakingDesire,
      topicRelevance,
      priority,
      reasoning
    };
  });

  // 第四步：选择响应者
  const selectedResponders = selectOptimalResponders(candidates, config);
  
  // 第五步：计算预估时间
  const estimatedDuration = selectedResponders.length > 0 
    ? (selectedResponders.length - 1) * config.responseInterval + 3000 // 基础响应时间3秒
    : 0;

  const plan: MultiResponsePlan = {
    candidates: candidates.sort((a, b) => b.responseScore - a.responseScore),
    selectedResponders,
    totalResponders: selectedResponders.length,
    estimatedDuration,
    shouldEnableMultiResponse: selectedResponders.length > 1
  };

  console.log('✅ 多AI响应评估完成:');
  console.log(`📋 候选者: ${candidates.length}位`);
  console.log(`✨ 选中响应者: ${selectedResponders.map(r => r.characterName).join(', ')}`);
  console.log(`⏱️ 预估时间: ${Math.floor(estimatedDuration / 1000)}秒`);

  return plan;
}

/**
 * 从候选者中选择最优响应者
 */
function selectOptimalResponders(
  candidates: ResponseCandidate[],
  config: MultiResponseConfig
): ResponseCandidate[] {
  // 按优先级和评分排序
  const sortedCandidates = candidates
    .filter(c => c.responseScore >= config.responseThreshold)
    .sort((a, b) => {
      // 优先级排序
      const priorityOrder = { mentioned: 0, high: 1, normal: 2, low: 3 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // 同优先级按评分排序
      return b.responseScore - a.responseScore;
    });

  // 选择前N位响应者
  const selected = sortedCandidates.slice(0, config.maxResponders);

  // 确保至少有一个@提及的角色（如果存在）
  const mentionedCandidates = sortedCandidates.filter(c => c.priority === 'mentioned');
  if (mentionedCandidates.length > 0 && selected.filter(s => s.priority === 'mentioned').length === 0) {
    // 替换评分最低的普通角色
    if (selected.length >= config.maxResponders) {
      selected[selected.length - 1] = mentionedCandidates[0];
    } else {
      selected.push(mentionedCandidates[0]);
    }
  }

  return selected;
}

/**
 * 生成候选者推理说明
 */
function generateCandidateReasoning(
  character: AICharacter,
  speakingDesire: number,
  topicRelevance: number,
  isMentioned: boolean,
  finalScore: number
): string {
  const parts: string[] = [];

  if (isMentioned) {
    parts.push('被玩家@提及');
  }

  if (speakingDesire > 0.7) {
    parts.push('发言欲望强烈');
  } else if (speakingDesire < 0.3) {
    parts.push('发言欲望较低');
  }

  if (topicRelevance > 0.7) {
    parts.push('对话题很感兴趣');
  } else if (topicRelevance < 0.3) {
    parts.push('对话题兴趣不大');
  }

  const baseReason = parts.length > 0 ? parts.join('，') : '中等参与意愿';
  return `${baseReason}。综合评分：${finalScore.toFixed(3)}`;
}

/**
 * 获取指定角色在响应计划中的序号
 */
export function getCharacterResponseOrder(
  characterId: string,
  plan: MultiResponsePlan
): number {
  const index = plan.selectedResponders.findIndex(r => r.characterId === characterId);
  return index === -1 ? -1 : index;
}

/**
 * 检查是否应该执行多响应
 */
export function shouldExecuteMultiResponse(plan: MultiResponsePlan): boolean {
  return plan.shouldEnableMultiResponse && plan.selectedResponders.length > 1;
} 