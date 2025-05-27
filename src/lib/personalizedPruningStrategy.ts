import { Message } from '../types/message';
import { AICharacter } from '../types/character';
import { MessageImportance, PruningConfig } from './dynamicContextPruner';
import { TopicRelevanceAnalyzer, TopicInfo } from './topicRelevanceAnalyzer';

// 角色裁剪偏好接口
export interface CharacterPruningPreferences {
  memoryImportance: number;      // 记忆重要性权重 (0-1)
  topicFocus: number;           // 话题专注度 (0-1)
  socialWeight: number;         // 社交互动权重 (0-1)
  emotionalSensitivity: number; // 情感敏感度 (0-1)
  contextDepth: number;         // 上下文深度偏好 (0-1)
  personalityTraits: {
    introversion: number;       // 内向性 (0-1, 0=外向, 1=内向)
    openness: number;          // 开放性 (0-1)
    conscientiousness: number; // 尽责性 (0-1)
    agreeableness: number;     // 宜人性 (0-1)
    neuroticism: number;       // 神经质 (0-1)
  };
}

// 个性化权重计算结果
export interface PersonalizedWeights {
  characterId: string;
  messageWeights: Map<string, number>; // 消息ID -> 个性化权重
  topicWeights: Map<string, number>;   // 话题ID -> 权重
  relationshipWeights: Map<string, number>; // 其他角色ID -> 关系权重
  temporalWeights: {
    recentBonus: number;
    memoryDecay: number;
    importantMomentBonus: number;
  };
}

// 个性化保留策略结果
export interface PersonalizedRetentionResult {
  mustRetainMessages: string[];     // 必须保留的消息ID
  preferRetainMessages: string[];   // 优先保留的消息ID
  canPruneMessages: string[];       // 可以裁剪的消息ID
  retentionReasons: Map<string, string[]>; // 消息ID -> 保留原因
}

// 动态阈值配置
export interface DynamicThresholds {
  baseThreshold: number;
  activityMultiplier: number;
  tokenUsageMultiplier: number;
  participationBalance: number;
  adaptiveLearningRate: number;
}

// 个性化裁剪策略类
export class PersonalizedPruningStrategy {
  private topicAnalyzer: TopicRelevanceAnalyzer;
  private characterPreferences: Map<string, CharacterPruningPreferences>;
  private relationshipMatrix: Map<string, Map<string, number>>; // 角色关系矩阵
  private conversationHistory: Map<string, Message[]>; // 角色对话历史
  private dynamicThresholds: DynamicThresholds;
  private learningData: Map<string, any>; // 学习数据存储

  constructor() {
    this.topicAnalyzer = new TopicRelevanceAnalyzer();
    this.characterPreferences = new Map();
    this.relationshipMatrix = new Map();
    this.conversationHistory = new Map();
    this.learningData = new Map();
    
    this.dynamicThresholds = {
      baseThreshold: 0.5,
      activityMultiplier: 1.2,
      tokenUsageMultiplier: 0.8,
      participationBalance: 1.0,
      adaptiveLearningRate: 0.1
    };
  }

  /**
   * 初始化角色裁剪偏好
   */
  initializeCharacterPreferences(character: AICharacter): CharacterPruningPreferences {
    // 基于角色性格生成默认偏好
    const preferences: CharacterPruningPreferences = {
      memoryImportance: this.calculateMemoryImportance(character),
      topicFocus: this.calculateTopicFocus(character),
      socialWeight: this.calculateSocialWeight(character),
      emotionalSensitivity: this.calculateEmotionalSensitivity(character),
      contextDepth: this.calculateContextDepth(character),
      personalityTraits: this.extractPersonalityTraits(character)
    };

    this.characterPreferences.set(character.id, preferences);
    return preferences;
  }

