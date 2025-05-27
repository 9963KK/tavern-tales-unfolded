/**
 * 关系记忆系统管理器
 * 基于图数据结构的AI角色关系建模与管理
 */

import {
  Relationship,
  RelationType,
  RelationshipStrength,
  RelationshipStatus,
  RelationshipTrigger,
  RelationshipDimensions,
  RelationshipEvent,
  RelationshipPattern,
  RelationshipNode,
  RelationshipNetwork,
  RelationshipMemory,
  RelationshipInference,
  RelationshipInfluence,
  RelationshipAnalysisConfig,
  RelationshipManagerState
} from '@/types/relationship';

import { Message, AICharacter } from '@/types/tavern';
import { EmotionalState } from '@/types/emotion';

/**
 * 默认关系分析配置
 */
const DEFAULT_RELATIONSHIP_CONFIG: RelationshipAnalysisConfig = {
  analysisDepth: 'moderate',
  updateFrequency: 30, // 30秒更新一次
  
  relationshipThresholds: {
    minimumStrength: 0.1,
    significantChange: 0.2,
    patternDetectionMinEvents: 5
  },
  
  networkAnalysis: {
    enabled: true,
    communityDetection: true,
    influenceCalculation: true,
    pathAnalysis: false // 暂时关闭，性能考虑
  },
  
  inference: {
    enabled: true,
    maxInferenceDepth: 2,
    confidenceThreshold: 0.6,
    analogyWeight: 0.3
  },
  
  performance: {
    maxRelationships: 100,
    historyRetention: 30, // 30天
    cacheSize: 500
  }
};

/**
 * 关系行为分析结果
 */
interface RelationshipBehaviorAnalysis {
  messageId: string;
  fromCharacterId: string;
  toCharacterId: string;
  behaviors: {
    friendliness: number;     // 友好程度 [-1, 1]
    hostility: number;        // 敌意程度 [-1, 1]
    respect: number;          // 尊重程度 [-1, 1]
    intimacy: number;         // 亲密程度 [0, 1]
    dominance: number;        // 主导性 [-1, 1]
  };
  confidence: number;
  reasoning: string;
}

/**
 * 关系记忆系统管理器
 */
export class RelationshipManager {
  private config: RelationshipAnalysisConfig;
  private state: RelationshipManagerState;
  private relationshipMemories: Map<string, RelationshipMemory> = new Map();
  private relationshipNetwork: RelationshipNetwork;
  private analysisCache: Map<string, RelationshipBehaviorAnalysis> = new Map();
  
  // 中文关系行为词典
  private behaviorLexicon: Map<string, { 
    friendliness: number; 
    hostility: number; 
    respect: number; 
    intimacy: number; 
    dominance: number; 
  }> = new Map([
    // 友好行为
    ['问候', { friendliness: 0.8, hostility: -0.2, respect: 0.3, intimacy: 0.2, dominance: 0.0 }],
    ['感谢', { friendliness: 0.9, hostility: -0.3, respect: 0.7, intimacy: 0.1, dominance: -0.2 }],
    ['赞美', { friendliness: 0.8, hostility: -0.4, respect: 0.6, intimacy: 0.3, dominance: 0.1 }],
    ['关心', { friendliness: 0.9, hostility: -0.5, respect: 0.4, intimacy: 0.6, dominance: -0.1 }],
    ['帮助', { friendliness: 0.9, hostility: -0.3, respect: 0.2, intimacy: 0.4, dominance: 0.2 }],
    
    // 敌对行为
    ['威胁', { friendliness: -0.9, hostility: 0.9, respect: -0.3, intimacy: -0.7, dominance: 0.8 }],
    ['侮辱', { friendliness: -0.8, hostility: 0.8, respect: -0.9, intimacy: -0.8, dominance: 0.6 }],
    ['嘲笑', { friendliness: -0.6, hostility: 0.6, respect: -0.7, intimacy: -0.5, dominance: 0.4 }],
    ['指责', { friendliness: -0.5, hostility: 0.5, respect: -0.4, intimacy: -0.3, dominance: 0.3 }],
    ['拒绝', { friendliness: -0.3, hostility: 0.2, respect: -0.1, intimacy: -0.4, dominance: 0.2 }],
    
    // 尊重行为
    ['敬礼', { friendliness: 0.3, hostility: -0.2, respect: 0.9, intimacy: 0.0, dominance: -0.3 }],
    ['请教', { friendliness: 0.4, hostility: -0.1, respect: 0.8, intimacy: 0.1, dominance: -0.5 }],
    ['道歉', { friendliness: 0.2, hostility: -0.4, respect: 0.6, intimacy: 0.2, dominance: -0.6 }],
    ['认同', { friendliness: 0.5, hostility: -0.2, respect: 0.7, intimacy: 0.3, dominance: -0.1 }],
    
    // 亲密行为
    ['拥抱', { friendliness: 0.7, hostility: -0.8, respect: 0.2, intimacy: 0.9, dominance: 0.0 }],
    ['亲吻', { friendliness: 0.6, hostility: -0.9, respect: 0.1, intimacy: 0.95, dominance: 0.1 }],
    ['表白', { friendliness: 0.8, hostility: -0.5, respect: 0.3, intimacy: 0.8, dominance: 0.0 }],
    ['分享', { friendliness: 0.6, hostility: -0.3, respect: 0.4, intimacy: 0.7, dominance: -0.1 }],
    
    // 主导行为
    ['命令', { friendliness: -0.1, hostility: 0.2, respect: -0.2, intimacy: -0.1, dominance: 0.9 }],
    ['指挥', { friendliness: 0.0, hostility: 0.1, respect: 0.1, intimacy: 0.0, dominance: 0.8 }],
    ['决定', { friendliness: 0.1, hostility: 0.0, respect: 0.2, intimacy: 0.1, dominance: 0.7 }],
    ['建议', { friendliness: 0.4, hostility: -0.1, respect: 0.3, intimacy: 0.2, dominance: 0.3 }]
  ]);

