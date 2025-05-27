import { AICharacter } from '../types/character';
import { Message } from '../types/message';
import { SpeakingDesireResult } from './speakingDesire';

/**
 * 对话上下文状态枚举
 */
export enum ConversationPhase {
  OPENING = 'opening',        // 开场阶段
  WARMING = 'warming',        // 热身阶段
  ACTIVE = 'active',          // 活跃讨论
  TRANSITION = 'transition',  // 话题转换
  COOLING = 'cooling',        // 冷却阶段
  ENDING = 'ending'           // 结束阶段
}

/**
 * 对话上下文分析结果
 */
export interface ConversationContext {
  phase: ConversationPhase;
  intensity: number;          // 对话激烈程度 0-1
  recency: number;           // 最近活跃度 0-1
  playerEngagement: boolean;  // 玩家是否刚参与
  topicShift: boolean;       // 是否发生话题转换
  silenceDuration: number;   // 沉默持续时间(毫秒)
}

/**
 * 角色互动历史记录
 */
export interface InteractionHistory {
  characterId: string;
  recentSpeakCount: number;    // 最近发言次数
  consecutiveSilence: number;  // 连续沉默次数
  lastInteractionWith: string | null; // 最后互动的角色ID
}

/**
 * 动态阈值配置
 */
export interface DynamicThresholdConfig {
  base: number;
  phaseModifiers: Record<ConversationPhase, number>;
  playerEngagementModifier: number;
  silenceTimeModifier: number;
}

/**
 * 加权选择结果
 */
export interface WeightedSelectionResult {
  selectedIndex: number;
  probability: number;
  candidates: Array<{
    index: number;
    weight: number;
    probability: number;
  }>;
  reason: string;
}

/**
 * 默认动态阈值配置
 */
const DEFAULT_THRESHOLD_CONFIG: DynamicThresholdConfig = {
  base: 0.15,
  phaseModifiers: {
    [ConversationPhase.OPENING]: -0.1,   // 0.05 - 开场阶段大幅鼓励发言
    [ConversationPhase.WARMING]: -0.05,  // 0.10 - 热身阶段适度鼓励
    [ConversationPhase.ACTIVE]: 0.0,     // 0.15 - 标准阈值
    [ConversationPhase.TRANSITION]: -0.05, // 0.10 - 鼓励话题延续
    [ConversationPhase.COOLING]: 0.1,    // 0.25 - 允许适度休息
    [ConversationPhase.ENDING]: 0.2      // 0.35 - 容易结束但不过于严格
  },
  playerEngagementModifier: -0.05,  // 玩家参与后更积极鼓励发言
  silenceTimeModifier: 0.00005      // 减少沉默时间对阈值的影响
};

/**
 * 分析对话上下文状态
 */
export function analyzeConversationContext(
  messages: Message[],
  speakerHistory: string[],
  lastPlayerMessageTime?: number
): ConversationContext {
  if (messages.length === 0) {
    return {
      phase: ConversationPhase.OPENING,
      intensity: 0,
      recency: 0,
      playerEngagement: false,
      topicShift: false,
      silenceDuration: 0
    };
  }

  const recentMessages = messages.slice(-10);
  const currentTime = Date.now();
  const lastMessageTime = recentMessages[recentMessages.length - 1]?.timestamp || currentTime;
  const silenceDuration = currentTime - lastMessageTime;

  // 分析对话阶段
  let phase: ConversationPhase;
  if (messages.length <= 3) {
    phase = ConversationPhase.OPENING;
  } else if (messages.length <= 8) {
    phase = ConversationPhase.WARMING;
  } else if (silenceDuration > 60000) { // 1分钟以上沉默
    phase = ConversationPhase.ENDING;
  } else if (silenceDuration > 30000) { // 30秒以上沉默
    phase = ConversationPhase.COOLING;
  } else {
    // 根据最近发言频率判断
    const recentSpeakCount = recentMessages.length;
    const timeSpan = Math.max(currentTime - (recentMessages[0]?.timestamp || currentTime), 60000);
    const speakRate = (recentSpeakCount / timeSpan) * 60000; // 每分钟发言数
    
    if (speakRate > 3) {
      phase = ConversationPhase.ACTIVE;
    } else if (speakRate > 1) {
      phase = ConversationPhase.TRANSITION;
    } else {
      phase = ConversationPhase.COOLING;
    }
  }

  // 计算对话激烈程度
  const intensity = Math.min(recentMessages.length / 10, 1.0);

  // 计算最近活跃度
  const recency = Math.max(0, 1 - silenceDuration / 120000); // 2分钟内的活跃度

  // 检查玩家参与情况
  const playerEngagement = lastPlayerMessageTime 
    ? (currentTime - lastPlayerMessageTime) < 10000 // 10秒内玩家发言
    : false;

  // 简单的话题转换检测（基于发言者多样性）
  const recentSpeakers = speakerHistory.slice(-5);
  const uniqueRecentSpeakers = new Set(recentSpeakers).size;
  const topicShift = recentSpeakers.length > 3 && uniqueRecentSpeakers >= 3;

  return {
    phase,
    intensity,
    recency,
    playerEngagement,
    topicShift,
    silenceDuration
  };
}

