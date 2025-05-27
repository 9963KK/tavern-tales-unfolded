// 增强版发言欲望评分算法 - 任务1.3
import { AICharacter } from '@/types/tavern';
import { TopicRelevanceResult } from './topicAnalysis';
import { ConversationContext, InteractionHistory } from './smartSpeakerSelection';

export interface EnhancedSpeakingDesireResult {
  characterId: string;
  desireScore: number; // 0-1之间的发言欲望分数
  breakdown: {
    // 基础因子 (50%)
    talkativenessWeight: number;      // 健谈程度 15%
    topicRelevanceWeight: number;     // 主题相关性 20%
    emotionalStateWeight: number;     // 情绪状态 10%
    socialRoleWeight: number;         // 社交角色 5%
    
    // 上下文因子 (30%)
    conversationPhaseWeight: number;  // 对话阶段 10%
    speakingFrequencyWeight: number;  // 发言频率调整 10%
    characterRelationWeight: number;  // 角色关系 10%
    
    // 动态因子 (20%)
    randomnessWeight: number;         // 随机性 10%
    antiMonopolyWeight: number;       // 反垄断 10%
    
    finalScore: number;
  };
  reasoning: string;
  contextualFactors: {
    conversationPhase: string;
    recentSpeakCount: number;
    consecutiveSilence: number;
    lastInteractionWith: string | null;
  };
}

/**
 * 计算对话阶段加成
 */
function calculateConversationPhaseBonus(
  character: AICharacter,
  context: ConversationContext
): number {
  const personality = character.personality || {
    extroversion: 0.5,
    curiosity: 0.5,
    talkativeness: 0.5,
    reactivity: 0.5
  };

  switch (context.phase) {
    case 'opening':
      // 开场阶段：外向和健谈的角色更积极
      return (personality.extroversion + personality.talkativeness) / 2;
    
    case 'warming':
      // 热身阶段：好奇心强的角色更活跃
      return (personality.curiosity + personality.talkativeness) / 2;
    
    case 'active':
      // 活跃讨论：反应敏感的角色更容易参与
      return (personality.reactivity + personality.extroversion) / 2;
    
    case 'transition':
      // 话题转换：好奇心和外向性都重要
      return (personality.curiosity + personality.extroversion) / 2;
    
    case 'cooling':
      // 冷却阶段：健谈的角色可能试图重新激活对话
      return personality.talkativeness * 0.8; // 稍微降低
    
    case 'ending':
      // 结束阶段：大多数角色倾向于保持沉默
      return personality.talkativeness * 0.3; // 大幅降低
    
    default:
      return 0.5;
  }
}

/**
 * 计算发言频率调整因子
 */
function calculateSpeakingFrequencyAdjustment(
  character: AICharacter,
  interactionHistory: InteractionHistory
): number {
  const { recentSpeakCount, consecutiveSilence } = interactionHistory;
  
  // 基础分数
  let adjustment = 0.5;
  
  // 如果最近发言过多，降低欲望
  if (recentSpeakCount > 6) {
    adjustment = Math.max(0.1, 0.8 - (recentSpeakCount - 6) * 0.1);
  }
  // 如果最近发言适中，保持正常
  else if (recentSpeakCount >= 2 && recentSpeakCount <= 6) {
    adjustment = 0.6;
  }
  // 如果很少发言或长时间沉默，增加欲望
  else if (recentSpeakCount <= 1 || consecutiveSilence > 10) {
    adjustment = Math.min(0.9, 0.7 + consecutiveSilence * 0.02);
  }
  
  return adjustment;
}

/**
 * 计算角色关系影响
 */