  constructor(characters: AICharacter[], config?: Partial<RelationshipAnalysisConfig>) {
    this.config = { ...DEFAULT_RELATIONSHIP_CONFIG, ...config };
    
    this.state = {
      isActive: true,
      totalRelationships: 0,
      totalEvents: 0,
      totalPatterns: 0,
      performance: {
        analysisCount: 0,
        averageAnalysisTime: 0,
        cacheHitRate: 0,
        memoryUsage: 0
      },
      networkHealth: {
        density: 0,
        stability: 0,
        activityLevel: 0
      },
      currentConfig: this.config,
      lastConfigUpdate: new Date(),
      lastUpdate: new Date()
    };

    // 初始化关系网络
    this.relationshipNetwork = this.createInitialNetwork(characters);
    
    // 为每个角色初始化关系记忆
    this.initializeCharacterMemories(characters);
    
    console.log('🤝 关系记忆系统初始化完成');
  }

  /**
   * 分析消息中的关系行为
   */
  public async analyzeRelationshipBehavior(
    message: Message,
    characters: AICharacter[],
    context?: Message[]
  ): Promise<RelationshipBehaviorAnalysis | null> {
    const startTime = Date.now();
    
    try {
      // 检查缓存
      const cacheKey = this.generateBehaviorCacheKey(message);
      if (this.analysisCache.has(cacheKey)) {
        this.state.performance.cacheHitRate++;
        return this.analysisCache.get(cacheKey)!;
      }

      // 确定发送者和接收者
      const fromCharacter = characters.find(c => c.name === message.sender);
      if (!fromCharacter || message.isPlayer) {
        return null; // 只分析AI角色间的关系
      }

      // 识别消息的目标角色（简化版）
      let toCharacterId = '';
      
      // 检查@提及
      if (message.mentionedCharacters && message.mentionedCharacters.length > 0) {
        const mentionedCharacter = characters.find(c => 
          message.mentionedCharacters!.includes(c.name)
        );
        if (mentionedCharacter) {
          toCharacterId = mentionedCharacter.id;
        }
      }
      
      // 如果没有明确目标，选择最近发言的角色作为隐含目标
      if (!toCharacterId && context && context.length > 0) {
        const recentSpeakers = context
          .slice(-3)
          .filter(msg => !msg.isPlayer && msg.sender !== message.sender)
          .map(msg => msg.sender);
        
        if (recentSpeakers.length > 0) {
          const targetCharacter = characters.find(c => c.name === recentSpeakers[0]);
          if (targetCharacter) {
            toCharacterId = targetCharacter.id;
          }
        }
      }

      if (!toCharacterId) {
        return null; // 无法确定目标角色
      }

      // 分析行为模式
      const behaviors = this.analyzeBehaviorPatterns(message.text);
      
      // 考虑上下文影响
      if (context) {
        this.applyContextualAdjustment(behaviors, message, context);
      }

      const analysis: RelationshipBehaviorAnalysis = {
        messageId: message.id,
        fromCharacterId: fromCharacter.id,
        toCharacterId,
        behaviors,
        confidence: this.calculateBehaviorConfidence(message.text, behaviors),
        reasoning: this.generateBehaviorReasoning(message.text, behaviors)
      };

      // 缓存结果
      this.analysisCache.set(cacheKey, analysis);
      
      // 限制缓存大小
      if (this.analysisCache.size > this.config.performance.cacheSize) {
        const firstKey = this.analysisCache.keys().next().value;
        this.analysisCache.delete(firstKey);
      }

      // 更新性能统计
      this.updatePerformanceStats(Date.now() - startTime);

      return analysis;

    } catch (error) {
      console.error('关系行为分析失败:', error);
      return null;
    }
  }