  /**
   * 计算个性化权重
   */
  calculatePersonalizedWeights(
    character: AICharacter,
    messages: Message[],
    importanceScores: MessageImportance[],
    currentTopics: TopicInfo[]
  ): PersonalizedWeights {
    const preferences = this.getOrCreatePreferences(character);
    const messageWeights = new Map<string, number>();
    const topicWeights = new Map<string, number>();
    const relationshipWeights = new Map<string, number>();

    // 1. 计算消息个性化权重
    for (const [index, message] of messages.entries()) {
      const importance = importanceScores[index];
      let personalizedWeight = importance.finalScore;

      // 应用角色特定的权重调整
      personalizedWeight *= this.applyCharacterSpecificWeights(
        message,
        character,
        preferences
      );

      // 应用关系权重
      personalizedWeight *= this.applyRelationshipWeights(
        message,
        character,
        preferences
      );

      // 应用情感权重
      personalizedWeight *= this.applyEmotionalWeights(
        message,
        character,
        preferences
      );

      messageWeights.set(message.id, personalizedWeight);
    }

    // 2. 计算话题权重
    for (const topic of currentTopics) {
      const topicWeight = this.calculateTopicWeight(topic, character, preferences);
      topicWeights.set(topic.id, topicWeight);
    }

    // 3. 计算关系权重
    const relationships = this.getCharacterRelationships(character.id);
    for (const [otherId, relationshipStrength] of relationships.entries()) {
      const weight = this.calculateRelationshipWeight(
        relationshipStrength,
        preferences
      );
      relationshipWeights.set(otherId, weight);
    }

    // 4. 计算时间权重
    const temporalWeights = this.calculateTemporalWeights(character, preferences);

    return {
      characterId: character.id,
      messageWeights,
      topicWeights,
      relationshipWeights,
      temporalWeights
    };
  }

  /**
   * 实现个性化保留策略
   */
  implementPersonalizedRetention(
    character: AICharacter,
    messages: Message[],
    personalizedWeights: PersonalizedWeights,
    config: PruningConfig
  ): PersonalizedRetentionResult {
    const mustRetainMessages: string[] = [];
    const preferRetainMessages: string[] = [];
    const canPruneMessages: string[] = [];
    const retentionReasons = new Map<string, string[]>();

    const preferences = this.getOrCreatePreferences(character);

    for (const message of messages) {
      const reasons: string[] = [];
      const weight = personalizedWeights.messageWeights.get(message.id) || 0;

      // 1. 检查必须保留的条件
      if (this.mustRetainMessage(message, character, preferences, reasons)) {
        mustRetainMessages.push(message.id);
      }
      // 2. 检查优先保留的条件
      else if (this.shouldPreferRetain(message, character, preferences, weight, reasons)) {
        preferRetainMessages.push(message.id);
      }
      // 3. 其他消息可以裁剪
      else {
        canPruneMessages.push(message.id);
        reasons.push('权重较低，可以裁剪');
      }

      retentionReasons.set(message.id, reasons);
    }

    return {
      mustRetainMessages,
      preferRetainMessages,
      canPruneMessages,
      retentionReasons
    };
  }

  /**
   * 动态阈值调整
   */
  adjustDynamicThresholds(
    conversationActivity: number,
    tokenUsage: number,
    participationBalance: number,
    userFeedback?: number
  ): void {
    const { adaptiveLearningRate } = this.dynamicThresholds;

    // 基于对话活跃度调整
    if (conversationActivity > 0.8) {
      this.dynamicThresholds.activityMultiplier += adaptiveLearningRate * 0.1;
    } else if (conversationActivity < 0.3) {
      this.dynamicThresholds.activityMultiplier -= adaptiveLearningRate * 0.1;
    }

    // 基于token使用情况调整
    if (tokenUsage > 0.9) {
      this.dynamicThresholds.tokenUsageMultiplier -= adaptiveLearningRate * 0.2;
    } else if (tokenUsage < 0.5) {
      this.dynamicThresholds.tokenUsageMultiplier += adaptiveLearningRate * 0.1;
    }

    // 基于参与度平衡调整
    this.dynamicThresholds.participationBalance = 
      this.dynamicThresholds.participationBalance * (1 - adaptiveLearningRate) +
      participationBalance * adaptiveLearningRate;

    // 基于用户反馈调整
    if (userFeedback !== undefined) {
      const feedbackAdjustment = (userFeedback - 0.5) * adaptiveLearningRate * 0.3;
      this.dynamicThresholds.baseThreshold += feedbackAdjustment;
    }

    // 确保阈值在合理范围内
    this.dynamicThresholds.baseThreshold = Math.max(0.1, Math.min(0.9, this.dynamicThresholds.baseThreshold));
    this.dynamicThresholds.activityMultiplier = Math.max(0.5, Math.min(2.0, this.dynamicThresholds.activityMultiplier));
    this.dynamicThresholds.tokenUsageMultiplier = Math.max(0.3, Math.min(1.5, this.dynamicThresholds.tokenUsageMultiplier));
  }

