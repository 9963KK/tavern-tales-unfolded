/**
 * 上下文记忆管理器
 * 智能检测、分析和管理AI角色的环境上下文信息
 */

import {
  ContextType,
  ContextImportance,
  ContextStability,
  ContextElement,
  TemporalContext,
  SpatialContext,
  SocialContext,
  TopicalContext,
  EnvironmentalContext,
  ActivityContext,
  ContextChangeEvent,
  ContextMemory,
  ContextInference,
  ContextAdaptationStrategy,
  ContextAnalysisConfig,
  ContextMemoryManagerState
} from '@/types/context';

import { Message, AICharacter } from '@/types/tavern';
import { EmotionalState } from '@/types/emotion';
import { Relationship } from '@/types/relationship';
import { InteractionEvent, InteractionSession } from '@/types/interaction';

/**
 * 默认上下文分析配置
 */
const DEFAULT_CONTEXT_CONFIG: ContextAnalysisConfig = {
  detection: {
    sensitivityLevel: 'medium',
    updateFrequency: 5000,             // 5秒
    minConfidence: 0.6,
    contextWindow: 20                  // 最近20条消息
  },
  
  memory: {
    maxActiveContexts: 15,
    retentionPeriod: 86400000,         // 24小时
    compressionThreshold: 0.3,
    priorityWeights: {
      [ContextType.TEMPORAL]: 0.8,
      [ContextType.SPATIAL]: 0.9,
      [ContextType.SOCIAL]: 1.0,
      [ContextType.TOPICAL]: 0.7,
      [ContextType.ENVIRONMENTAL]: 0.6,
      [ContextType.ACTIVITY]: 0.8,
      [ContextType.EMOTIONAL]: 0.9,
      [ContextType.CULTURAL]: 0.5
    }
  },
  
  inference: {
    enabled: true,
    maxInferences: 10,
    confidenceThreshold: 0.7,
    timeHorizon: 3600000               // 1小时
  },
  
  adaptation: {
    enabled: true,
    learningRate: 0.1,
    adaptationThreshold: 0.6,
    maxStrategies: 20
  }
};

/**
 * 上下文检测结果
 */
interface ContextDetectionResult {
  contexts: ContextElement[];
  changes: ContextChangeEvent[];
  inferences: ContextInference[];
  confidence: number;
  processingTime: number;
}

/**
 * 上下文记忆管理器
 */
export class ContextMemoryManager {
  private config: ContextAnalysisConfig;
  private state: ContextMemoryManagerState;
  private memories: Map<string, ContextMemory> = new Map();
  private globalContexts: Map<string, ContextElement> = new Map();
  private adaptationStrategies: Map<string, ContextAdaptationStrategy> = new Map();
  private inferenceCache: Map<string, ContextInference> = new Map();
  
  // 上下文检测器
  private detectors = {
    temporal: new TemporalContextDetector(),
    spatial: new SpatialContextDetector(),
    social: new SocialContextDetector(),
    topical: new TopicalContextDetector(),
    environmental: new EnvironmentalContextDetector(),
    activity: new ActivityContextDetector()
  };

  constructor(characters: AICharacter[], config?: Partial<ContextAnalysisConfig>) {
    this.config = { ...DEFAULT_CONTEXT_CONFIG, ...config };
    
    this.state = {
      isActive: true,
      totalContexts: 0,
      activeContexts: 0,
      contextChanges: 0,
      
      performance: {
        detectionAccuracy: 0.85,
        inferenceAccuracy: 0.78,
        adaptationSuccessRate: 0.72,
        averageResponseTime: 80
      },
      
      systemHealth: {
        memoryUsage: 0.3,
        processingLoad: 0.2,
        errorRate: 0.05,
        dataIntegrity: 0.98
      },
      
      currentConfig: this.config,
      lastConfigUpdate: new Date(),
      lastUpdate: new Date()
    };

    // 初始化角色上下文记忆
    this.initializeCharacterMemories(characters);
    
    // 初始化全局上下文
    this.initializeGlobalContexts();
    
    // 初始化适应策略
    this.initializeAdaptationStrategies();
    
    console.log('🌍 上下文记忆系统初始化完成');
  }