  /**
   * 更新角色间关系
   */
  public async updateRelationship(
    analysis: RelationshipBehaviorAnalysis,
    triggerContext: string,
    relatedMessageId?: string
  ): Promise<void> {
    const { fromCharacterId, toCharacterId, behaviors } = analysis;
    
    // 获取或创建关系
    let relationship = this.findRelationship(fromCharacterId, toCharacterId);
    const isNewRelationship = !relationship;
    
    if (!relationship) {
      relationship = this.createNewRelationship(fromCharacterId, toCharacterId);
    }

    const previousState = { ...relationship };

    // 更新关系维度
    this.updateRelationshipDimensions(relationship, behaviors);
    
    // 重新评估关系类型和状态
    this.reassessRelationshipType(relationship);
    this.updateRelationshipStatus(relationship);
    
    // 创建关系变化事件
    if (this.isSignificantRelationshipChange(previousState, relationship) || isNewRelationship) {
      const event = this.createRelationshipEvent(
        relationship.id,
        analysis.behaviors,
        triggerContext,
        previousState,
        relationship,
        relatedMessageId
      );
      
      // 更新角色记忆
      this.updateCharacterRelationshipMemory(fromCharacterId, relationship, event);
      
      // 如果是双向关系，也更新对方记忆
      if (relationship.isMutual) {
        this.updateCharacterRelationshipMemory(toCharacterId, relationship, event);
      }
    }

    // 更新网络
    this.updateRelationshipNetwork(relationship);
    
    // 检测关系模式
    if (this.config.networkAnalysis.enabled) {
      await this.detectRelationshipPatterns(fromCharacterId);
    }

    console.log(`🤝 更新关系: ${fromCharacterId} -> ${toCharacterId}, 类型: ${relationship.type}, 强度: ${relationship.strength.toFixed(2)}`);
  }

  /**
   * 基于词典分析行为模式
   */
  private analyzeBehaviorPatterns(text: string): RelationshipBehaviorAnalysis['behaviors'] {
    const behaviors = {
      friendliness: 0,
      hostility: 0,
      respect: 0,
      intimacy: 0,
      dominance: 0
    };

    let totalWeight = 0;
    
    // 检查词典中的关键词
    for (const [keyword, values] of this.behaviorLexicon.entries()) {
      if (text.includes(keyword)) {
        const weight = 1.0;
        behaviors.friendliness += values.friendliness * weight;
        behaviors.hostility += values.hostility * weight;
        behaviors.respect += values.respect * weight;
        behaviors.intimacy += values.intimacy * weight;
        behaviors.dominance += values.dominance * weight;
        totalWeight += weight;
      }
    }

    // 标准化结果
    if (totalWeight > 0) {
      behaviors.friendliness /= totalWeight;
      behaviors.hostility /= totalWeight;
      behaviors.respect /= totalWeight;
      behaviors.intimacy /= totalWeight;
      behaviors.dominance /= totalWeight;
    }

    // 额外的语言模式分析
    this.analyzeLanguagePatterns(text, behaviors);

    return behaviors;
  }

  /**
   * 分析语言模式
   */
  private analyzeLanguagePatterns(
    text: string, 
    behaviors: RelationshipBehaviorAnalysis['behaviors']
  ): void {
    // 问候模式
    if (text.includes('你好') || text.includes('早上好') || text.includes('晚安')) {
      behaviors.friendliness += 0.3;
    }

    // 感叹号模式（激动）
    const exclamationCount = (text.match(/！/g) || []).length;
    if (exclamationCount > 0) {
      behaviors.dominance += Math.min(0.3, exclamationCount * 0.1);
    }

    // 问号模式（询问，较低主导性）
    const questionCount = (text.match(/？/g) || []).length;
    if (questionCount > 0) {
      behaviors.dominance -= Math.min(0.2, questionCount * 0.1);
      behaviors.respect += Math.min(0.2, questionCount * 0.05);
    }

    // 敬语模式
    if (text.includes('请') || text.includes('劳烦') || text.includes('麻烦')) {
      behaviors.respect += 0.3;
      behaviors.dominance -= 0.2;
    }

    // 亲昵称呼
    if (text.includes('亲爱的') || text.includes('宝贝') || text.includes('朋友')) {
      behaviors.intimacy += 0.4;
      behaviors.friendliness += 0.3;
    }

    // 负面情绪词汇
    if (text.includes('讨厌') || text.includes('烦人') || text.includes('滚开')) {
      behaviors.hostility += 0.5;
      behaviors.friendliness -= 0.4;
    }
  }