  // ===== 私有辅助方法 =====

  /**
   * 获取或创建角色偏好
   */
  private getOrCreatePreferences(character: AICharacter): CharacterPruningPreferences {
    let preferences = this.characterPreferences.get(character.id);
    if (!preferences) {
      preferences = this.initializeCharacterPreferences(character);
    }
    return preferences;
  }

  /**
   * 计算记忆重要性
   */
  private calculateMemoryImportance(character: AICharacter): number {
    // 基于角色背景和性格计算记忆重要性
    const backgroundComplexity = character.background.length / 500; // 归一化
    const personalityDepth = character.personality.length / 300; // 归一化
    
    return Math.min((backgroundComplexity + personalityDepth) / 2, 1.0);
  }

  /**
   * 计算话题专注度
   */
  private calculateTopicFocus(character: AICharacter): number {
    // 基于角色描述中的专业领域关键词
    const focusKeywords = ['专家', '学者', '研究', '专业', '精通', '擅长'];
    let focusScore = 0.5; // 默认中等专注度
    
    const description = `${character.personality} ${character.background}`.toLowerCase();
    for (const keyword of focusKeywords) {
      if (description.includes(keyword)) {
        focusScore += 0.1;
      }
    }
    
    return Math.min(focusScore, 1.0);
  }

  /**
   * 计算社交权重
   */
  private calculateSocialWeight(character: AICharacter): number {
    // 基于角色性格中的社交倾向
    const socialKeywords = ['友好', '开朗', '外向', '热情', '善于交流', '社交'];
    const introvertKeywords = ['内向', '安静', '独立', '沉默', '害羞'];
    
    let socialScore = 0.5;
    const personality = character.personality.toLowerCase();
    
    for (const keyword of socialKeywords) {
      if (personality.includes(keyword)) {
        socialScore += 0.15;
      }
    }
    
    for (const keyword of introvertKeywords) {
      if (personality.includes(keyword)) {
        socialScore -= 0.1;
      }
    }
    
    return Math.max(0.1, Math.min(socialScore, 1.0));
  }

  /**
   * 计算情感敏感度
   */
  private calculateEmotionalSensitivity(character: AICharacter): number {
    const emotionalKeywords = ['敏感', '情感', '感性', '温柔', '体贴', '共情'];
    const rationalKeywords = ['理性', '冷静', '逻辑', '客观', '分析'];
    
    let emotionalScore = 0.5;
    const description = `${character.personality} ${character.background}`.toLowerCase();
    
    for (const keyword of emotionalKeywords) {
      if (description.includes(keyword)) {
        emotionalScore += 0.15;
      }
    }
    
    for (const keyword of rationalKeywords) {
      if (description.includes(keyword)) {
        emotionalScore -= 0.1;
      }
    }
    
    return Math.max(0.1, Math.min(emotionalScore, 1.0));
  }

  /**
   * 计算上下文深度偏好
   */
  private calculateContextDepth(character: AICharacter): number {
    // 基于角色的复杂性和背景深度
    const complexityIndicators = ['复杂', '深刻', '哲学', '思考', '分析', '研究'];
    const simplicityIndicators = ['简单', '直接', '明了', '快速', '效率'];
    
    let depthScore = 0.5;
    const description = `${character.personality} ${character.background}`.toLowerCase();
    
    for (const indicator of complexityIndicators) {
      if (description.includes(indicator)) {
        depthScore += 0.1;
      }
    }
    
    for (const indicator of simplicityIndicators) {
      if (description.includes(indicator)) {
        depthScore -= 0.1;
      }
    }
    
    return Math.max(0.2, Math.min(depthScore, 1.0));
  }

  /**
   * 提取性格特征
   */
  private extractPersonalityTraits(character: AICharacter): CharacterPruningPreferences['personalityTraits'] {
    const description = `${character.personality} ${character.background}`.toLowerCase();
    
    return {
      introversion: this.extractTrait(description, ['内向', '安静', '独立'], ['外向', '开朗', '社交']),
      openness: this.extractTrait(description, ['开放', '创新', '好奇'], ['保守', '传统', '固执']),
      conscientiousness: this.extractTrait(description, ['认真', '负责', '细心'], ['随意', '粗心', '懒散']),
      agreeableness: this.extractTrait(description, ['友好', '合作', '善良'], ['冷漠', '竞争', '自私']),
      neuroticism: this.extractTrait(description, ['敏感', '焦虑', '情绪化'], ['稳定', '冷静', '平和'])
    };
  }