  /**
   * 处理新消息，检测和更新上下文
   */
  public async processMessage(
    message: Message,
    characters: AICharacter[],
    context: Message[],
    emotionalStates?: Map<string, EmotionalState>,
    relationships?: Map<string, Relationship>,
    interactions?: InteractionEvent[]
  ): Promise<ContextDetectionResult> {
    const startTime = Date.now();
    
    try {
      // 检测上下文变化
      const detectionResult = await this.detectContexts(
        message,
        characters,
        context,
        emotionalStates,
        relationships,
        interactions
      );
      
      // 更新角色记忆
      for (const character of characters) {
        if (!message.isPlayer || character.name === message.sender) {
          await this.updateCharacterMemory(character.id, detectionResult);
        }
      }
      
      // 执行推理
      if (this.config.inference.enabled) {
        const inferences = await this.performInferences(detectionResult.contexts);
        detectionResult.inferences.push(...inferences);
      }
      
      // 应用适应策略
      if (this.config.adaptation.enabled) {
        await this.applyAdaptationStrategies(detectionResult);
      }
      
      // 更新全局状态
      this.updateGlobalState(detectionResult);
      
      const processingTime = Date.now() - startTime;
      detectionResult.processingTime = processingTime;
      
      console.log(`🌍 上下文处理完成，检测到 ${detectionResult.contexts.length} 个上下文`);
      
      return detectionResult;
      
    } catch (error) {
      console.error('上下文处理失败:', error);
      throw error;
    }
  }

  /**
   * 检测上下文
   */
  private async detectContexts(
    message: Message,
    characters: AICharacter[],
    context: Message[],
    emotionalStates?: Map<string, EmotionalState>,
    relationships?: Map<string, Relationship>,
    interactions?: InteractionEvent[]
  ): Promise<ContextDetectionResult> {
    const detectedContexts: ContextElement[] = [];
    const changes: ContextChangeEvent[] = [];
    const inferences: ContextInference[] = [];
    
    // 时间上下文检测
    const temporalContext = this.detectors.temporal.detect(message, context);
    if (temporalContext) {
      detectedContexts.push(temporalContext);
    }
    
    // 空间上下文检测
    const spatialContext = this.detectors.spatial.detect(message, context);
    if (spatialContext) {
      detectedContexts.push(spatialContext);
    }
    
    // 社交上下文检测
    const socialContext = this.detectors.social.detect(message, characters, relationships);
    if (socialContext) {
      detectedContexts.push(socialContext);
    }
    
    // 话题上下文检测
    const topicalContext = this.detectors.topical.detect(message, context);
    if (topicalContext) {
      detectedContexts.push(topicalContext);
    }
    
    // 环境上下文检测
    const environmentalContext = this.detectors.environmental.detect(message, context);
    if (environmentalContext) {
      detectedContexts.push(environmentalContext);
    }
    
    // 活动上下文检测
    const activityContext = this.detectors.activity.detect(message, interactions);
    if (activityContext) {
      detectedContexts.push(activityContext);
    }
    
    // 检测上下文变化
    const contextChanges = this.detectContextChanges(detectedContexts);
    changes.push(...contextChanges);
    
    // 计算检测置信度
    const confidence = this.calculateDetectionConfidence(detectedContexts, context);
    
    return {
      contexts: detectedContexts,
      changes,
      inferences,
      confidence,
      processingTime: 0
    };
  }

  /**
   * 检测上下文变化
   */
  private detectContextChanges(newContexts: ContextElement[]): ContextChangeEvent[] {
    const changes: ContextChangeEvent[] = [];
    
    for (const newContext of newContexts) {
      const existingContext = this.globalContexts.get(newContext.id);
      
      if (!existingContext) {
        // 新上下文创建
        changes.push({
          id: crypto.randomUUID(),
          timestamp: new Date(),
          contextId: newContext.id,
          changeType: 'created',
          changes: [],
          impact: {
            affectedCharacters: newContext.relatedCharacters,
            impactLevel: this.assessContextImpact(newContext),
            adaptationRequired: newContext.importance === ContextImportance.CRITICAL
          },
          triggeredBy: {
            type: 'message',
            source: 'context_detection'
          }
        });
      } else {
        // 检查现有上下文的变化
        const contextChanges = this.compareContexts(existingContext, newContext);
        if (contextChanges.length > 0) {
          changes.push({
            id: crypto.randomUUID(),
            timestamp: new Date(),
            contextId: newContext.id,
            changeType: 'updated',
            changes: contextChanges,
            impact: {
              affectedCharacters: newContext.relatedCharacters,
              impactLevel: this.assessContextChangeImpact(contextChanges),
              adaptationRequired: contextChanges.some(c => c.field === 'importance')
            },
            triggeredBy: {
              type: 'message',
              source: 'context_detection'
            }
          });
        }
      }
      
      // 更新全局上下文
      this.globalContexts.set(newContext.id, newContext);
    }
    
    return changes;
  }

  /**
   * 更新角色记忆
   */
  private async updateCharacterMemory(
    characterId: string,
    detectionResult: ContextDetectionResult
  ): Promise<void> {
    let memory = this.memories.get(characterId);
    if (!memory) {
      memory = this.createEmptyMemory(characterId);
      this.memories.set(characterId, memory);
    }
    
    // 更新活跃上下文
    for (const context of detectionResult.contexts) {
      if (context.relatedCharacters.includes(characterId)) {
        memory.activeContexts.set(context.id, context);
        
        // 添加到历史记录
        this.addContextToHistory(memory, context);
      }
    }
    
    // 管理活跃上下文数量
    this.manageActiveContexts(memory);
    
    // 更新关联关系
    this.updateContextAssociations(memory, detectionResult.contexts);
    
    // 更新统计信息
    this.updateMemoryStatistics(memory);
    
    memory.lastUpdated = new Date();
  }