  /**
   * 应用上下文调整
   */
  private applyContextualAdjustment(
    behaviors: RelationshipBehaviorAnalysis['behaviors'],
    message: Message,
    context: Message[]
  ): void {
    const recentMessages = context.slice(-3);
    
    // 分析对话氛围
    let atmosphereScore = 0;
    for (const msg of recentMessages) {
      if (msg.text.includes('笑') || msg.text.includes('开心')) {
        atmosphereScore += 0.2;
      } else if (msg.text.includes('生气') || msg.text.includes('愤怒')) {
        atmosphereScore -= 0.2;
      }
    }

    // 氛围影响所有行为
    behaviors.friendliness += atmosphereScore * 0.3;
    behaviors.hostility -= atmosphereScore * 0.3;
    
    // 连续对话增强亲密度
    const consecutiveCount = this.countConsecutiveInteractions(message.sender, context);
    if (consecutiveCount > 1) {
      behaviors.intimacy += Math.min(0.2, consecutiveCount * 0.05);
    }
  }

  /**
   * 计算连续互动次数
   */
  private countConsecutiveInteractions(speaker: string, context: Message[]): number {
    let count = 0;
    for (let i = context.length - 1; i >= 0; i--) {
      if (context[i].sender === speaker || context[i].isPlayer) {
        count++;
      } else {
        break;
      }
    }
    return count;
  }

  /**
   * 计算行为分析置信度
   */
  private calculateBehaviorConfidence(
    text: string, 
    behaviors: RelationshipBehaviorAnalysis['behaviors']
  ): number {
    let confidence = 0.5; // 基础置信度

    // 文本长度影响
    const textLength = text.length;
    if (textLength > 50) {
      confidence += 0.2;
    } else if (textLength < 10) {
      confidence -= 0.2;
    }

    // 行为强度影响
    const behaviorIntensity = Object.values(behaviors)
      .reduce((sum, value) => sum + Math.abs(value), 0) / Object.keys(behaviors).length;
    
    confidence += behaviorIntensity * 0.3;

    // 关键词匹配数量影响
    let keywordCount = 0;
    for (const keyword of this.behaviorLexicon.keys()) {
      if (text.includes(keyword)) {
        keywordCount++;
      }
    }
    confidence += Math.min(0.3, keywordCount * 0.1);

    return Math.max(0.1, Math.min(0.95, confidence));
  }

  /**
   * 生成行为分析推理说明
   */
  private generateBehaviorReasoning(
    text: string, 
    behaviors: RelationshipBehaviorAnalysis['behaviors']
  ): string {
    const reasons: string[] = [];

    // 找出最突出的行为
    const behaviorEntries = Object.entries(behaviors)
      .map(([key, value]) => ({ behavior: key, intensity: Math.abs(value), value }))
      .sort((a, b) => b.intensity - a.intensity);

    const dominantBehavior = behaviorEntries[0];
    
    if (dominantBehavior.intensity > 0.3) {
      const behaviorNames = {
        friendliness: dominantBehavior.value > 0 ? '友好' : '冷淡',
        hostility: dominantBehavior.value > 0 ? '敌意' : '和善',
        respect: dominantBehavior.value > 0 ? '尊重' : '轻视',
        intimacy: dominantBehavior.value > 0 ? '亲密' : '疏远',
        dominance: dominantBehavior.value > 0 ? '主导' : '服从'
      };
      
      const behaviorName = behaviorNames[dominantBehavior.behavior as keyof typeof behaviorNames];
      reasons.push(`表现出${behaviorName}态度`);
    }

    // 检查关键词
    const matchedKeywords = Array.from(this.behaviorLexicon.keys())
      .filter(keyword => text.includes(keyword));
    
    if (matchedKeywords.length > 0) {
      reasons.push(`包含关键词: ${matchedKeywords.slice(0, 3).join('、')}`);
    }

    return reasons.length > 0 ? reasons.join('; ') : '基于语言模式分析';
  }