  /**
   * 提取特定性格特征
   */
  private extractTrait(description: string, positiveKeywords: string[], negativeKeywords: string[]): number {
    let score = 0.5;
    
    for (const keyword of positiveKeywords) {
      if (description.includes(keyword)) {
        score += 0.15;
      }
    }
    
    for (const keyword of negativeKeywords) {
      if (description.includes(keyword)) {
        score -= 0.15;
      }
    }
    
    return Math.max(0.0, Math.min(score, 1.0));
  }

  /**
   * 应用角色特定权重
   */
  private applyCharacterSpecificWeights(
    message: Message,
    character: AICharacter,
    preferences: CharacterPruningPreferences
  ): number {
    let multiplier = 1.0;
    
    // 如果是角色自己的消息
    if (message.characterId === character.id) {
      multiplier *= (1 + preferences.memoryImportance * 0.3);
    }
    
    // 基于话题专注度
    multiplier *= (1 + preferences.topicFocus * 0.2);
    
    // 基于上下文深度偏好
    const messageLength = message.content.length;
    if (messageLength > 100 && preferences.contextDepth > 0.7) {
      multiplier *= 1.2; // 偏好长消息
    } else if (messageLength < 50 && preferences.contextDepth < 0.3) {
      multiplier *= 1.1; // 偏好短消息
    }
    
    return multiplier;
  }

  /**
   * 应用关系权重
   */
  private applyRelationshipWeights(
    message: Message,
    character: AICharacter,
    preferences: CharacterPruningPreferences
  ): number {
    if (!message.characterId || message.characterId === character.id) {
      return 1.0;
    }
    
    const relationshipStrength = this.getRelationshipStrength(character.id, message.characterId);
    const socialWeight = preferences.socialWeight;
    
    return 1.0 + (relationshipStrength * socialWeight * 0.3);
  }

  /**
   * 应用情感权重
   */
  private applyEmotionalWeights(
    message: Message,
    character: AICharacter,
    preferences: CharacterPruningPreferences
  ): number {
    // 简化的情感检测
    const emotionalIntensity = this.detectEmotionalIntensity(message.content);
    const sensitivity = preferences.emotionalSensitivity;
    
    return 1.0 + (emotionalIntensity * sensitivity * 0.25);
  }

  /**
   * 检测情感强度
   */
  private detectEmotionalIntensity(content: string): number {
    const emotionMarkers = ['!', '?', '😊', '😢', '😡', '❤️', '💔', '😱'];
    let intensity = 0;
    
    for (const marker of emotionMarkers) {
      intensity += (content.match(new RegExp(marker, 'g')) || []).length * 0.1;
    }
    
    return Math.min(intensity, 1.0);
  }

  /**
   * 计算话题权重
   */
  private calculateTopicWeight(
    topic: TopicInfo,
    character: AICharacter,
    preferences: CharacterPruningPreferences
  ): number {
    // 基于话题与角色兴趣的匹配度
    const baseWeight = topic.weight;
    const focusMultiplier = 1 + preferences.topicFocus * 0.5;
    
    return baseWeight * focusMultiplier;
  }

  /**
   * 计算关系权重
   */
  private calculateRelationshipWeight(
    relationshipStrength: number,
    preferences: CharacterPruningPreferences
  ): number {
    return relationshipStrength * preferences.socialWeight;
  }

  /**
   * 计算时间权重
   */
  private calculateTemporalWeights(
    character: AICharacter,
    preferences: CharacterPruningPreferences
  ): PersonalizedWeights['temporalWeights'] {
    return {
      recentBonus: 1.0 + preferences.memoryImportance * 0.3,
      memoryDecay: 0.95 - preferences.memoryImportance * 0.1,
      importantMomentBonus: 1.0 + preferences.emotionalSensitivity * 0.4
    };
  }

  /**
   * 检查是否必须保留消息
   */
  private mustRetainMessage(
    message: Message,
    character: AICharacter,
    preferences: CharacterPruningPreferences,
    reasons: string[]
  ): boolean {
    // 系统消息必须保留
    if (message.role === 'system') {
      reasons.push('系统消息');
      return true;
    }
    
    // 直接@该角色的消息
    if (this.isDirectMention(message, character)) {
      reasons.push('直接提及该角色');
      return true;
    }
    
    // 角色定义相关消息
    if (this.isCharacterDefinition(message, character)) {
      reasons.push('角色定义相关');
      return true;
    }
    
    return false;
  }