function calculateCharacterRelationBonus(
  character: AICharacter,
  interactionHistory: InteractionHistory,
  allCharacters: AICharacter[]
): number {
  const { lastInteractionWith } = interactionHistory;
  
  // 如果没有最近的互动历史，返回中性值
  if (!lastInteractionWith) {
    return 0.5;
  }
  
  // 找到最后互动的角色
  const lastInteractedCharacter = allCharacters.find(c => c.id === lastInteractionWith);
  if (!lastInteractedCharacter) {
    return 0.5;
  }
  
  // 基于角色类型的互动倾向
  const currentRole = character.socialRole || 'customer';
  const lastRole = lastInteractedCharacter.socialRole || 'customer';
  
  // 角色互动矩阵（简化版）
  const interactionMatrix: Record<string, Record<string, number>> = {
    'host': {
      'customer': 0.8,    // 主人喜欢回应顾客
      'entertainer': 0.7, // 主人与娱乐者配合
      'observer': 0.6,    // 主人试图让观察者参与
      'authority': 0.7,   // 主人尊重权威
      'host': 0.5         // 主人之间中性
    },
    'entertainer': {
      'customer': 0.8,    // 娱乐者喜欢娱乐顾客
      'host': 0.7,        // 娱乐者配合主人
      'observer': 0.9,    // 娱乐者试图吸引观察者
      'authority': 0.6,   // 娱乐者对权威稍微谨慎
      'entertainer': 0.8  // 娱乐者之间互动频繁
    },
    'customer': {
      'host': 0.7,        // 顾客回应主人
      'entertainer': 0.6, // 顾客享受娱乐
      'authority': 0.5,   // 顾客对权威中性
      'observer': 0.4,    // 顾客较少主动找观察者
      'customer': 0.6     // 顾客之间正常互动
    },
    'observer': {
      'host': 0.4,        // 观察者较少主动回应主人
      'entertainer': 0.3, // 观察者较少回应娱乐者
      'customer': 0.3,    // 观察者较少回应顾客
      'authority': 0.6,   // 观察者可能回应权威
      'observer': 0.2     // 观察者之间很少互动
    },
    'authority': {
      'host': 0.6,        // 权威回应主人
      'entertainer': 0.5, // 权威对娱乐者中性
      'customer': 0.7,    // 权威愿意指导顾客
      'observer': 0.4,    // 权威较少主动找观察者
      'authority': 0.8    // 权威之间互动较多
    }
  };
  
  return interactionMatrix[currentRole]?.[lastRole] || 0.5;
}

/**
 * 计算反垄断调整因子
 */
function calculateAntiMonopolyAdjustment(
  character: AICharacter,
  interactionHistory: InteractionHistory,
  allInteractionHistories: InteractionHistory[]
): number {
  const { recentSpeakCount } = interactionHistory;
  
  // 计算所有角色的平均发言次数
  const totalSpeaks = allInteractionHistories.reduce((sum, history) => sum + history.recentSpeakCount, 0);
  const averageSpeaks = totalSpeaks / allInteractionHistories.length;
  
  // 如果该角色发言次数远超平均值，降低其发言欲望
  if (recentSpeakCount > averageSpeaks * 1.5) {
    return Math.max(0.1, 0.8 - (recentSpeakCount - averageSpeaks) * 0.1);
  }
  
  // 如果该角色发言次数远低于平均值，增加其发言欲望
  if (recentSpeakCount < averageSpeaks * 0.5) {
    return Math.min(0.9, 0.6 + (averageSpeaks - recentSpeakCount) * 0.05);
  }
  
  return 0.5; // 正常情况
}

/**
 * 增强版发言欲望计算
 */
export function calculateEnhancedSpeakingDesire(
  character: AICharacter,
  topicRelevance: TopicRelevanceResult,
  context: ConversationContext,
  interactionHistory: InteractionHistory,
  allCharacters: AICharacter[],
  allInteractionHistories: InteractionHistory[]
): EnhancedSpeakingDesireResult {
  const personality = character.personality || {
    extroversion: 0.5,
    curiosity: 0.5,
    talkativeness: 0.5,
    reactivity: 0.5
  };

  const emotionalState = character.emotionalState || 0;

  // 新的权重分配 - 更复杂的因子结构
  const weights = {
    // 基础因子 (50%)
    talkativeness: 0.15,
    topicRelevance: 0.20,
    emotionalState: 0.10,
    socialRole: 0.05,
    
    // 上下文因子 (30%)
    conversationPhase: 0.10,
    speakingFrequency: 0.10,
    characterRelation: 0.10,
    
    // 动态因子 (20%)
    randomness: 0.10,
    antiMonopoly: 0.10
  };

  // 计算各项分数
  const talkativenessScore = personality.talkativeness;
  const topicRelevanceScore = topicRelevance.relevanceScore;
  const emotionalStateScore = Math.max(0, (emotionalState + 1) / 2);
  const socialRoleScore = calculateSocialRoleBonus(character.socialRole);
  
  const conversationPhaseScore = calculateConversationPhaseBonus(character, context);
  const speakingFrequencyScore = calculateSpeakingFrequencyAdjustment(character, interactionHistory);
  const characterRelationScore = calculateCharacterRelationBonus(character, interactionHistory, allCharacters);
  
  const randomnessScore = 0.8 + Math.random() * 0.4; // 0.8-1.2的随机因子
  const antiMonopolyScore = calculateAntiMonopolyAdjustment(character, interactionHistory, allInteractionHistories);

  // 加权计算最终分数
  const weightedScore = 
    talkativenessScore * weights.talkativeness +
    topicRelevanceScore * weights.topicRelevance +
    emotionalStateScore * weights.emotionalState +
    socialRoleScore * weights.socialRole +
    conversationPhaseScore * weights.conversationPhase +
    speakingFrequencyScore * weights.speakingFrequency +
    characterRelationScore * weights.characterRelation +
    randomnessScore * weights.randomness +
    antiMonopolyScore * weights.antiMonopoly;

  const finalScore = Math.min(Math.max(weightedScore, 0), 1);

  // 生成详细推理
  const reasoning = generateEnhancedReasoning(
    character,
    topicRelevance,
    context,
    interactionHistory,
    {
      talkativenessScore,
      topicRelevanceScore,
      emotionalStateScore,
      socialRoleScore,
      conversationPhaseScore,
      speakingFrequencyScore,
      characterRelationScore,
      randomnessScore,
      antiMonopolyScore,
      finalScore
    }
  );

  return {
    characterId: character.id,
    desireScore: finalScore,
    breakdown: {
      talkativenessWeight: talkativenessScore * weights.talkativeness,
      topicRelevanceWeight: topicRelevanceScore * weights.topicRelevance,
      emotionalStateWeight: emotionalStateScore * weights.emotionalState,
      socialRoleWeight: socialRoleScore * weights.socialRole,
      conversationPhaseWeight: conversationPhaseScore * weights.conversationPhase,
      speakingFrequencyWeight: speakingFrequencyScore * weights.speakingFrequency,
      characterRelationWeight: characterRelationScore * weights.characterRelation,
      randomnessWeight: randomnessScore * weights.randomness,
      antiMonopolyWeight: antiMonopolyScore * weights.antiMonopoly,
      finalScore
    },
    reasoning,
    contextualFactors: {
      conversationPhase: context.phase,
      recentSpeakCount: interactionHistory.recentSpeakCount,
      consecutiveSilence: interactionHistory.consecutiveSilence,
      lastInteractionWith: interactionHistory.lastInteractionWith
    }
  };
}