  /**
   * 创建新关系
   */
  private createNewRelationship(fromCharacterId: string, toCharacterId: string): Relationship {
    const relationship: Relationship = {
      id: crypto.randomUUID(),
      fromCharacterId,
      toCharacterId,
      type: RelationType.NEUTRAL,
      strength: RelationshipStrength.MINIMAL,
      isDirectional: true,
      isMutual: false,
      dimensions: {
        trust: 0.5,
        intimacy: 0.1,
        respect: 0.5,
        attraction: 0.0,
        compatibility: 0.5,
        influence: 0.0,
        dependence: 0.0,
        stability: 0.8
      },
      status: RelationshipStatus.DEVELOPING,
      confidence: 0.6,
      lastInteraction: new Date(),
      establishedAt: new Date(),
      lastUpdated: new Date(),
      tags: [],
      notes: '新建立的关系'
    };

    console.log(`🆕 创建新关系: ${fromCharacterId} -> ${toCharacterId}`);
    return relationship;
  }

  /**
   * 查找现有关系
   */
  private findRelationship(fromCharacterId: string, toCharacterId: string): Relationship | null {
    // 首先查找直接关系
    for (const memory of this.relationshipMemories.values()) {
      for (const relationship of memory.relationships.values()) {
        if (relationship.fromCharacterId === fromCharacterId && 
            relationship.toCharacterId === toCharacterId) {
          return relationship;
        }
      }
    }

    // 查找反向关系（如果是双向的）
    for (const memory of this.relationshipMemories.values()) {
      for (const relationship of memory.relationships.values()) {
        if (relationship.fromCharacterId === toCharacterId && 
            relationship.toCharacterId === fromCharacterId &&
            relationship.isMutual) {
          return relationship;
        }
      }
    }

    return null;
  }

  /**
   * 更新关系维度
   */
  private updateRelationshipDimensions(
    relationship: Relationship, 
    behaviors: RelationshipBehaviorAnalysis['behaviors']
  ): void {
    const dimensions = relationship.dimensions;
    const updateRate = 0.1; // 更新速率，避免过度快速变化

    // 友好度影响信任和亲密
    if (behaviors.friendliness !== 0) {
      dimensions.trust += behaviors.friendliness * updateRate;
      dimensions.intimacy += behaviors.friendliness * updateRate * 0.5;
    }

    // 敌意影响信任和稳定性
    if (behaviors.hostility !== 0) {
      dimensions.trust -= behaviors.hostility * updateRate;
      dimensions.stability -= Math.abs(behaviors.hostility) * updateRate * 0.3;
    }

    // 尊重度直接影响尊重维度
    if (behaviors.respect !== 0) {
      dimensions.respect += behaviors.respect * updateRate;
    }

    // 亲密行为影响亲密度和吸引力
    if (behaviors.intimacy !== 0) {
      dimensions.intimacy += behaviors.intimacy * updateRate;
      dimensions.attraction += behaviors.intimacy * updateRate * 0.3;
    }

    // 主导性影响影响力
    if (behaviors.dominance !== 0) {
      dimensions.influence += behaviors.dominance * updateRate;
    }

    // 标准化所有维度到有效范围
    this.normalizeDimensions(dimensions);

    // 更新关系强度（基于多个维度的综合）
    relationship.strength = this.calculateRelationshipStrength(dimensions);
    
    // 更新最后互动时间
    relationship.lastInteraction = new Date();
    relationship.lastUpdated = new Date();
  }

  /**
   * 标准化关系维度
   */
  private normalizeDimensions(dimensions: RelationshipDimensions): void {
    // 信任、亲密、尊重、依赖、稳定性范围 [0, 1]
    dimensions.trust = Math.max(0, Math.min(1, dimensions.trust));
    dimensions.intimacy = Math.max(0, Math.min(1, dimensions.intimacy));
    dimensions.respect = Math.max(0, Math.min(1, dimensions.respect));
    dimensions.dependence = Math.max(0, Math.min(1, dimensions.dependence));
    dimensions.stability = Math.max(0, Math.min(1, dimensions.stability));

    // 吸引力、兼容性、影响力范围 [-1, 1]
    dimensions.attraction = Math.max(-1, Math.min(1, dimensions.attraction));
    dimensions.compatibility = Math.max(-1, Math.min(1, dimensions.compatibility));
    dimensions.influence = Math.max(-1, Math.min(1, dimensions.influence));
  }

  /**
   * 计算关系强度
   */
  private calculateRelationshipStrength(dimensions: RelationshipDimensions): number {
    // 基于多个正面维度计算综合强度
    const positiveFactors = [
      dimensions.trust,
      dimensions.intimacy,
      dimensions.respect,
      Math.abs(dimensions.attraction), // 吸引力的绝对值
      Math.max(0, dimensions.compatibility), // 只考虑正面兼容性
      dimensions.stability
    ];

    const averagePositive = positiveFactors.reduce((sum, val) => sum + val, 0) / positiveFactors.length;
    
    // 考虑负面因素的影响
    const negativeFactor = Math.max(0, -dimensions.compatibility) * 0.3;
    
    const finalStrength = Math.max(0.05, Math.min(0.95, averagePositive - negativeFactor));
    
    return finalStrength;
  }