  /**
   * 检查是否应该优先保留
   */
  private shouldPreferRetain(
    message: Message,
    character: AICharacter,
    preferences: CharacterPruningPreferences,
    weight: number,
    reasons: string[]
  ): boolean {
    const threshold = this.dynamicThresholds.baseThreshold * 
                     this.dynamicThresholds.activityMultiplier;
    
    if (weight > threshold) {
      reasons.push(`权重高于阈值 (${weight.toFixed(2)} > ${threshold.toFixed(2)})`);
      return true;
    }
    
    // 情感强度高的消息
    if (preferences.emotionalSensitivity > 0.7) {
      const emotionalIntensity = this.detectEmotionalIntensity(message.content);
      if (emotionalIntensity > 0.5) {
        reasons.push('高情感强度');
        return true;
      }
    }
    
    // 角色相关的重要互动
    if (this.isImportantInteraction(message, character, preferences)) {
      reasons.push('重要角色互动');
      return true;
    }
    
    return false;
  }

  /**
   * 检查是否为直接提及
   */
  private isDirectMention(message: Message, character: AICharacter): boolean {
    const content = message.content.toLowerCase();
    const characterName = character.name.toLowerCase();
    
    return content.includes(`@${characterName}`) || 
           content.includes(`@${character.id}`);
  }

  /**
   * 检查是否为角色定义
   */
  private isCharacterDefinition(message: Message, character: AICharacter): boolean {
    // 简化实现：检查是否包含角色名称和定义关键词
    const content = message.content.toLowerCase();
    const characterName = character.name.toLowerCase();
    const definitionKeywords = ['是', '叫', '名字', '角色', '性格', '背景'];
    
    return content.includes(characterName) && 
           definitionKeywords.some(keyword => content.includes(keyword));
  }

  /**
   * 检查是否为重要互动
   */
  private isImportantInteraction(
    message: Message,
    character: AICharacter,
    preferences: CharacterPruningPreferences
  ): boolean {
    // 基于社交权重和关系强度判断
    if (message.characterId && message.characterId !== character.id) {
      const relationshipStrength = this.getRelationshipStrength(character.id, message.characterId);
      return relationshipStrength * preferences.socialWeight > 0.6;
    }
    
    return false;
  }

  /**
   * 获取角色关系
   */
  private getCharacterRelationships(characterId: string): Map<string, number> {
    return this.relationshipMatrix.get(characterId) || new Map();
  }

  /**
   * 获取关系强度
   */
  private getRelationshipStrength(characterId1: string, characterId2: string): number {
    const relationships = this.relationshipMatrix.get(characterId1);
    return relationships?.get(characterId2) || 0.5; // 默认中等关系
  }

  /**
   * 更新角色关系
   */
  updateCharacterRelationship(characterId1: string, characterId2: string, strength: number): void {
    if (!this.relationshipMatrix.has(characterId1)) {
      this.relationshipMatrix.set(characterId1, new Map());
    }
    if (!this.relationshipMatrix.has(characterId2)) {
      this.relationshipMatrix.set(characterId2, new Map());
    }
    
    this.relationshipMatrix.get(characterId1)!.set(characterId2, strength);
    this.relationshipMatrix.get(characterId2)!.set(characterId1, strength);
  }

  /**
   * 获取动态阈值
   */
  getDynamicThresholds(): DynamicThresholds {
    return { ...this.dynamicThresholds };
  }

  /**
   * 获取角色偏好
   */
  getCharacterPreferences(characterId: string): CharacterPruningPreferences | undefined {
    return this.characterPreferences.get(characterId);
  }

  /**
   * 更新角色偏好
   */
  updateCharacterPreferences(characterId: string, preferences: Partial<CharacterPruningPreferences>): void {
    const current = this.characterPreferences.get(characterId);
    if (current) {
      this.characterPreferences.set(characterId, { ...current, ...preferences });
    }
  }

  /**
   * 清理缓存和学习数据
   */
  clearCache(): void {
    this.learningData.clear();
    this.topicAnalyzer.clearCache();
  }
} 