  /**
   * 执行推理
   */
  private async performInferences(contexts: ContextElement[]): Promise<ContextInference[]> {
    const inferences: ContextInference[] = [];
    
    for (const context of contexts) {
      // 检查缓存
      const cacheKey = `${context.id}_${context.lastUpdated.getTime()}`;
      if (this.inferenceCache.has(cacheKey)) {
        continue;
      }
      
      // 生成推理
      const inference = await this.generateInference(context);
      if (inference && inference.inference.confidence >= this.config.inference.confidenceThreshold) {
        inferences.push(inference);
        this.inferenceCache.set(cacheKey, inference);
      }
    }
    
    // 清理过期推理
    this.cleanupInferenceCache();
    
    return inferences;
  }

  /**
   * 生成推理
   */
  private async generateInference(context: ContextElement): Promise<ContextInference | null> {
    // 基于上下文类型生成不同的推理
    switch (context.type) {
      case ContextType.TEMPORAL:
        return this.generateTemporalInference(context as TemporalContext);
      
      case ContextType.SOCIAL:
        return this.generateSocialInference(context as SocialContext);
      
      case ContextType.TOPICAL:
        return this.generateTopicalInference(context as TopicalContext);
      
      case ContextType.ACTIVITY:
        return this.generateActivityInference(context as ActivityContext);
      
      default:
        return this.generateGenericInference(context);
    }
  }

  /**
   * 应用适应策略
   */
  private async applyAdaptationStrategies(detectionResult: ContextDetectionResult): Promise<void> {
    for (const context of detectionResult.contexts) {
      const applicableStrategies = Array.from(this.adaptationStrategies.values())
        .filter(strategy => strategy.applicableContexts.includes(context.type));
      
      for (const strategy of applicableStrategies) {
        if (this.shouldApplyStrategy(strategy, context)) {
          await this.executeAdaptationStrategy(strategy, context);
        }
      }
    }
  }

  /**
   * 初始化角色记忆
   */
  private initializeCharacterMemories(characters: AICharacter[]): void {
    for (const character of characters) {
      const memory = this.createEmptyMemory(character.id);
      this.memories.set(character.id, memory);
    }
  }

  /**
   * 创建空记忆
   */
  private createEmptyMemory(characterId: string): ContextMemory {
    return {
      characterId,
      activeContexts: new Map(),
      contextHistory: {
        temporal: [],
        spatial: [],
        social: [],
        topical: [],
        environmental: [],
        activity: []
      },
      associations: [],
      patterns: [],
      adaptations: [],
      statistics: {
        totalContexts: 0,
        activeContextsCount: 0,
        contextChangeFrequency: 0,
        adaptationSuccessRate: 0
      },
      createdAt: new Date(),
      lastUpdated: new Date()
    };
  }

  /**
   * 初始化全局上下文
   */
  private initializeGlobalContexts(): void {
    // 创建基础时间上下文
    const now = new Date();
    const timeContext: TemporalContext = {
      id: 'global_time',
      type: ContextType.TEMPORAL,
      name: '当前时间',
      description: '全局时间上下文',
      startTime: now,
      importance: ContextImportance.HIGH,
      stability: ContextStability.SHORT_TERM,
      confidence: 1.0,
      relatedCharacters: [],
      relatedEvents: [],
      relatedTopics: [],
      tags: ['global', 'time'],
      createdAt: now,
      lastUpdated: now,
      
      timeOfDay: this.getTimeOfDay(now),
      dayOfWeek: now.getDay(),
      season: this.getSeason(now),
      isWeekend: now.getDay() === 0 || now.getDay() === 6,
      isHoliday: false,
      isRecurring: true,
      timezone: 'UTC',
      utcOffset: 0
    };
    
    this.globalContexts.set('global_time', timeContext);
  }

  /**
   * 初始化适应策略
   */
  private initializeAdaptationStrategies(): void {
    // 社交场景适应策略
    const socialAdaptation: ContextAdaptationStrategy = {
      id: 'social_formality_adaptation',
      name: '社交正式度适应',
      description: '根据社交场景调整交流正式度',
      applicableContexts: [ContextType.SOCIAL],
      triggers: {
        conditions: ['formality_change', 'new_participant'],
        thresholds: { confidence: 0.7 }
      },
      adaptations: [
        {
          type: 'communication',
          action: 'adjust_formality',
          parameters: { factor: 0.8 },
          priority: 1
        }
      ],
      effectiveness: {
        successRate: 0.82,
        averageImprovement: 0.15,
        sideEffects: [],
        cost: 0.1
      },
      usage: {
        totalApplications: 0,
        successfulApplications: 0,
        lastUsed: new Date(),
        improvements: []
      }
    };
    
    this.adaptationStrategies.set(socialAdaptation.id, socialAdaptation);
  }