  /**
   * 重新评估关系类型
   */
  private reassessRelationshipType(relationship: Relationship): void {
    const { dimensions } = relationship;
    
    // 基于维度组合判断关系类型
    if (dimensions.attraction > 0.6 && dimensions.intimacy > 0.5) {
      relationship.type = RelationType.ROMANTIC;
    } else if (dimensions.trust > 0.7 && dimensions.intimacy > 0.4) {
      relationship.type = RelationType.FRIENDSHIP;
    } else if (dimensions.respect > 0.7 && dimensions.influence < -0.3) {
      relationship.type = RelationType.MENTOR_STUDENT;
    } else if (dimensions.trust > 0.6 && Math.abs(dimensions.influence) < 0.3) {
      relationship.type = RelationType.ALLIANCE;
    } else if (dimensions.trust < 0.3 && dimensions.respect < 0.3) {
      if (dimensions.attraction < -0.5) {
        relationship.type = RelationType.HATRED;
      } else {
        relationship.type = RelationType.RIVALRY;
      }
    } else if (dimensions.trust < 0.4) {
      relationship.type = RelationType.SUSPICION;
    } else if (dimensions.respect < 0.3 && dimensions.attraction < -0.3) {
      relationship.type = RelationType.CONTEMPT;
    } else if (dimensions.trust > 0.3 && dimensions.intimacy < 0.3) {
      relationship.type = RelationType.ACQUAINTANCE;
    } else {
      relationship.type = RelationType.NEUTRAL;
    }
  }

  /**
   * 更新关系状态
   */
  private updateRelationshipStatus(relationship: Relationship): void {
    const { dimensions } = relationship;
    
    // 基于稳定性和变化趋势判断状态
    if (dimensions.stability > 0.8) {
      relationship.status = RelationshipStatus.STABLE;
    } else if (dimensions.stability < 0.3) {
      relationship.status = RelationshipStatus.VOLATILE;
    } else if (relationship.strength > 0.6) {
      relationship.status = RelationshipStatus.DEVELOPING;
    } else if (relationship.strength < 0.2) {
      relationship.status = RelationshipStatus.DECLINING;
    } else {
      relationship.status = RelationshipStatus.DEVELOPING;
    }
  }

  /**
   * 检测显著关系变化
   */
  private isSignificantRelationshipChange(
    before: Relationship, 
    after: Relationship
  ): boolean {
    // 类型变化
    if (before.type !== after.type) {
      return true;
    }

    // 强度显著变化
    const strengthChange = Math.abs(after.strength - before.strength);
    if (strengthChange > this.config.relationshipThresholds.significantChange) {
      return true;
    }

    // 关键维度显著变化
    const dimensionChanges = [
      Math.abs(after.dimensions.trust - before.dimensions.trust),
      Math.abs(after.dimensions.intimacy - before.dimensions.intimacy),
      Math.abs(after.dimensions.respect - before.dimensions.respect)
    ];

    return dimensionChanges.some(change => change > 0.2);
  }

  /**
   * 创建关系变化事件
   */
  private createRelationshipEvent(
    relationshipId: string,
    behaviors: RelationshipBehaviorAnalysis['behaviors'],
    triggerContext: string,
    beforeState: Relationship,
    afterState: Relationship,
    relatedMessageId?: string
  ): RelationshipEvent {
    // 计算变化向量
    const changeVector: Partial<RelationshipDimensions> = {};
    const beforeDim = beforeState.dimensions;
    const afterDim = afterState.dimensions;
    
    changeVector.trust = afterDim.trust - beforeDim.trust;
    changeVector.intimacy = afterDim.intimacy - beforeDim.intimacy;
    changeVector.respect = afterDim.respect - beforeDim.respect;
    changeVector.attraction = afterDim.attraction - beforeDim.attraction;

    // 计算影响程度
    const impactScore = Object.values(changeVector)
      .reduce((sum, change) => sum + Math.abs(change || 0), 0) / 4;

    // 推断触发因素
    let trigger = RelationshipTrigger.UNKNOWN;
    if (behaviors.friendliness > 0.3) {
      trigger = RelationshipTrigger.POSITIVE_INTERACTION;
    } else if (behaviors.hostility > 0.3) {
      trigger = RelationshipTrigger.NEGATIVE_INTERACTION;
    } else if (behaviors.intimacy > 0.3) {
      trigger = RelationshipTrigger.SHARED_EXPERIENCE;
    } else {
      trigger = RelationshipTrigger.POSITIVE_INTERACTION;
    }

    return {
      id: crypto.randomUUID(),
      relationshipId,
      trigger,
      description: this.generateEventDescription(beforeState, afterState, behaviors),
      context: triggerContext,
      beforeState: {
        type: beforeState.type,
        strength: beforeState.strength,
        dimensions: { ...beforeState.dimensions }
      },
      afterState: {
        type: afterState.type,
        strength: afterState.strength,
        dimensions: { ...afterState.dimensions }
      },
      impactScore,
      changeVector,
      timestamp: new Date(),
      relatedMessageId,
      participantIds: [beforeState.fromCharacterId, beforeState.toCharacterId]
    };
  }

