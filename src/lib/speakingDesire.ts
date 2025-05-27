// 发言欲望评分算法
import { AICharacter } from '@/types/tavern';
import { TopicRelevanceResult } from './topicAnalysis';

export interface SpeakingDesireResult {
  characterId: string;
  desireScore: number; // 0-1之间的发言欲望分数
  breakdown: {
    talkativenessWeight: number;
    topicRelevanceWeight: number;
    emotionalStateWeight: number;
    socialRoleBonus: number;
    finalScore: number;
  };
  reasoning: string;
}

/**
 * 计算角色的社交角色加成
 * @param socialRole 角色的社交角色
 * @returns 社交角色加成分数 (0-1)
 */
function calculateSocialRoleBonus(socialRole?: string): number {
  const roleBonus = {
    'host': 0.8,        // 主人最积极
    'entertainer': 0.7, // 娱乐者很积极
    'authority': 0.6,   // 权威人士中等积极
    'customer': 0.4,    // 顾客较被动
    'observer': 0.2     // 观察者最被动
  };
  
  return roleBonus[socialRole as keyof typeof roleBonus] || 0.5; // 默认值
}

/**
 * 计算单个角色的发言欲望分数
 * @param character 角色信息
 * @param topicRelevance 主题相关性分析结果
 * @returns 发言欲望评分结果
 */
export function calculateSpeakingDesire(
  character: AICharacter,
  topicRelevance: TopicRelevanceResult
): SpeakingDesireResult {
  const personality = character.personality || {
    extroversion: 0.5,
    curiosity: 0.5,
    talkativeness: 0.5,
    reactivity: 0.5
  };

  const emotionalState = character.emotionalState || 0; // 默认中性状态

  // 各因素权重分配
  const weights = {
    talkativeness: 0.30,      // 健谈程度权重 30%
    topicRelevance: 0.40,     // 主题相关性权重 40%
    emotionalState: 0.20,     // 情绪状态权重 20%
    socialRole: 0.10          // 社交角色加成权重 10%
  };

  // 计算各项分数
  const talkativenessScore = personality.talkativeness;
  const topicRelevanceScore = topicRelevance.relevanceScore;
  
  // 情绪状态影响：正面情绪增加发言欲望，负面情绪降低发言欲望
  // emotionalState范围 -1到1，转换为0-1的权重
  const emotionalStateScore = Math.max(0, (emotionalState + 1) / 2);
  
  const socialRoleBonus = calculateSocialRoleBonus(character.socialRole);

  // 加权计算最终分数
  const weightedScore = 
    talkativenessScore * weights.talkativeness +
    topicRelevanceScore * weights.topicRelevance +
    emotionalStateScore * weights.emotionalState +
    socialRoleBonus * weights.socialRole;

  // 确保分数在0-1范围内
  const finalScore = Math.min(Math.max(weightedScore, 0), 1);

  // 生成推理说明
  const reasoning = generateDesireReasoning(
    character,
    topicRelevance,
    {
      talkativenessScore,
      topicRelevanceScore,
      emotionalStateScore,
      socialRoleBonus,
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
      socialRoleBonus: socialRoleBonus * weights.socialRole,
      finalScore
    },
    reasoning
  };
}

/**
 * 生成发言欲望的推理说明
 */
function generateDesireReasoning(
  character: AICharacter,
  topicRelevance: TopicRelevanceResult,
  scores: {
    talkativenessScore: number;
    topicRelevanceScore: number;
    emotionalStateScore: number;
    socialRoleBonus: number;
    finalScore: number;
  }
): string {
  const parts: string[] = [];

  // 健谈程度
  if (scores.talkativenessScore > 0.7) {
    parts.push('个性健谈');
  } else if (scores.talkativenessScore < 0.3) {
    parts.push('性格内向');
  }

  // 主题相关性
  if (scores.topicRelevanceScore > 0.7) {
    parts.push('对话题很感兴趣');
  } else if (scores.topicRelevanceScore < 0.3) {
    parts.push('对话题兴趣不大');
  } else {
    parts.push('对话题有一定兴趣');
  }

  // 社交角色
  const role = character.socialRole;
  if (role === 'host') {
    parts.push('作为主人有义务活跃氛围');
  } else if (role === 'entertainer') {
    parts.push('作为娱乐者喜欢表现');
  } else if (role === 'observer') {
    parts.push('倾向于观察而非发言');
  }

  // 情绪状态
  const emotion = character.emotionalState || 0;
  if (emotion > 0.3) {
    parts.push('情绪积极');
  } else if (emotion < -0.3) {
    parts.push('情绪低落');
  }

  const baseReason = parts.join('，');
  return `${baseReason}。综合评分：${scores.finalScore.toFixed(2)}`;
}

/**
 * 批量计算多个角色的发言欲望
 * @param characters 角色列表
 * @param topicRelevanceResults 主题相关性分析结果
 * @returns 所有角色的发言欲望评分结果
 */
export function batchCalculateSpeakingDesire(
  characters: AICharacter[],
  topicRelevanceResults: TopicRelevanceResult[]
): SpeakingDesireResult[] {
  return characters.map(character => {
    // 找到对应的主题相关性结果
    const topicRelevance = topicRelevanceResults.find(
      result => result.characterId === character.id
    );

    // 如果找不到主题相关性结果，使用默认值
    const defaultTopicRelevance: TopicRelevanceResult = {
      characterId: character.id,
      relevanceScore: 0.5, // 中等兴趣
      reasoningBrief: '未分析主题相关性'
    };

    return calculateSpeakingDesire(
      character,
      topicRelevance || defaultTopicRelevance
    );
  });
}

/**
 * 检查是否应该保持沉默
 * @param desireResults 所有角色的发言欲望结果
 * @param silenceThreshold 沉默阈值（默认0.3）
 * @returns 是否应该保持沉默
 */
export function shouldRemainSilent(
  desireResults: SpeakingDesireResult[],
  silenceThreshold: number = 0.3
): boolean {
  // 如果所有角色的发言欲望都低于阈值，则保持沉默
  const maxDesire = Math.max(...desireResults.map(result => result.desireScore));
  return maxDesire < silenceThreshold;
}

/**
 * 根据发言欲望选择下一个发言者
 * @param desireResults 所有角色的发言欲望结果
 * @param randomFactor 随机因素权重（0-1，默认0.3）
 * @returns 选中的角色索引，如果应该保持沉默则返回-1
 */
export function selectSpeakerByDesire(
  characters: AICharacter[],
  desireResults: SpeakingDesireResult[],
  randomFactor: number = 0.3
): number {
  // 检查是否应该保持沉默
  if (shouldRemainSilent(desireResults)) {
    return -1; // 表示保持沉默
  }

  // 为每个角色计算最终权重（欲望分数 + 随机因素）
  const weightedCharacters = desireResults.map((result, index) => {
    const randomBonus = Math.random() * randomFactor;
    const finalWeight = result.desireScore * (1 - randomFactor) + randomBonus;
    
    return {
      index,
      characterId: result.characterId,
      weight: finalWeight,
      desireScore: result.desireScore
    };
  });

  // 按权重排序，选择权重最高的角色
  weightedCharacters.sort((a, b) => b.weight - a.weight);
  
  return weightedCharacters[0].index;
} 