  /**
   * 辅助方法
   */
  private getTimeOfDay(date: Date): 'morning' | 'afternoon' | 'evening' | 'night' {
    const hour = date.getHours();
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 22) return 'evening';
    return 'night';
  }

  private getSeason(date: Date): 'spring' | 'summer' | 'autumn' | 'winter' {
    const month = date.getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'autumn';
    return 'winter';
  }

  private calculateDetectionConfidence(contexts: ContextElement[], messageContext: Message[]): number {
    if (contexts.length === 0) return 0;
    
    const avgConfidence = contexts.reduce((sum, ctx) => sum + ctx.confidence, 0) / contexts.length;
    const contextRichness = Math.min(1, messageContext.length / 10);
    
    return avgConfidence * 0.8 + contextRichness * 0.2;
  }

  private assessContextImpact(context: ContextElement): 'none' | 'minimal' | 'moderate' | 'significant' | 'major' {
    switch (context.importance) {
      case ContextImportance.CRITICAL: return 'major';
      case ContextImportance.HIGH: return 'significant';
      case ContextImportance.MEDIUM: return 'moderate';
      case ContextImportance.LOW: return 'minimal';
      default: return 'none';
    }
  }

  private compareContexts(oldContext: ContextElement, newContext: ContextElement): Array<{
    field: string;
    oldValue: any;
    newValue: any;
    reason: string;
  }> {
    const changes: Array<{ field: string; oldValue: any; newValue: any; reason: string; }> = [];
    
    if (oldContext.importance !== newContext.importance) {
      changes.push({
        field: 'importance',
        oldValue: oldContext.importance,
        newValue: newContext.importance,
        reason: '重要性等级变化'
      });
    }
    
    if (oldContext.confidence !== newContext.confidence) {
      changes.push({
        field: 'confidence',
        oldValue: oldContext.confidence,
        newValue: newContext.confidence,
        reason: '置信度变化'
      });
    }
    
    return changes;
  }

  private assessContextChangeImpact(changes: Array<{ field: string; oldValue: any; newValue: any; reason: string; }>): 'none' | 'minimal' | 'moderate' | 'significant' | 'major' {
    const importantFields = ['importance', 'type', 'relatedCharacters'];
    const hasImportantChange = changes.some(change => importantFields.includes(change.field));
    
    if (hasImportantChange) return 'significant';
    if (changes.length > 3) return 'moderate';
    if (changes.length > 0) return 'minimal';
    return 'none';
  }

  private addContextToHistory(memory: ContextMemory, context: ContextElement): void {
    switch (context.type) {
      case ContextType.TEMPORAL:
        memory.contextHistory.temporal.push(context as TemporalContext);
        break;
      case ContextType.SPATIAL:
        memory.contextHistory.spatial.push(context as SpatialContext);
        break;
      case ContextType.SOCIAL:
        memory.contextHistory.social.push(context as SocialContext);
        break;
      case ContextType.TOPICAL:
        memory.contextHistory.topical.push(context as TopicalContext);
        break;
      case ContextType.ENVIRONMENTAL:
        memory.contextHistory.environmental.push(context as EnvironmentalContext);
        break;
      case ContextType.ACTIVITY:
        memory.contextHistory.activity.push(context as ActivityContext);
        break;
    }
  }

  private manageActiveContexts(memory: ContextMemory): void {
    if (memory.activeContexts.size > this.config.memory.maxActiveContexts) {
      // 按重要性和时间排序，移除最不重要的
      const sortedContexts = Array.from(memory.activeContexts.entries())
        .sort((a, b) => {
          const importanceOrder = {
            [ContextImportance.CRITICAL]: 5,
            [ContextImportance.HIGH]: 4,
            [ContextImportance.MEDIUM]: 3,
            [ContextImportance.LOW]: 2,
            [ContextImportance.MINIMAL]: 1
          };
          
          const importanceDiff = importanceOrder[b[1].importance] - importanceOrder[a[1].importance];
          if (importanceDiff !== 0) return importanceDiff;
          
          return b[1].lastUpdated.getTime() - a[1].lastUpdated.getTime();
        });
      
      // 保留最重要的上下文
      const toKeep = sortedContexts.slice(0, this.config.memory.maxActiveContexts);
      memory.activeContexts.clear();
      for (const [id, context] of toKeep) {
        memory.activeContexts.set(id, context);
      }
    }
  }

  private updateContextAssociations(memory: ContextMemory, contexts: ContextElement[]): void {
    // 简化实现：检测同时出现的上下文之间的关联
    for (let i = 0; i < contexts.length; i++) {
      for (let j = i + 1; j < contexts.length; j++) {
        const ctx1 = contexts[i];
        const ctx2 = contexts[j];
        
        const existingAssociation = memory.associations.find(
          a => (a.contextId === ctx1.id && a.relatedContexts.includes(ctx2.id)) ||
               (a.contextId === ctx2.id && a.relatedContexts.includes(ctx1.id))
        );
        
        if (!existingAssociation) {
          memory.associations.push({
            contextId: ctx1.id,
            relatedContexts: [ctx2.id],
            strength: 0.3,
            type: 'coincidental'
          });
        } else {
          // 增强现有关联
          existingAssociation.strength = Math.min(1.0, existingAssociation.strength + 0.1);
        }
      }
    }
  }

  private updateMemoryStatistics(memory: ContextMemory): void {
    memory.statistics.activeContextsCount = memory.activeContexts.size;
    memory.statistics.totalContexts = Object.values(memory.contextHistory)
      .reduce((sum, history) => sum + history.length, 0);
  }

  private updateGlobalState(detectionResult: ContextDetectionResult): void {
    this.state.totalContexts += detectionResult.contexts.length;
    this.state.activeContexts = this.globalContexts.size;
    this.state.contextChanges += detectionResult.changes.length;
    this.state.lastUpdate = new Date();
  }

  private generateTemporalInference(context: TemporalContext): ContextInference | null {
    return {
      id: crypto.randomUUID(),
      contextId: context.id,
      inferenceType: 'prediction',
      inference: {
        description: `基于时间模式，预测${context.timeOfDay}时段的活动特征`,
        implications: ['角色活跃度可能变化', '交互模式可能调整'],
        recommendations: ['关注时间敏感的对话', '调整响应风格'],
        confidence: 0.75,
        timeframe: '接下来1小时'
      },
      evidence: {
        contextElements: [context.id],
        patterns: ['时间周期性'],
        historicalData: ['历史时间数据'],
        confidence: 0.8
      },
      validation: {
        status: 'pending',
        accuracy: 0,
        feedback: []
      },
      createdAt: new Date(),
      validUntil: new Date(Date.now() + this.config.inference.timeHorizon)
    };
  }

  private generateSocialInference(context: SocialContext): ContextInference | null {
    return {
      id: crypto.randomUUID(),
      contextId: context.id,
      inferenceType: 'recommendation',
      inference: {
        description: `基于社交场景${context.scenario.type}，建议调整交互方式`,
        implications: ['正式度需要调整', '角色期望可能变化'],
        recommendations: ['匹配场景正式度', '遵循社交规范'],
        confidence: 0.82,
        timeframe: '当前会话'
      },
      evidence: {
        contextElements: [context.id],
        patterns: ['社交适应'],
        historicalData: ['社交历史'],
        confidence: 0.85
      },
      validation: {
        status: 'pending',
        accuracy: 0,
        feedback: []
      },
      createdAt: new Date(),
      validUntil: new Date(Date.now() + this.config.inference.timeHorizon)
    };
  }

  private generateTopicalInference(context: TopicalContext): ContextInference | null {
    return {
      id: crypto.randomUUID(),
      contextId: context.id,
      inferenceType: 'explanation',
      inference: {
        description: `话题${context.mainTopic}的复杂度为${context.complexity}`,
        implications: ['需要相应的知识水平', '讨论深度要匹配'],
        recommendations: ['调整表达复杂度', '提供适当背景'],
        confidence: 0.78,
        timeframe: '当前话题讨论期间'
      },
      evidence: {
        contextElements: [context.id],
        patterns: ['话题复杂度模式'],
        historicalData: ['话题历史'],
        confidence: 0.8
      },
      validation: {
        status: 'pending',
        accuracy: 0,
        feedback: []
      },
      createdAt: new Date(),
      validUntil: new Date(Date.now() + this.config.inference.timeHorizon)
    };
  }

  private generateActivityInference(context: ActivityContext): ContextInference | null {
    return {
      id: crypto.randomUUID(),
      contextId: context.id,
      inferenceType: 'alert',
      inference: {
        description: `活动${context.activity.name}状态为${context.activity.status}`,
        implications: ['角色参与度会影响交互', '活动优先级需要考虑'],
        recommendations: ['关注活动进展', '协调参与度'],
        confidence: 0.73,
        timeframe: '活动持续期间'
      },
      evidence: {
        contextElements: [context.id],
        patterns: ['活动参与模式'],
        historicalData: ['活动历史'],
        confidence: 0.75
      },
      validation: {
        status: 'pending',
        accuracy: 0,
        feedback: []
      },
      createdAt: new Date(),
      validUntil: new Date(Date.now() + this.config.inference.timeHorizon)
    };
  }

  private generateGenericInference(context: ContextElement): ContextInference | null {
    return {
      id: crypto.randomUUID(),
      contextId: context.id,
      inferenceType: 'explanation',
      inference: {
        description: `检测到${context.type}类型上下文变化`,
        implications: ['可能影响角色行为', '需要适应新环境'],
        recommendations: ['监控上下文发展', '准备适应性调整'],
        confidence: 0.65,
        timeframe: '短期内'
      },
      evidence: {
        contextElements: [context.id],
        patterns: ['上下文变化模式'],
        historicalData: ['变化历史'],
        confidence: 0.7
      },
      validation: {
        status: 'pending',
        accuracy: 0,
        feedback: []
      },
      createdAt: new Date(),
      validUntil: new Date(Date.now() + this.config.inference.timeHorizon)
    };
  }

  private shouldApplyStrategy(strategy: ContextAdaptationStrategy, context: ContextElement): boolean {
    // 检查适用条件
    if (!strategy.applicableContexts.includes(context.type)) {
      return false;
    }
    
    // 检查置信度阈值
    if (context.confidence < strategy.triggers.thresholds.confidence) {
      return false;
    }
    
    // 检查成功率
    if (strategy.effectiveness.successRate < this.config.adaptation.adaptationThreshold) {
      return false;
    }
    
    return true;
  }

  private async executeAdaptationStrategy(strategy: ContextAdaptationStrategy, context: ContextElement): Promise<void> {
    try {
      // 应用适应动作
      for (const adaptation of strategy.adaptations) {
        await this.executeAdaptationAction(adaptation, context);
      }
      
      // 更新策略使用记录
      strategy.usage.totalApplications++;
      strategy.usage.lastUsed = new Date();
      
      console.log(`🎯 应用适应策略: ${strategy.name} 于上下文: ${context.name}`);
      
    } catch (error) {
      console.error('适应策略执行失败:', error);
    }
  }

  private async executeAdaptationAction(
    adaptation: { type: string; action: string; parameters: Record<string, any>; priority: number },
    context: ContextElement
  ): Promise<void> {
    // 简化实现：记录适应动作
    console.log(`执行适应动作: ${adaptation.action}, 类型: ${adaptation.type}, 参数:`, adaptation.parameters);
  }

  private cleanupInferenceCache(): void {
    const now = Date.now();
    for (const [key, inference] of this.inferenceCache.entries()) {
      if (inference.validUntil.getTime() < now) {
        this.inferenceCache.delete(key);
      }
    }
  }

  /**
   * 获取角色上下文记忆
   */
  public getCharacterMemory(characterId: string): ContextMemory | undefined {
    return this.memories.get(characterId);
  }

  /**
   * 获取活跃上下文
   */
  public getActiveContexts(characterId?: string): ContextElement[] {
    if (characterId) {
      const memory = this.memories.get(characterId);
      return memory ? Array.from(memory.activeContexts.values()) : [];
    }
    
    return Array.from(this.globalContexts.values());
  }

  /**
   * 获取管理器状态
   */
  public getState(): ContextMemoryManagerState {
    return { ...this.state };
  }

  /**
   * 清理缓存
   */
  public clearCache(): void {
    this.inferenceCache.clear();
    console.log('🧹 上下文推理缓存已清理');
  }
}