/**
 * 计算动态沉默阈值
 */
export function calculateDynamicThreshold(
  context: ConversationContext,
  config: DynamicThresholdConfig = DEFAULT_THRESHOLD_CONFIG
): number {
  let threshold = config.base;

  // 应用对话阶段修正
  threshold += config.phaseModifiers[context.phase];

  // 玩家参与修正
  if (context.playerEngagement) {
    threshold += config.playerEngagementModifier;
  }

  // 沉默时间修正
  threshold += context.silenceDuration * config.silenceTimeModifier;

  // 限制在合理范围内
  return Math.max(0.05, Math.min(threshold, 0.8));
}

/**
 * 生成角色互动历史统计
 */
export function generateInteractionHistory(
  characters: AICharacter[],
  speakerHistory: string[]
): InteractionHistory[] {
  const recentHistory = speakerHistory.slice(-20);
  
  return characters.map(character => {
    const recentSpeakCount = recentHistory.filter(id => id === character.id).length;
    
    // 计算连续沉默次数
    let consecutiveSilence = 0;
    for (let i = recentHistory.length - 1; i >= 0; i--) {
      if (recentHistory[i] === character.id) break;
      consecutiveSilence++;
    }

    // 找到最后互动的角色
    let lastInteractionWith: string | null = null;
    const charSpeakIndex = recentHistory.lastIndexOf(character.id);
    if (charSpeakIndex > 0) {
      lastInteractionWith = recentHistory[charSpeakIndex - 1];
    } else if (charSpeakIndex === 0 && recentHistory.length > 1) {
      lastInteractionWith = recentHistory[1];
    }

    return {
      characterId: character.id,
      recentSpeakCount,
      consecutiveSilence,
      lastInteractionWith
    };
  });
}

/**
 * 加权随机选择算法
 */
export function weightedRandomSelection(
  desireResults: SpeakingDesireResult[],
  topCandidateCount: number = 3
): WeightedSelectionResult {
  // 过滤掉欲望分数过低的候选者
  const viableResults = desireResults.filter(result => result.desireScore > 0.1);
  
  if (viableResults.length === 0) {
    return {
      selectedIndex: 0,
      probability: 1.0,
      candidates: [],
      reason: '无可用候选者，选择第一个角色'
    };
  }

  // 选择前N名候选者
  const topCandidates = viableResults
    .map((result, originalIndex) => ({ ...result, originalIndex }))
    .sort((a, b) => b.desireScore - a.desireScore)
    .slice(0, Math.min(topCandidateCount, viableResults.length));

  // 计算权重（使用指数函数增强差异）
  const weights = topCandidates.map(candidate => 
    Math.pow(candidate.desireScore, 2) // 平方增强高分优势
  );
  
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  
  // 计算概率
  const probabilities = weights.map(weight => weight / totalWeight);
  
  // 执行加权随机选择
  const random = Math.random();
  let cumulativeProbability = 0;
  let selectedCandidate = topCandidates[0];
  let selectedProbability = probabilities[0];
  
  for (let i = 0; i < topCandidates.length; i++) {
    cumulativeProbability += probabilities[i];
    if (random <= cumulativeProbability) {
      selectedCandidate = topCandidates[i];
      selectedProbability = probabilities[i];
      break;
    }
  }

  return {
    selectedIndex: selectedCandidate.originalIndex,
    probability: selectedProbability,
    candidates: topCandidates.map((candidate, index) => ({
      index: candidate.originalIndex,
      weight: weights[index],
      probability: probabilities[index]
    })),
    reason: `加权随机选择：${topCandidates.length}名候选者中以${(selectedProbability * 100).toFixed(1)}%概率选中`
  };
}

/**
 * 反垄断检查：确保所有角色都有发言机会
 */