  /**
   * 生成事件描述
   */
  private generateEventDescription(
    before: Relationship,
    after: Relationship,
    behaviors: RelationshipBehaviorAnalysis['behaviors']
  ): string {
    const descriptions: string[] = [];

    // 关系类型变化
    if (before.type !== after.type) {
      descriptions.push(`关系类型从${before.type}变为${after.type}`);
    }

    // 强度变化
    const strengthChange = after.strength - before.strength;
    if (Math.abs(strengthChange) > 0.1) {
      const direction = strengthChange > 0 ? '增强' : '减弱';
      descriptions.push(`关系强度${direction}(${strengthChange.toFixed(2)})`);
    }

    // 主要行为特征
    const dominantBehavior = Object.entries(behaviors)
      .reduce((max, [behavior, value]) => 
        Math.abs(value) > Math.abs(max.value) ? { behavior, value } : max, 
        { behavior: '', value: 0 }
      );

    if (Math.abs(dominantBehavior.value) > 0.2) {
      const behaviorNames = {
        friendliness: '友好互动',
        hostility: '敌意表达',
        respect: '尊重行为',
        intimacy: '亲密接触',
        dominance: '主导行为'
      };
      descriptions.push(behaviorNames[dominantBehavior.behavior as keyof typeof behaviorNames] || '特殊互动');
    }

    return descriptions.length > 0 ? descriptions.join(', ') : '关系状态更新';
  }

  /**
   * 更新角色关系记忆
   */
  private updateCharacterRelationshipMemory(
    characterId: string,
    relationship: Relationship,
    event: RelationshipEvent
  ): void {
    let memory = this.relationshipMemories.get(characterId);
    if (!memory) {
      memory = this.createCharacterRelationshipMemory(characterId);
      this.relationshipMemories.set(characterId, memory);
    }

    // 更新关系
    memory.relationships.set(relationship.id, relationship);
    
    // 添加事件历史
    memory.relationshipHistory.push(event);
    
    // 限制历史长度
    if (memory.relationshipHistory.length > 100) {
      memory.relationshipHistory = memory.relationshipHistory.slice(-100);
    }

    // 更新统计
    this.updateRelationshipStatistics(memory);
    
    memory.lastUpdated = new Date();
  }

  /**
   * 创建角色关系记忆
   */
  private createCharacterRelationshipMemory(characterId: string): RelationshipMemory {
    return {
      characterId,
      relationships: new Map(),
      relationshipHistory: [],
      patterns: [],
      socialPreferences: {
        preferredRelationTypes: [RelationType.FRIENDSHIP, RelationType.ALLIANCE],
        avoidedRelationTypes: [RelationType.HATRED, RelationType.CONTEMPT],
        socialComfortZone: {
          trust: 0.6,
          intimacy: 0.4,
          respect: 0.7,
          attraction: 0.0,
          compatibility: 0.5,
          influence: 0.0,
          dependence: 0.3,
          stability: 0.8
        }
      },
      networkPosition: {
        characterId,
        centrality: 0.1,
        influence: 0.1,
        popularity: 0.0,
        totalRelationships: 0,
        positiveRelationships: 0,
        negativeRelationships: 0,
        networkRole: 'isolate',
        lastUpdated: new Date()
      },
      relationshipStrategy: {
        approachStyle: 'reactive',
        conflictResolution: 'diplomatic',
        loyaltyLevel: 0.7,
        trustThreshold: 0.5
      },
      statistics: {
        totalInteractions: 0,
        successfulRelationships: 0,
        failedRelationships: 0,
        averageRelationshipDuration: 0,
        socialSatisfaction: 0.5
      },
      createdAt: new Date(),
      lastUpdated: new Date()
    };
  }