/**
 * 上下文检测器基类
 */
abstract class ContextDetector {
  abstract detect(...args: any[]): ContextElement | null;
}

/**
 * 时间上下文检测器
 */
class TemporalContextDetector extends ContextDetector {
  detect(message: Message, context: Message[]): TemporalContext | null {
    const now = message.timestamp;
    
    return {
      id: `temporal_${now.getTime()}`,
      type: ContextType.TEMPORAL,
      name: '当前时间上下文',
      description: `时间点: ${now.toLocaleString()}`,
      startTime: now,
      importance: ContextImportance.MEDIUM,
      stability: ContextStability.SHORT_TERM,
      confidence: 0.95,
      relatedCharacters: [message.sender],
      relatedEvents: [],
      relatedTopics: [],
      tags: ['time', 'current'],
      createdAt: now,
      lastUpdated: now,
      
      timeOfDay: this.getTimeOfDay(now),
      dayOfWeek: now.getDay(),
      season: this.getSeason(now),
      isWeekend: now.getDay() === 0 || now.getDay() === 6,
      isHoliday: false,
      isRecurring: false,
      timezone: 'UTC',
      utcOffset: 0
    };
  }

  private getTimeOfDay(date: Date): 'morning' | 'afternoon' | 'evening' | 'night' {
    const hour = date.getHours();
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 22) return 'evening';
    return 'night';
  }

  private getSeason(date: Date): 'spring' | 'summer' | 'autumn' | 'winter' {
    const month = date.getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'autumn';
    return 'winter';
  }
}