export function applyAntiMonopolyCheck(
  selectedIndex: number,
  characters: AICharacter[],
  interactionHistory: InteractionHistory[],
  desireResults: SpeakingDesireResult[]
): number {
  const selectedCharacter = characters[selectedIndex];
  const selectedHistory = interactionHistory[selectedIndex];

  // 检查是否存在长期被忽略的角色
  const neglectedCharacters = interactionHistory
    .map((history, index) => ({ history, index }))
    .filter(({ history }) => 
      history.consecutiveSilence > 15 && // 连续15次未发言
      history.recentSpeakCount === 0     // 最近完全没有发言
    )
    .sort((a, b) => b.history.consecutiveSilence - a.history.consecutiveSilence);

  if (neglectedCharacters.length > 0) {
    const mostNeglected = neglectedCharacters[0];
    const neglectedDesire = desireResults[mostNeglected.index];
    
    // 如果被忽略角色的欲望分数不是极低，就优先选择
    if (neglectedDesire.desireScore > 0.15) {
      console.log(`🎭 反垄断机制启动：优先选择被忽略的角色 ${characters[mostNeglected.index].name} (连续沉默${mostNeglected.history.consecutiveSilence}次)`);
      return mostNeglected.index;
    }
  }

  // 检查选中角色是否过于活跃
  if (selectedHistory.recentSpeakCount > 8) { // 最近发言超过8次
    console.log(`⚖️ 反垄断检查：${selectedCharacter.name} 最近发言过多(${selectedHistory.recentSpeakCount}次)，寻找替代角色`);
    
    // 寻找发言较少但欲望合理的角色
    const alternatives = interactionHistory
      .map((history, index) => ({ 
        history, 
        index, 
        desire: desireResults[index].desireScore,
        character: characters[index]
      }))
      .filter(({ history, desire, index }) => 
        index !== selectedIndex &&
        history.recentSpeakCount < selectedHistory.recentSpeakCount &&
        desire > 0.2
      )
      .sort((a, b) => b.desire - a.desire);

    if (alternatives.length > 0) {
      const alternative = alternatives[0];
      console.log(`🔄 选择替代角色：${alternative.character.name} (发言${alternative.history.recentSpeakCount}次，欲望${alternative.desire.toFixed(3)})`);
      return alternative.index;
    }
  }

  return selectedIndex;
}

/**
 * 主要的智能发言者选择算法
 * 综合考虑所有因素，选择最合适的发言者
 */
export interface OptimalSpeakerResult {
  selectedIndex: number;
  reason: string;
  shouldSilence: boolean;
  context: ConversationContext;
  threshold: number;
  selectionDetails: {
    candidates: number;
    methodUsed: string;
    probability?: number;
    alternatives?: Array<{
      index: number;
      score: number;
      name: string;
    }>;
  };
}

/**
 * 选择最优发言者的主函数
 */