  /**
   * 更新关系统计
   */
  private updateRelationshipStatistics(memory: RelationshipMemory): void {
    const relationships = Array.from(memory.relationships.values());
    
    memory.statistics.totalInteractions = memory.relationshipHistory.length;
    
    // 统计成功和失败的关系
    memory.statistics.successfulRelationships = relationships.filter(r => 
      r.strength > 0.5 && [RelationType.FRIENDSHIP, RelationType.ROMANTIC, RelationType.ALLIANCE].includes(r.type)
    ).length;
    
    memory.statistics.failedRelationships = relationships.filter(r => 
      [RelationType.HATRED, RelationType.RIVALRY, RelationType.CONTEMPT].includes(r.type)
    ).length;

    // 计算平均关系持续时间
    if (relationships.length > 0) {
      const totalDuration = relationships.reduce((sum, r) => {
        const duration = r.lastInteraction.getTime() - r.establishedAt.getTime();
        return sum + duration / (1000 * 60 * 60 * 24); // 转换为天数
      }, 0);
      memory.statistics.averageRelationshipDuration = totalDuration / relationships.length;
    }

    // 计算社交满意度
    if (relationships.length > 0) {
      const avgStrength = relationships.reduce((sum, r) => sum + r.strength, 0) / relationships.length;
      const positiveRatio = memory.statistics.successfulRelationships / relationships.length;
      memory.statistics.socialSatisfaction = (avgStrength + positiveRatio) / 2;
    }

    // 更新网络位置
    memory.networkPosition.totalRelationships = relationships.length;
    memory.networkPosition.positiveRelationships = memory.statistics.successfulRelationships;
    memory.networkPosition.negativeRelationships = memory.statistics.failedRelationships;
    memory.networkPosition.lastUpdated = new Date();
  }

  /**
   * 初始化关系网络
   */
  private createInitialNetwork(characters: AICharacter[]): RelationshipNetwork {
    return {
      id: crypto.randomUUID(),
      name: '酒馆关系网络',
      nodes: new Map(),
      relationships: new Map(),
      density: 0,
      clustering: 0,
      avgPathLength: 0,
      communities: [],
      cliques: [],
      createdAt: new Date(),
      lastAnalyzed: new Date()
    };
  }

  /**
   * 初始化角色记忆
   */
  private initializeCharacterMemories(characters: AICharacter[]): void {
    for (const character of characters) {
      if (!this.relationshipMemories.has(character.id)) {
        const memory = this.createCharacterRelationshipMemory(character.id);
        this.relationshipMemories.set(character.id, memory);
      }
    }
  }

  /**
   * 更新关系网络
   */
  private updateRelationshipNetwork(relationship: Relationship): void {
    this.relationshipNetwork.relationships.set(relationship.id, relationship);
    this.relationshipNetwork.lastAnalyzed = new Date();
    
    // 简单的网络统计更新
    const totalPossibleRelationships = this.relationshipMemories.size * (this.relationshipMemories.size - 1);
    this.relationshipNetwork.density = totalPossibleRelationships > 0 ? 
      this.relationshipNetwork.relationships.size / totalPossibleRelationships : 0;
  }

  /**
   * 检测关系模式
   */
  private async detectRelationshipPatterns(characterId: string): Promise<void> {
    const memory = this.relationshipMemories.get(characterId);
    if (!memory || memory.relationshipHistory.length < this.config.relationshipThresholds.patternDetectionMinEvents) {
      return;
    }

    // 这里可以实现更复杂的模式检测算法
    // 目前只实现基础的重复行为模式检测
    
    console.log(`🔍 检测关系模式: ${characterId}`);
  }

  /**
   * 生成缓存键
   */
  private generateBehaviorCacheKey(message: Message): string {
    return `${message.id}_${message.sender}_${message.timestamp.getTime()}`;
  }

  /**
   * 更新性能统计
   */
  private updatePerformanceStats(processingTime: number): void {
    this.state.performance.analysisCount++;
    
    const currentAvg = this.state.performance.averageAnalysisTime;
    const newAvg = (currentAvg * (this.state.performance.analysisCount - 1) + processingTime) / this.state.performance.analysisCount;
    this.state.performance.averageAnalysisTime = newAvg;
    
    this.state.lastUpdate = new Date();
  }

  /**
   * 获取角色关系记忆
   */
  public getCharacterRelationshipMemory(characterId: string): RelationshipMemory | undefined {
    return this.relationshipMemories.get(characterId);
  }

  /**
   * 获取管理器状态
   */
  public getState(): RelationshipManagerState {
    return { ...this.state };
  }

  /**
   * 获取关系网络
   */
  public getRelationshipNetwork(): RelationshipNetwork {
    return this.relationshipNetwork;
  }

  /**
   * 清理缓存
   */
  public clearCache(): void {
    this.analysisCache.clear();
    console.log('�� 关系分析缓存已清理');
  }
} 