/**
 * 空间上下文检测器
 */
class SpatialContextDetector extends ContextDetector {
  detect(message: Message, context: Message[]): SpatialContext | null {
    // 基于消息内容检测位置关键词
    const locationKeywords = ['酒馆', '森林', '城镇', '市场', '房间', '户外', '室内'];
    const text = message.text.toLowerCase();
    
    for (const keyword of locationKeywords) {
      if (text.includes(keyword)) {
        return {
          id: `spatial_${keyword}_${Date.now()}`,
          type: ContextType.SPATIAL,
          name: `${keyword}环境`,
          description: `检测到位置: ${keyword}`,
          startTime: message.timestamp,
          importance: ContextImportance.HIGH,
          stability: ContextStability.MEDIUM_TERM,
          confidence: 0.7,
          relatedCharacters: [message.sender],
          relatedEvents: [],
          relatedTopics: [keyword],
          tags: ['location', keyword],
          createdAt: message.timestamp,
          lastUpdated: message.timestamp,
          
          location: {
            name: keyword,
            type: keyword.includes('室内') || keyword.includes('房间') ? 'indoor' : 'outdoor',
            category: keyword,
            description: `${keyword}环境`
          },
          
          atmosphere: {
            lighting: 'natural',
            noise: 'normal',
            temperature: 'warm',
            crowding: 'moderate'
          },
          
          adjacentLocations: [],
          landmarks: []
        };
      }
    }
    
    return null;
  }
}