export async function selectOptimalSpeaker(
  characters: AICharacter[],
  messages: Message[],
  speakerHistory: string[],
  desireResults: SpeakingDesireResult[],
  lastPlayerMessageTime?: number,
  thresholdConfig?: DynamicThresholdConfig
): Promise<OptimalSpeakerResult> {
  
  // 阶段1：分析对话上下文
  const context = analyzeConversationContext(messages, speakerHistory, lastPlayerMessageTime);
  console.log('🔍 对话上下文分析:', {
    阶段: context.phase,
    激烈程度: context.intensity.toFixed(2),
    活跃度: context.recency.toFixed(2),
    玩家参与: context.playerEngagement,
    话题转换: context.topicShift,
    沉默时长: `${Math.floor(context.silenceDuration / 1000)}秒`
  });

  // 阶段2：计算动态阈值
  const threshold = calculateDynamicThreshold(context, thresholdConfig);
  console.log(`🎯 动态沉默阈值: ${threshold.toFixed(3)} (基于${context.phase}阶段)`);

  // 阶段3：检查是否应该保持沉默
  const maxDesire = Math.max(...desireResults.map(r => r.desireScore));
  
  // 添加强制激活模式：如果沉默时间过长，强制降低阈值
  let adjustedThreshold = threshold;
  if (context.silenceDuration > 20000) { // 20秒以上沉默
    const silenceReduction = Math.min(0.4, context.silenceDuration / 50000); // 最多降低0.4
    adjustedThreshold = Math.max(0.05, threshold - silenceReduction);
    if (adjustedThreshold < threshold) {
      console.log(`⚡ 强制激活模式：沉默${Math.floor(context.silenceDuration/1000)}秒，阈值从${threshold.toFixed(3)}降低到${adjustedThreshold.toFixed(3)}`);
    }
  }
  
  if (maxDesire < adjustedThreshold) {
    return {
      selectedIndex: -1,
      reason: `所有角色发言欲望(最高${maxDesire.toFixed(3)})均低于动态阈值(${adjustedThreshold.toFixed(3)})，选择沉默`,
      shouldSilence: true,
      context,
      threshold: adjustedThreshold,
      selectionDetails: {
        candidates: 0,
        methodUsed: 'silence'
      }
    };
  }

  // 阶段4：生成互动历史统计
  const interactionHistory = generateInteractionHistory(characters, speakerHistory);

  // 阶段5：使用加权随机选择
  const weightedResult = weightedRandomSelection(desireResults, 3);
  let selectedIndex = weightedResult.selectedIndex;
  let methodUsed = 'weighted_random';
  let finalReason = weightedResult.reason;

  // 阶段6：应用反垄断检查
  const originalIndex = selectedIndex;
  selectedIndex = applyAntiMonopolyCheck(selectedIndex, characters, interactionHistory, desireResults);
  
  if (selectedIndex !== originalIndex) {
    methodUsed = 'anti_monopoly';
    finalReason = `反垄断机制调整：从${characters[originalIndex].name}改为${characters[selectedIndex].name}`;
  }

  // 阶段7：生成详细的选择信息
  const alternatives = desireResults
    .map((result, index) => ({
      index,
      score: result.desireScore,
      name: characters[index].name
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5); // 前5名候选者

  const result: OptimalSpeakerResult = {
    selectedIndex,
    reason: finalReason,
    shouldSilence: false,
    context,
    threshold,
    selectionDetails: {
      candidates: desireResults.filter(r => r.desireScore >= threshold).length,
      methodUsed,
      probability: weightedResult.probability,
      alternatives
    }
  };

  console.log('🎉 最优发言者选择完成:', {
    选中角色: characters[selectedIndex].name,
    选择方法: methodUsed,
    选择概率: weightedResult.probability ? `${(weightedResult.probability * 100).toFixed(1)}%` : 'N/A',
    合格候选者: result.selectionDetails.candidates,
    前三候选者: alternatives.slice(0, 3).map(a => `${a.name}(${a.score.toFixed(3)})`).join(', ')
  });

  return result;
}

/**
 * 简化的选择接口，保持向后兼容
 */
export async function smartSelectSpeaker(
  characters: AICharacter[],
  messages: Message[],
  speakerHistory: string[],
  desireResults: SpeakingDesireResult[],
  lastPlayerMessageTime?: number
): Promise<number> {
  const result = await selectOptimalSpeaker(
    characters,
    messages,
    speakerHistory,
    desireResults,
    lastPlayerMessageTime
  );
  
  return result.shouldSilence ? -1 : result.selectedIndex;
}

/**
 * 优化版智能发言者选择 - 支持@提及优先级
 */
export async function selectOptimalSpeakerWithMentions(
  messages: any[],
  characters: any[],
  recentSpeakerHistory: string[],
  lastPlayerMessageTime?: number,
  mentionedCharacters?: string[]
): Promise<{ selectedIndex: number; reason: string } | null> {
  if (characters.length === 0) return null;
  if (characters.length === 1) return { selectedIndex: 0, reason: "唯一角色" };

  console.log('🧠 开始@提及优化的智能发言者选择...');
  
  // 如果有@提及，优先处理被@的角色
  if (mentionedCharacters && mentionedCharacters.length > 0) {
    console.log('🎯 检测到@提及，优先处理:', mentionedCharacters);
    
    const mentionedCharacterIndices = mentionedCharacters
      .map(name => characters.findIndex(char => char.name === name))
      .filter(index => index !== -1);
    
    if (mentionedCharacterIndices.length > 0) {
      // 如果有多个被@的角色，使用智能算法从中选择最佳的
      if (mentionedCharacterIndices.length === 1) {
        const selectedIndex = mentionedCharacterIndices[0];
        console.log(`🎯 直接选择被@的角色: ${characters[selectedIndex].name}`);
        return { selectedIndex, reason: `被@提及 (${characters[selectedIndex].name})` };
      } else {
        // 多个被@角色，在其中智能选择
        const mentionedCharacters = mentionedCharacterIndices.map(i => characters[i]);
        const subResult = await selectOptimalSpeaker(
          messages, 
          mentionedCharacters, 
          recentSpeakerHistory, 
          lastPlayerMessageTime
        );
        
        if (subResult) {
          const originalIndex = mentionedCharacterIndices[subResult.selectedIndex];
          console.log(`🎯 从被@角色中智能选择: ${characters[originalIndex].name}`);
          return { selectedIndex: originalIndex, reason: `@提及+智能选择 (${characters[originalIndex].name})` };
        }
      }
    }
  }

  // 没有@提及或被@角色不可用，使用常规智能选择
  return selectOptimalSpeaker(messages, characters, recentSpeakerHistory, lastPlayerMessageTime);
} 