/**
 * 计算社交角色加成（复用原有函数）
 */
function calculateSocialRoleBonus(socialRole?: string): number {
  const roleBonus = {
    'host': 0.8,
    'entertainer': 0.7,
    'authority': 0.6,
    'customer': 0.4,
    'observer': 0.2
  };
  
  return roleBonus[socialRole as keyof typeof roleBonus] || 0.5;
}

/**
 * 生成增强版推理说明
 */
function generateEnhancedReasoning(
  character: AICharacter,
  topicRelevance: TopicRelevanceResult,
  context: ConversationContext,
  interactionHistory: InteractionHistory,
  scores: any
): string {
  const parts: string[] = [];

  // 基础因子
  if (scores.talkativenessScore > 0.7) {
    parts.push('个性健谈');
  } else if (scores.talkativenessScore < 0.3) {
    parts.push('性格内向');
  }

  if (scores.topicRelevanceScore > 0.7) {
    parts.push('对话题很感兴趣');
  } else if (scores.topicRelevanceScore < 0.3) {
    parts.push('对话题兴趣不大');
  }

  // 上下文因子
  parts.push(`当前${context.phase}阶段`);
  
  if (interactionHistory.recentSpeakCount > 6) {
    parts.push('最近发言较多');
  } else if (interactionHistory.consecutiveSilence > 10) {
    parts.push('长时间沉默');
  }

  if (interactionHistory.lastInteractionWith) {
    parts.push('刚有角色互动');
  }

  // 社交角色
  const role = character.socialRole;
  if (role === 'host') {
    parts.push('主人身份');
  } else if (role === 'entertainer') {
    parts.push('娱乐者角色');
  } else if (role === 'observer') {
    parts.push('观察者性格');
  }

  const baseReason = parts.join('，');
  return `${baseReason}。综合评分：${scores.finalScore.toFixed(3)}`;
}

/**
 * 批量计算增强版发言欲望
 */
export function batchCalculateEnhancedSpeakingDesire(
  characters: AICharacter[],
  topicRelevanceResults: TopicRelevanceResult[],
  context: ConversationContext,
  allInteractionHistories: InteractionHistory[]
): EnhancedSpeakingDesireResult[] {
  return characters.map((character, index) => {
    const topicRelevance = topicRelevanceResults.find(
      result => result.characterId === character.id
    ) || {
      characterId: character.id,
      relevanceScore: 0.5,
      reasoningBrief: '未分析主题相关性'
    };

    const interactionHistory = allInteractionHistories[index];

    return calculateEnhancedSpeakingDesire(
      character,
      topicRelevance,
      context,
      interactionHistory,
      characters,
      allInteractionHistories
    );
  });
} 