/**
 * 社交上下文检测器
 */
class SocialContextDetector extends ContextDetector {
  detect(
    message: Message,
    characters: AICharacter[],
    relationships?: Map<string, Relationship>
  ): SocialContext | null {
    const participantCount = characters.length;
    
    // 确定场景类型
    let scenarioType: 'private' | 'public' | 'group' | 'formal' | 'casual' = 'group';
    if (participantCount <= 2) scenarioType = 'private';
    else if (participantCount > 5) scenarioType = 'public';
    
    // 确定正式度
    const formalityKeywords = ['请', '您', '敬请', '恭敬'];
    const casualKeywords = ['哈哈', '嘿', '哟', '呢'];
    const text = message.text;
    
    let formality: 'very_formal' | 'formal' | 'casual' | 'informal' | 'intimate' = 'casual';
    if (formalityKeywords.some(kw => text.includes(kw))) {
      formality = 'formal';
    } else if (casualKeywords.some(kw => text.includes(kw))) {
      formality = 'informal';
    }
    
    return {
      id: `social_${Date.now()}`,
      type: ContextType.SOCIAL,
      name: '社交场景',
      description: `${participantCount}人${scenarioType}场景`,
      startTime: message.timestamp,
      importance: ContextImportance.HIGH,
      stability: ContextStability.MEDIUM_TERM,
      confidence: 0.8,
      relatedCharacters: characters.map(c => c.id),
      relatedEvents: [],
      relatedTopics: ['social'],
      tags: ['social', scenarioType, formality],
      createdAt: message.timestamp,
      lastUpdated: message.timestamp,
      
      scenario: {
        type: scenarioType,
        size: participantCount,
        formality
      },
      
      relationships: characters.map(c => ({
        characterId: c.id,
        role: c.name === message.sender ? 'speaker' : 'listener',
        influence: 0.5
      })),
      
      norms: ['礼貌交流', '轮流发言'],
      taboos: ['人身攻击', '敏感话题'],
      expectations: ['积极参与', '相互尊重']
    };
  }
}

/**
 * 话题上下文检测器
 */
class TopicalContextDetector extends ContextDetector {
  private topicKeywords = new Map([
    ['学习', ['学习', '知识', '教学', '研究', '书']],
    ['游戏', ['游戏', '玩', '娱乐', '比赛', '竞技']],
    ['工作', ['工作', '任务', '职业', '项目', '计划']],
    ['生活', ['生活', '日常', '家庭', '朋友', '健康']],
    ['情感', ['爱', '喜欢', '讨厌', '开心', '难过', '愤怒']],
    ['技术', ['技术', '科技', '电脑', '软件', '编程']],
    ['艺术', ['艺术', '绘画', '音乐', '表演', '创作']],
    ['冒险', ['冒险', '探索', '旅行', '发现', '挑战']]
  ]);

  detect(message: Message, context: Message[]): TopicalContext | null {
    const text = message.text.toLowerCase();
    
    for (const [topic, keywords] of this.topicKeywords.entries()) {
      if (keywords.some(keyword => text.includes(keyword))) {
        // 评估复杂度
        const complexity = this.assessComplexity(text, keywords);
        
        return {
          id: `topical_${topic}_${Date.now()}`,
          type: ContextType.TOPICAL,
          name: `${topic}话题`,
          description: `当前讨论: ${topic}`,
          startTime: message.timestamp,
          importance: ContextImportance.MEDIUM,
          stability: ContextStability.SHORT_TERM,
          confidence: 0.75,
          relatedCharacters: [message.sender],
          relatedEvents: [],
          relatedTopics: [topic],
          tags: ['topic', topic],
          createdAt: message.timestamp,
          lastUpdated: message.timestamp,
          
          mainTopic: topic,
          subTopics: keywords.filter(kw => text.includes(kw)),
          keywords: keywords,
          complexity,
          sensitivity: 'public',
          urgency: 'normal',
          previousDiscussions: [],
          requiredKnowledge: [],
          prerequisites: []
        };
      }
    }
    
    return null;
  }

  private assessComplexity(text: string, keywords: string[]): 'simple' | 'moderate' | 'complex' | 'expert' {
    const matchCount = keywords.filter(kw => text.includes(kw)).length;
    const textLength = text.length;
    
    if (matchCount >= 3 && textLength > 100) return 'complex';
    if (matchCount >= 2 || textLength > 50) return 'moderate';
    return 'simple';
  }
}

/**
 * 环境上下文检测器
 */
class EnvironmentalContextDetector extends ContextDetector {
  detect(message: Message, context: Message[]): EnvironmentalContext | null {
    const text = message.text.toLowerCase();
    const weatherKeywords = ['晴天', '下雨', '多云', '暴风雨', '下雪'];
    const eventKeywords = ['庆祝', '节日', '紧急', '危险', '特殊'];
    
    let detectedWeather = null;
    for (const weather of weatherKeywords) {
      if (text.includes(weather)) {
        detectedWeather = weather;
        break;
      }
    }
    
    let detectedEvent = null;
    for (const event of eventKeywords) {
      if (text.includes(event)) {
        detectedEvent = event;
        break;
      }
    }
    
    if (detectedWeather || detectedEvent) {
      return {
        id: `environmental_${Date.now()}`,
        type: ContextType.ENVIRONMENTAL,
        name: '环境上下文',
        description: `环境特征: ${detectedWeather || detectedEvent}`,
        startTime: message.timestamp,
        importance: ContextImportance.MEDIUM,
        stability: ContextStability.SHORT_TERM,
        confidence: 0.6,
        relatedCharacters: [message.sender],
        relatedEvents: [],
        relatedTopics: ['environment'],
        tags: ['environment', detectedWeather || detectedEvent].filter(Boolean) as string[],
        createdAt: message.timestamp,
        lastUpdated: message.timestamp,
        
        weather: detectedWeather ? {
          condition: this.mapWeatherCondition(detectedWeather),
          temperature: 20,
          humidity: 60,
          windSpeed: 5
        } : undefined,
        
        events: detectedEvent ? [{
          type: this.mapEventType(detectedEvent),
          status: 'ongoing',
          impact: 'medium'
        }] : [],
        
        resources: []
      };
    }
    
    return null;
  }

  private mapWeatherCondition(weather: string): 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'snowy' {
    if (weather.includes('晴')) return 'sunny';
    if (weather.includes('雨')) return 'rainy';
    if (weather.includes('云')) return 'cloudy';
    if (weather.includes('暴风')) return 'stormy';
    if (weather.includes('雪')) return 'snowy';
    return 'sunny';
  }

  private mapEventType(event: string): 'celebration' | 'conflict' | 'emergency' | 'routine' | 'special' {
    if (event.includes('庆祝') || event.includes('节日')) return 'celebration';
    if (event.includes('紧急') || event.includes('危险')) return 'emergency';
    if (event.includes('特殊')) return 'special';
    return 'routine';
  }
}

/**
 * 活动上下文检测器
 */
class ActivityContextDetector extends ContextDetector {
  detect(message: Message, interactions?: InteractionEvent[]): ActivityContext | null {
    const text = message.text.toLowerCase();
    const activityKeywords = {
      'work': ['工作', '任务', '完成', '项目'],
      'leisure': ['休息', '放松', '娱乐', '玩'],
      'social': ['聊天', '交流', '分享', '讨论'],
      'learning': ['学习', '练习', '研究', '探索'],
      'survival': ['寻找', '收集', '保护', '逃跑'],
      'combat': ['战斗', '攻击', '防御', '对抗']
    };
    
    for (const [category, keywords] of Object.entries(activityKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return {
          id: `activity_${category}_${Date.now()}`,
          type: ContextType.ACTIVITY,
          name: `${category}活动`,
          description: `当前进行: ${category}类活动`,
          startTime: message.timestamp,
          importance: ContextImportance.MEDIUM,
          stability: ContextStability.MEDIUM_TERM,
          confidence: 0.7,
          relatedCharacters: [message.sender],
          relatedEvents: [],
          relatedTopics: [category],
          tags: ['activity', category],
          createdAt: message.timestamp,
          lastUpdated: message.timestamp,
          
          activity: {
            name: `${category}活动`,
            category: category as any,
            status: 'active',
            priority: 'normal'
          },
          
          participants: [{
            characterId: message.sender,
            role: 'participant',
            involvement: 0.8
          }],
          
          objectives: [keywords[0]],
          progress: 0.3,
          challenges: [],
          achievements: []
        };
      }
    }
    
    return null;
  }
} 