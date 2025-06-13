/**
 * 综合记忆整合管理器
 * 统一管理和整合AI角色的所有记忆子系统
 */

import {
  MemoryType,
  MemoryImportance,
  ConsolidationStatus,
  MemoryUnit,
  EpisodicMemory,
  SemanticMemory,
  ProceduralMemory,
  AutobiographicalMemory,
  MemoryAssociation,
  MemoryCluster,
  MemoryPattern,
  MemoryIntegrationResult,
  MemoryQuery,
  MemorySearchResult,
  IntegratedMemoryState,
  MemoryIntegrationConfig,
  MemoryInsight,
  MemoryConsistencyCheck,
  MemoryEvolution,
  MemoryManagerState,
  MemorySnapshot
} from '@/types/memory';

import { Message, AICharacter } from '@/types/tavern';
import { EmotionalTracker } from './emotionTracker';
import { RelationshipManager } from './relationshipManager';
import { InteractionMemoryManager } from './interactionMemoryManager';
import { ContextMemoryManager } from './contextMemoryManager';
import { EmotionalState } from '@/types/emotion';
import { Relationship } from '@/types/relationship';
import { InteractionEvent } from '@/types/interaction';
import { ContextElement } from '@/types/context';

/**
 * 默认综合记忆配置
 */
const DEFAULT_MEMORY_CONFIG: MemoryIntegrationConfig = {
  triggers: {
    memoryThreshold: 100,           // 记忆数量达到100时触发整合
    timeThreshold: 3600000,         // 1小时触发整合
    importanceThreshold: MemoryImportance.NOTABLE,
    coherenceThreshold: 0.6
  },
  
  strategies: {
    enableSynthesis: true,
    enableCompression: true,
    enablePatternDiscovery: true,
    enableConflictResolution: true
  },
  
  parameters: {
    maxIntegrationsPerCycle: 10,
    associationThreshold: 0.5,
    clusteringThreshold: 0.7,
    patternMinSupport: 0.3
  },
  
  performance: {
    maxMemorySize: 1000,
    archiveOldMemories: true,
    compressionRatio: 0.3,
    backgroundProcessing: true
  }
};

/**
 * 记忆整合处理结果
 */
interface MemoryProcessingResult {
  newMemories: MemoryUnit[];
  integrationResults: MemoryIntegrationResult[];
  insights: MemoryInsight[];
  consistencyCheck: MemoryConsistencyCheck;
  processingTime: number;
}

/**
 * 综合记忆整合管理器
 */
export class IntegratedMemoryManager {
  private config: MemoryIntegrationConfig;
  private state: MemoryManagerState;
  
  // 子系统管理器
  private emotionalTracker: EmotionalTracker;
  private relationshipManager: RelationshipManager;
  private interactionManager: InteractionMemoryManager;
  private contextManager: ContextMemoryManager;
  
  // 记忆存储
  private memories: Map<string, Map<string, MemoryUnit>> = new Map(); // characterId -> memoryId -> memory
  private associations: Map<string, MemoryAssociation[]> = new Map();
  private clusters: Map<string, MemoryCluster[]> = new Map();
  private patterns: Map<string, MemoryPattern[]> = new Map();
  private insights: Map<string, MemoryInsight[]> = new Map();
  
  // 缓存和索引
  private memoryIndex: Map<string, Map<string, string[]>> = new Map(); // characterId -> keyword -> memoryIds
  private patternCache: Map<string, MemoryPattern[]> = new Map();
  private lastIntegration: Map<string, Date> = new Map();

  constructor(
    characters: AICharacter[],
    config?: Partial<MemoryIntegrationConfig>
  ) {
    this.config = { ...DEFAULT_MEMORY_CONFIG, ...config };
    
    // 初始化子系统
    this.emotionalTracker = new EmotionalTracker(characters);
    this.relationshipManager = new RelationshipManager(characters);
    this.interactionManager = new InteractionMemoryManager(characters);
    this.contextManager = new ContextMemoryManager(characters);
    
    // 初始化状态
    this.state = {
      isActive: true,
      totalCharacters: characters.length,
      totalMemories: 0,
      
      subsystems: {
        emotional: true,
        relationship: true,
        interaction: true,
        context: true
      },
      
      performance: {
        integrationSuccessRate: 0.85,
        retrievalAccuracy: 0.88,
        consistencyScore: 0.82,
        averageProcessingTime: 120
      },
      
      systemHealth: {
        memoryIntegrity: 0.95,
        processingEfficiency: 0.88,
        resourceUtilization: 0.65,
        errorRate: 0.03
      },
      
      currentConfig: this.config,
      lastConfigUpdate: new Date(),
      lastIntegration: new Date(),
      lastUpdate: new Date()
    };
    
    // 初始化角色记忆存储
    this.initializeCharacterMemories(characters);
    
    console.log('🧠 综合记忆整合系统初始化完成');
  }

  /**
   * 处理新消息，更新所有记忆子系统
   */
  public async processMessage(
    message: Message,
    characters: AICharacter[],
    context: Message[]
  ): Promise<MemoryProcessingResult> {
    const startTime = Date.now();
    
    try {
      // 1. 更新各子系统
      const emotionalResult = await this.emotionalTracker.processMessage(message, characters, context);
      const relationshipResult = await this.relationshipManager.processMessage(message, characters, context);
      const interactionResult = await this.interactionManager.processMessage(message, characters, context);
      const contextResult = await this.contextManager.processMessage(message, characters, context);
      
      // 2. 从子系统提取记忆单元
      const newMemories = await this.extractMemoriesFromSubsystems(
        message,
        characters,
        emotionalResult,
        relationshipResult,
        interactionResult,
        contextResult
      );
      
      // 3. 存储新记忆
      for (const memory of newMemories) {
        await this.storeMemory(memory);
      }
      
      // 4. 执行记忆整合
      const integrationResults: MemoryIntegrationResult[] = [];
      for (const character of characters) {
        if (this.shouldTriggerIntegration(character.id)) {
          const result = await this.performMemoryIntegration(character.id);
          integrationResults.push(...result);
        }
      }
      
      // 5. 生成洞察
      const insights = await this.generateInsights(characters);
      
      // 6. 执行一致性检查
      const consistencyCheck = await this.performConsistencyCheck(characters);
      
      // 7. 更新系统状态
      this.updateSystemState();
      
      const processingTime = Date.now() - startTime;
      
      console.log(`🧠 记忆处理完成，新增 ${newMemories.length} 个记忆单元，执行 ${integrationResults.length} 次整合`);
      
      return {
        newMemories,
        integrationResults,
        insights,
        consistencyCheck,
        processingTime
      };
      
    } catch (error) {
      console.error('记忆处理失败:', error);
      throw error;
    }
  }

  /**
   * 从子系统提取记忆单元
   */
  private async extractMemoriesFromSubsystems(
    message: Message,
    characters: AICharacter[],
    emotionalResult: any,
    relationshipResult: any,
    interactionResult: any,
    contextResult: any
  ): Promise<MemoryUnit[]> {
    const memories: MemoryUnit[] = [];
    
    for (const character of characters) {
      // 情感记忆
      if (emotionalResult.emotions) {
        const emotionalMemory = this.createEmotionalMemory(
          character.id,
          message,
          emotionalResult.emotions
        );
        if (emotionalMemory) memories.push(emotionalMemory);
      }
      
      // 关系记忆
      if (relationshipResult.relationships) {
        const relationshipMemory = this.createRelationshipMemory(
          character.id,
          message,
          relationshipResult.relationships
        );
        if (relationshipMemory) memories.push(relationshipMemory);
      }
      
      // 交互记忆
      if (interactionResult.interactions) {
        const interactionMemory = this.createInteractionMemory(
          character.id,
          message,
          interactionResult.interactions
        );
        if (interactionMemory) memories.push(interactionMemory);
      }
      
      // 上下文记忆
      if (contextResult.contexts) {
        const contextMemory = this.createContextMemory(
          character.id,
          message,
          contextResult.contexts
        );
        if (contextMemory) memories.push(contextMemory);
      }
      
      // 情节记忆（基于消息内容）
      const episodicMemory = this.createEpisodicMemory(character.id, message, characters);
      if (episodicMemory) memories.push(episodicMemory);
    }
    
    return memories;
  }

  /**
   * 创建情感记忆
   */
  private createEmotionalMemory(
    characterId: string,
    message: Message,
    emotions: EmotionalState[]
  ): MemoryUnit | null {
    const relevantEmotion = emotions.find(e => e.characterId === characterId);
    if (!relevantEmotion || relevantEmotion.intensity < 0.3) return null;
    
    return {
      id: crypto.randomUUID(),
      type: MemoryType.EMOTIONAL,
      characterId,
      title: `情感体验: ${relevantEmotion.primaryEmotion}`,
      description: `在${message.timestamp.toLocaleString()}体验到${relevantEmotion.primaryEmotion}情感`,
      content: {
        emotion: relevantEmotion.primaryEmotion,
        intensity: relevantEmotion.intensity,
        trigger: message.text,
        context: relevantEmotion.context,
        physiological: relevantEmotion.physiological,
        cognitive: relevantEmotion.cognitive
      },
      timestamp: message.timestamp,
      importance: this.assessEmotionalImportance(relevantEmotion.intensity),
      strength: relevantEmotion.intensity,
      vividness: relevantEmotion.intensity,
      relatedMemories: [],
      relatedCharacters: [message.sender],
      relatedEvents: [],
      tags: ['emotion', relevantEmotion.primaryEmotion],
      consolidationStatus: ConsolidationStatus.FRESH,
      lastAccessed: new Date(),
      accessCount: 0,
      source: 'emotion_tracker',
      confidence: 0.85,
      createdAt: new Date(),
      lastUpdated: new Date()
    };
  }

  /**
   * 创建关系记忆
   */
  private createRelationshipMemory(
    characterId: string,
    message: Message,
    relationships: Relationship[]
  ): MemoryUnit | null {
    const relevantRelationship = relationships.find(r => 
      r.characterId === characterId || r.targetId === characterId
    );
    if (!relevantRelationship) return null;
    
    return {
      id: crypto.randomUUID(),
      type: MemoryType.RELATIONSHIP,
      characterId,
      title: `关系互动: ${relevantRelationship.type}`,
      description: `与${relevantRelationship.targetId}的${relevantRelationship.type}关系互动`,
      content: {
        relationship: relevantRelationship,
        interaction: message.text,
        impact: this.calculateRelationshipImpact(relevantRelationship)
      },
      timestamp: message.timestamp,
      importance: this.assessRelationshipImportance(relevantRelationship),
      strength: relevantRelationship.strength,
      vividness: relevantRelationship.intensity,
      relatedMemories: [],
      relatedCharacters: [relevantRelationship.targetId],
      relatedEvents: [],
      tags: ['relationship', relevantRelationship.type],
      consolidationStatus: ConsolidationStatus.FRESH,
      lastAccessed: new Date(),
      accessCount: 0,
      source: 'relationship_manager',
      confidence: 0.8,
      createdAt: new Date(),
      lastUpdated: new Date()
    };
  }

  /**
   * 创建交互记忆
   */
  private createInteractionMemory(
    characterId: string,
    message: Message,
    interactions: InteractionEvent[]
  ): MemoryUnit | null {
    const relevantInteraction = interactions.find(i => 
      i.participants.includes(characterId)
    );
    if (!relevantInteraction) return null;
    
    return {
      id: crypto.randomUUID(),
      type: MemoryType.INTERACTION,
      characterId,
      title: `交互体验: ${relevantInteraction.type}`,
      description: `参与${relevantInteraction.type}类型的交互`,
      content: {
        interaction: relevantInteraction,
        role: this.determineInteractionRole(characterId, relevantInteraction),
        outcome: relevantInteraction.outcome
      },
      timestamp: message.timestamp,
      importance: this.assessInteractionImportance(relevantInteraction),
      strength: relevantInteraction.quality?.overall || 0.5,
      vividness: relevantInteraction.engagement || 0.5,
      relatedMemories: [],
      relatedCharacters: relevantInteraction.participants,
      relatedEvents: [],
      tags: ['interaction', relevantInteraction.type],
      consolidationStatus: ConsolidationStatus.FRESH,
      lastAccessed: new Date(),
      accessCount: 0,
      source: 'interaction_manager',
      confidence: 0.75,
      createdAt: new Date(),
      lastUpdated: new Date()
    };
  }

  /**
   * 创建上下文记忆
   */
  private createContextMemory(
    characterId: string,
    message: Message,
    contexts: ContextElement[]
  ): MemoryUnit | null {
    const relevantContext = contexts.find(c => 
      c.relatedCharacters.includes(characterId)
    );
    if (!relevantContext) return null;
    
    return {
      id: crypto.randomUUID(),
      type: MemoryType.CONTEXT,
      characterId,
      title: `环境感知: ${relevantContext.name}`,
      description: `感知到${relevantContext.type}类型的环境上下文`,
      content: {
        context: relevantContext,
        awareness: this.calculateContextAwareness(relevantContext),
        adaptation: this.suggestContextAdaptation(relevantContext)
      },
      timestamp: message.timestamp,
      importance: this.mapContextImportance(relevantContext.importance),
      strength: relevantContext.confidence,
      vividness: relevantContext.confidence,
      relatedMemories: [],
      relatedCharacters: relevantContext.relatedCharacters,
      relatedEvents: relevantContext.relatedEvents,
      tags: ['context', relevantContext.type],
      consolidationStatus: ConsolidationStatus.FRESH,
      lastAccessed: new Date(),
      accessCount: 0,
      source: 'context_manager',
      confidence: relevantContext.confidence,
      createdAt: new Date(),
      lastUpdated: new Date()
    };
  }

  /**
   * 创建情节记忆
   */
  private createEpisodicMemory(
    characterId: string,
    message: Message,
    characters: AICharacter[]
  ): EpisodicMemory | null {
    // 只为重要的消息创建情节记忆
    if (message.text.length < 20) return null;
    
    const participants = characters
      .filter(c => c.name === message.sender || !message.isPlayer)
      .map(c => c.id);
    
    return {
      id: crypto.randomUUID(),
      type: MemoryType.EPISODIC,
      characterId,
      title: `对话记忆: ${message.text.substring(0, 30)}...`,
      description: `与${message.sender}的对话记忆`,
      content: {
        event: {
          type: 'conversation',
          description: message.text,
          participants,
          outcome: this.assessConversationOutcome(message)
        },
        sensoryDetails: {
          auditory: [message.text],
          emotional: this.extractEmotionalCues(message.text)
        },
        contextualFactors: {
          timeOfDay: this.getTimeOfDay(message.timestamp),
          mood: this.inferMoodFromMessage(message.text)
        }
      },
      timestamp: message.timestamp,
      importance: this.assessMessageImportance(message),
      strength: this.calculateMemoryStrength(message),
      vividness: this.calculateMemoryVividness(message),
      relatedMemories: [],
      relatedCharacters: participants,
      relatedEvents: [],
      tags: ['conversation', 'episodic'],
      consolidationStatus: ConsolidationStatus.FRESH,
      lastAccessed: new Date(),
      accessCount: 0,
      source: 'integrated_manager',
      confidence: 0.9,
      createdAt: new Date(),
      lastUpdated: new Date()
    };
  }

  /**
   * 存储记忆
   */
  private async storeMemory(memory: MemoryUnit): Promise<void> {
    let characterMemories = this.memories.get(memory.characterId);
    if (!characterMemories) {
      characterMemories = new Map();
      this.memories.set(memory.characterId, characterMemories);
    }
    
    characterMemories.set(memory.id, memory);
    
    // 更新索引
    this.updateMemoryIndex(memory);
    
    // 管理容量
    await this.manageMemoryCapacity(memory.characterId);
    
    console.log(`💾 存储记忆: ${memory.title} (${memory.type})`);
  }

  /**
   * 执行记忆整合
   */
  private async performMemoryIntegration(characterId: string): Promise<MemoryIntegrationResult[]> {
    const results: MemoryIntegrationResult[] = [];
    const memories = this.memories.get(characterId);
    if (!memories) return results;
    
    const memoryArray = Array.from(memories.values());
    
    // 1. 记忆综合
    if (this.config.strategies.enableSynthesis) {
      const synthesisResult = await this.performMemorySynthesis(characterId, memoryArray);
      if (synthesisResult) results.push(synthesisResult);
    }
    
    // 2. 记忆压缩
    if (this.config.strategies.enableCompression) {
      const compressionResult = await this.performMemoryCompression(characterId, memoryArray);
      if (compressionResult) results.push(compressionResult);
    }
    
    // 3. 模式发现
    if (this.config.strategies.enablePatternDiscovery) {
      const patternResult = await this.performPatternDiscovery(characterId, memoryArray);
      if (patternResult) results.push(patternResult);
    }
    
    // 4. 冲突解决
    if (this.config.strategies.enableConflictResolution) {
      const conflictResult = await this.performConflictResolution(characterId, memoryArray);
      if (conflictResult) results.push(conflictResult);
    }
    
    // 更新最后整合时间
    this.lastIntegration.set(characterId, new Date());
    
    return results;
  }

  /**
   * 记忆综合
   */
  private async performMemorySynthesis(
    characterId: string,
    memories: MemoryUnit[]
  ): Promise<MemoryIntegrationResult | null> {
    // 寻找相似的记忆进行综合
    const similarGroups = this.findSimilarMemories(memories, 0.7);
    if (similarGroups.length === 0) return null;
    
    const synthesizedMemories: MemoryUnit[] = [];
    const processedMemoryIds: string[] = [];
    
    for (const group of similarGroups) {
      if (group.length >= 3) { // 至少3个相似记忆才综合
        const synthesized = this.synthesizeMemoryGroup(characterId, group);
        if (synthesized) {
          synthesizedMemories.push(synthesized);
          processedMemoryIds.push(...group.map(m => m.id));
        }
      }
    }
    
    if (synthesizedMemories.length === 0) return null;
    
    // 存储综合后的记忆
    for (const memory of synthesizedMemories) {
      await this.storeMemory(memory);
    }
    
    return {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      integrationType: 'synthesis',
      inputMemories: processedMemoryIds,
      outputMemories: synthesizedMemories.map(m => m.id),
      modifiedMemories: [],
      archivedMemories: processedMemoryIds,
      description: `综合了${processedMemoryIds.length}个相似记忆，生成${synthesizedMemories.length}个综合记忆`,
      rationale: '通过识别相似模式和主题，将相关记忆综合为更紧凑的表示',
      quality: {
        coherence: 0.85,
        completeness: 0.8,
        consistency: 0.9,
        novelty: 0.6
      },
      confidence: 0.8
    };
  }

  /**
   * 记忆压缩
   */
  private async performMemoryCompression(
    characterId: string,
    memories: MemoryUnit[]
  ): Promise<MemoryIntegrationResult | null> {
    // 识别低重要性的旧记忆进行压缩
    const candidatesForCompression = memories.filter(m => 
      m.importance === MemoryImportance.TRIVIAL || 
      m.importance === MemoryImportance.ROUTINE
    ).filter(m => {
      const age = Date.now() - m.timestamp.getTime();
      return age > 24 * 60 * 60 * 1000; // 超过24小时
    });
    
    if (candidatesForCompression.length < 5) return null;
    
    // 创建压缩记忆
    const compressedMemory = this.createCompressedMemory(characterId, candidatesForCompression);
    await this.storeMemory(compressedMemory);
    
    // 归档原始记忆
    const archivedIds = candidatesForCompression.map(m => m.id);
    for (const id of archivedIds) {
      const memory = this.memories.get(characterId)?.get(id);
      if (memory) {
        memory.consolidationStatus = ConsolidationStatus.ARCHIVED;
      }
    }
    
    return {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      integrationType: 'compression',
      inputMemories: archivedIds,
      outputMemories: [compressedMemory.id],
      modifiedMemories: [],
      archivedMemories: archivedIds,
      description: `压缩了${archivedIds.length}个低重要性记忆`,
      rationale: '将多个相似的低重要性记忆压缩为简洁的摘要表示',
      quality: {
        coherence: 0.7,
        completeness: 0.6,
        consistency: 0.8,
        novelty: 0.3
      },
      confidence: 0.75
    };
  }

  /**
   * 模式发现
   */
  private async performPatternDiscovery(
    characterId: string,
    memories: MemoryUnit[]
  ): Promise<MemoryIntegrationResult | null> {
    const patterns = this.discoverMemoryPatterns(memories);
    if (patterns.length === 0) return null;
    
    // 存储发现的模式
    let characterPatterns = this.patterns.get(characterId);
    if (!characterPatterns) {
      characterPatterns = [];
      this.patterns.set(characterId, characterPatterns);
    }
    characterPatterns.push(...patterns);
    
    // 基于模式创建语义记忆
    const semanticMemories: MemoryUnit[] = [];
    for (const pattern of patterns) {
      const semanticMemory = this.createSemanticMemoryFromPattern(characterId, pattern);
      if (semanticMemory) {
        semanticMemories.push(semanticMemory);
        await this.storeMemory(semanticMemory);
      }
    }
    
    return {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      integrationType: 'pattern_discovery',
      inputMemories: memories.map(m => m.id),
      outputMemories: semanticMemories.map(m => m.id),
      modifiedMemories: [],
      archivedMemories: [],
      description: `发现了${patterns.length}个记忆模式，生成${semanticMemories.length}个语义记忆`,
      rationale: '通过分析记忆序列和关联，识别出反复出现的模式和概念',
      quality: {
        coherence: 0.8,
        completeness: 0.7,
        consistency: 0.85,
        novelty: 0.9
      },
      confidence: 0.78
    };
  }

  /**
   * 冲突解决
   */
  private async performConflictResolution(
    characterId: string,
    memories: MemoryUnit[]
  ): Promise<MemoryIntegrationResult | null> {
    const conflicts = this.detectMemoryConflicts(memories);
    if (conflicts.length === 0) return null;
    
    const resolvedMemories: MemoryUnit[] = [];
    const modifiedMemoryIds: string[] = [];
    
    for (const conflict of conflicts) {
      const resolution = this.resolveMemoryConflict(characterId, conflict);
      if (resolution) {
        resolvedMemories.push(resolution);
        modifiedMemoryIds.push(...conflict.memoryIds);
        await this.storeMemory(resolution);
      }
    }
    
    return {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      integrationType: 'conflict_resolution',
      inputMemories: modifiedMemoryIds,
      outputMemories: resolvedMemories.map(m => m.id),
      modifiedMemories: modifiedMemoryIds,
      archivedMemories: [],
      description: `解决了${conflicts.length}个记忆冲突`,
      rationale: '通过分析证据强度和时间关系，解决矛盾的记忆内容',
      quality: {
        coherence: 0.9,
        completeness: 0.85,
        consistency: 0.95,
        novelty: 0.4
      },
      confidence: 0.82
    };
  }

  /**
   * 记忆检索
   */
  public async searchMemories(
    characterId: string,
    query: MemoryQuery
  ): Promise<MemorySearchResult[]> {
    const memories = this.memories.get(characterId);
    if (!memories) return [];
    
    const results: MemorySearchResult[] = [];
    
    for (const memory of memories.values()) {
      // 跳过已归档的记忆（除非明确要求）
      if (memory.consolidationStatus === ConsolidationStatus.ARCHIVED && !query.includeArchived) {
        continue;
      }
      
      const relevance = this.calculateMemoryRelevance(memory, query);
      if (relevance >= (query.minRelevance || 0.3)) {
        results.push({
          memory,
          relevance,
          reasoning: this.generateRetrievalReasoning(memory, query),
          context: this.generateRetrievalContext(memory, query)
        });
      }
    }
    
    // 排序和限制结果
    results.sort((a, b) => {
      switch (query.sortBy) {
        case 'recency':
          return b.memory.timestamp.getTime() - a.memory.timestamp.getTime();
        case 'importance':
          return this.getImportanceValue(b.memory.importance) - this.getImportanceValue(a.memory.importance);
        case 'strength':
          return b.memory.strength - a.memory.strength;
        default: // relevance
          return b.relevance - a.relevance;
      }
    });
    
    return results.slice(0, query.maxResults || 10);
  }

  /**
   * 生成记忆洞察
   */
  private async generateInsights(characters: AICharacter[]): Promise<MemoryInsight[]> {
    const insights: MemoryInsight[] = [];
    
    for (const character of characters) {
      const characterMemories = this.memories.get(character.id);
      if (!characterMemories) continue;
      
      // 模式洞察
      const patternInsights = this.generatePatternInsights(character.id, Array.from(characterMemories.values()));
      insights.push(...patternInsights);
      
      // 趋势洞察
      const trendInsights = this.generateTrendInsights(character.id, Array.from(characterMemories.values()));
      insights.push(...trendInsights);
      
      // 缺口洞察
      const gapInsights = this.generateGapInsights(character.id, Array.from(characterMemories.values()));
      insights.push(...gapInsights);
    }
    
    return insights;
  }

  /**
   * 执行一致性检查
   */
  private async performConsistencyCheck(characters: AICharacter[]): Promise<MemoryConsistencyCheck> {
    const allConflicts: any[] = [];
    let totalMemories = 0;
    let totalInconsistencies = 0;
    
    for (const character of characters) {
      const memories = this.memories.get(character.id);
      if (!memories) continue;
      
      const memoryArray = Array.from(memories.values());
      totalMemories += memoryArray.length;
      
      const conflicts = this.detectMemoryConflicts(memoryArray);
      allConflicts.push(...conflicts);
      totalInconsistencies += conflicts.length;
    }
    
    const overallConsistency = totalMemories > 0 ? 1 - (totalInconsistencies / totalMemories) : 1;
    
    return {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      overallConsistency,
      conflicts: allConflicts,
      inconsistencies: {
        total: totalInconsistencies,
        byType: this.groupConflictsByType(allConflicts),
        bySeverity: this.groupConflictsBySeverity(allConflicts)
      },
      recommendations: this.generateConsistencyRecommendations(allConflicts)
    };
  }

  /**
   * 获取角色记忆状态
   */
  public getCharacterMemoryState(characterId: string): IntegratedMemoryState | null {
    const memories = this.memories.get(characterId);
    if (!memories) return null;
    
    const memoryArray = Array.from(memories.values());
    
    return {
      characterId,
      statistics: this.calculateMemoryStatistics(memoryArray),
      health: this.assessMemoryHealth(memoryArray),
      recentActivity: this.calculateRecentActivity(characterId),
      capacity: this.calculateMemoryCapacity(memoryArray),
      lastUpdate: new Date()
    };
  }

  /**
   * 创建记忆快照
   */
  public createMemorySnapshot(characterId: string, description: string): MemorySnapshot | null {
    const memories = this.memories.get(characterId);
    const associations = this.associations.get(characterId);
    const clusters = this.clusters.get(characterId);
    const patterns = this.patterns.get(characterId);
    
    if (!memories) return null;
    
    return {
      id: crypto.randomUUID(),
      characterId,
      timestamp: new Date(),
      memories: Array.from(memories.values()),
      associations: associations || [],
      clusters: clusters || [],
      patterns: patterns || [],
      version: '1.0',
      description
    };
  }

  /**
   * 辅助方法实现
   */
  private initializeCharacterMemories(characters: AICharacter[]): void {
    for (const character of characters) {
      this.memories.set(character.id, new Map());
      this.associations.set(character.id, []);
      this.clusters.set(character.id, []);
      this.patterns.set(character.id, []);
      this.insights.set(character.id, []);
      this.memoryIndex.set(character.id, new Map());
      this.lastIntegration.set(character.id, new Date());
    }
  }

  private shouldTriggerIntegration(characterId: string): boolean {
    const memories = this.memories.get(characterId);
    if (!memories) return false;
    
    const memoryCount = memories.size;
    const lastIntegration = this.lastIntegration.get(characterId);
    const timeSinceLastIntegration = lastIntegration ? Date.now() - lastIntegration.getTime() : Infinity;
    
    return (
      memoryCount >= this.config.triggers.memoryThreshold ||
      timeSinceLastIntegration >= this.config.triggers.timeThreshold
    );
  }

  private assessEmotionalImportance(intensity: number): MemoryImportance {
    if (intensity >= 0.8) return MemoryImportance.CORE;
    if (intensity >= 0.6) return MemoryImportance.SIGNIFICANT;
    if (intensity >= 0.4) return MemoryImportance.NOTABLE;
    if (intensity >= 0.2) return MemoryImportance.ROUTINE;
    return MemoryImportance.TRIVIAL;
  }

  private assessRelationshipImportance(relationship: Relationship): MemoryImportance {
    const strengthFactor = relationship.strength;
    const typeFactor = relationship.type === 'friend' || relationship.type === 'enemy' ? 1.2 : 1.0;
    const combinedScore = strengthFactor * typeFactor;
    
    if (combinedScore >= 0.8) return MemoryImportance.CORE;
    if (combinedScore >= 0.6) return MemoryImportance.SIGNIFICANT;
    if (combinedScore >= 0.4) return MemoryImportance.NOTABLE;
    if (combinedScore >= 0.2) return MemoryImportance.ROUTINE;
    return MemoryImportance.TRIVIAL;
  }

  private assessInteractionImportance(interaction: InteractionEvent): MemoryImportance {
    const qualityFactor = interaction.quality?.overall || 0.5;
    const engagementFactor = interaction.engagement || 0.5;
    const combinedScore = (qualityFactor + engagementFactor) / 2;
    
    if (combinedScore >= 0.8) return MemoryImportance.SIGNIFICANT;
    if (combinedScore >= 0.6) return MemoryImportance.NOTABLE;
    if (combinedScore >= 0.4) return MemoryImportance.ROUTINE;
    return MemoryImportance.TRIVIAL;
  }

  private mapContextImportance(contextImportance: any): MemoryImportance {
    switch (contextImportance) {
      case 'critical': return MemoryImportance.CORE;
      case 'high': return MemoryImportance.SIGNIFICANT;
      case 'medium': return MemoryImportance.NOTABLE;
      case 'low': return MemoryImportance.ROUTINE;
      default: return MemoryImportance.TRIVIAL;
    }
  }

  private assessMessageImportance(message: Message): MemoryImportance {
    const length = message.text.length;
    const hasEmotionalKeywords = this.hasEmotionalKeywords(message.text);
    const hasQuestions = message.text.includes('?') || message.text.includes('？');
    
    let score = 0.3; // 基础分数
    
    if (length > 100) score += 0.2;
    if (hasEmotionalKeywords) score += 0.3;
    if (hasQuestions) score += 0.2;
    if (!message.isPlayer) score += 0.1; // AI消息略微重要
    
    if (score >= 0.8) return MemoryImportance.SIGNIFICANT;
    if (score >= 0.6) return MemoryImportance.NOTABLE;
    if (score >= 0.4) return MemoryImportance.ROUTINE;
    return MemoryImportance.TRIVIAL;
  }

  private calculateMemoryStrength(message: Message): number {
    const baseFactor = 0.5;
    const lengthFactor = Math.min(message.text.length / 200, 0.3);
    const emotionFactor = this.hasEmotionalKeywords(message.text) ? 0.2 : 0;
    
    return Math.min(baseFactor + lengthFactor + emotionFactor, 1.0);
  }

  private calculateMemoryVividness(message: Message): number {
    const descriptiveWords = ['看见', '听到', '感觉', '闻到', '触摸', '明亮', '黑暗', '温暖', '寒冷'];
    const matchCount = descriptiveWords.filter(word => message.text.includes(word)).length;
    
    return Math.min(0.3 + (matchCount * 0.15), 1.0);
  }

  private hasEmotionalKeywords(text: string): boolean {
    const emotionalWords = ['开心', '难过', '愤怒', '恐惧', '惊讶', '厌恶', '喜悦', '悲伤', '害怕', '兴奋'];
    return emotionalWords.some(word => text.includes(word));
  }

  private getTimeOfDay(timestamp: Date): string {
    const hour = timestamp.getHours();
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 22) return 'evening';
    return 'night';
  }

  private inferMoodFromMessage(text: string): string {
    if (this.hasEmotionalKeywords(text)) {
      if (text.includes('开心') || text.includes('喜悦')) return 'happy';
      if (text.includes('难过') || text.includes('悲伤')) return 'sad';
      if (text.includes('愤怒')) return 'angry';
      if (text.includes('恐惧') || text.includes('害怕')) return 'fearful';
      return 'emotional';
    }
    return 'neutral';
  }

  private extractEmotionalCues(text: string): string[] {
    const cues: string[] = [];
    const emotionalWords = ['开心', '难过', '愤怒', '恐惧', '惊讶', '厌恶', '喜悦', '悲伤', '害怕', '兴奋'];
    
    for (const word of emotionalWords) {
      if (text.includes(word)) {
        cues.push(word);
      }
    }
    
    return cues;
  }

  private assessConversationOutcome(message: Message): string {
    if (message.text.includes('?') || message.text.includes('？')) return 'inquiry';
    if (message.text.includes('!') || message.text.includes('！')) return 'exclamation';
    if (message.text.includes('谢谢') || message.text.includes('感谢')) return 'gratitude';
    return 'statement';
  }

  private calculateRelationshipImpact(relationship: Relationship): number {
    return relationship.strength * relationship.intensity;
  }

  private determineInteractionRole(characterId: string, interaction: InteractionEvent): string {
    if (interaction.participants[0] === characterId) return 'initiator';
    if (interaction.participants.length === 2 && interaction.participants[1] === characterId) return 'responder';
    return 'participant';
  }

  private calculateContextAwareness(context: ContextElement): number {
    return context.confidence * (context.relatedCharacters.length > 0 ? 1.2 : 1.0);
  }

  private suggestContextAdaptation(context: ContextElement): string {
    switch (context.type) {
      case 'social': return '调整社交方式';
      case 'temporal': return '注意时间因素';
      case 'spatial': return '适应环境变化';
      default: return '保持观察';
    }
  }

  private updateMemoryIndex(memory: MemoryUnit): void {
    let characterIndex = this.memoryIndex.get(memory.characterId);
    if (!characterIndex) {
      characterIndex = new Map();
      this.memoryIndex.set(memory.characterId, characterIndex);
    }
    
    // 为标题、描述和标签建立索引
    const keywords = [
      ...memory.title.split(' '),
      ...memory.description.split(' '),
      ...memory.tags
    ].filter(keyword => keyword.length > 1);
    
    for (const keyword of keywords) {
      let memoryIds = characterIndex.get(keyword);
      if (!memoryIds) {
        memoryIds = [];
        characterIndex.set(keyword, memoryIds);
      }
      if (!memoryIds.includes(memory.id)) {
        memoryIds.push(memory.id);
      }
    }
  }

  private async manageMemoryCapacity(characterId: string): Promise<void> {
    const memories = this.memories.get(characterId);
    if (!memories || memories.size <= this.config.performance.maxMemorySize) return;
    
    // 按重要性和时间排序，移除最不重要的记忆
    const memoryArray = Array.from(memories.values())
      .sort((a, b) => {
        const importanceA = this.getImportanceValue(a.importance);
        const importanceB = this.getImportanceValue(b.importance);
        if (importanceA !== importanceB) return importanceB - importanceA;
        return b.timestamp.getTime() - a.timestamp.getTime();
      });
    
    const toKeep = memoryArray.slice(0, this.config.performance.maxMemorySize);
    const toRemove = memoryArray.slice(this.config.performance.maxMemorySize);
    
    // 重建记忆映射
    memories.clear();
    for (const memory of toKeep) {
      memories.set(memory.id, memory);
    }
    
    console.log(`🗑️ 已清理 ${toRemove.length} 个旧记忆以管理容量`);
  }

  private getImportanceValue(importance: MemoryImportance): number {
    switch (importance) {
      case MemoryImportance.CORE: return 5;
      case MemoryImportance.SIGNIFICANT: return 4;
      case MemoryImportance.NOTABLE: return 3;
      case MemoryImportance.ROUTINE: return 2;
      case MemoryImportance.TRIVIAL: return 1;
      default: return 0;
    }
  }

  private updateSystemState(): void {
    this.state.totalMemories = Array.from(this.memories.values())
      .reduce((sum, characterMemories) => sum + characterMemories.size, 0);
    this.state.lastUpdate = new Date();
  }

  // 简化实现的占位方法
  private findSimilarMemories(memories: MemoryUnit[], threshold: number): MemoryUnit[][] {
    // 简化实现：按类型分组
    const groups = new Map<MemoryType, MemoryUnit[]>();
    for (const memory of memories) {
      if (!groups.has(memory.type)) {
        groups.set(memory.type, []);
      }
      groups.get(memory.type)!.push(memory);
    }
    return Array.from(groups.values()).filter(group => group.length >= 2);
  }

  private synthesizeMemoryGroup(characterId: string, memories: MemoryUnit[]): MemoryUnit | null {
    if (memories.length === 0) return null;
    
    const avgStrength = memories.reduce((sum, m) => sum + m.strength, 0) / memories.length;
    const avgVividness = memories.reduce((sum, m) => sum + m.vividness, 0) / memories.length;
    const allTags = [...new Set(memories.flatMap(m => m.tags))];
    
    return {
      id: crypto.randomUUID(),
      type: MemoryType.SEMANTIC,
      characterId,
      title: `综合记忆: ${memories[0].type}`,
      description: `包含${memories.length}个相关${memories[0].type}记忆的综合`,
      content: {
        concept: `${memories[0].type}_pattern`,
        definition: `关于${memories[0].type}的综合理解`,
        properties: { count: memories.length, avgStrength, avgVividness },
        relationships: [],
        examples: memories.map(m => m.title)
      },
      timestamp: new Date(),
      importance: memories.reduce((max, m) => 
        this.getImportanceValue(m.importance) > this.getImportanceValue(max) ? m.importance : max,
        MemoryImportance.TRIVIAL
      ),
      strength: avgStrength,
      vividness: avgVividness,
      relatedMemories: memories.map(m => m.id),
      relatedCharacters: [...new Set(memories.flatMap(m => m.relatedCharacters))],
      relatedEvents: [...new Set(memories.flatMap(m => m.relatedEvents))],
      tags: allTags,
      consolidationStatus: ConsolidationStatus.CONSOLIDATED,
      lastAccessed: new Date(),
      accessCount: 0,
      source: 'memory_synthesis',
      confidence: 0.8,
      createdAt: new Date(),
      lastUpdated: new Date()
    };
  }

  private createCompressedMemory(characterId: string, memories: MemoryUnit[]): MemoryUnit {
    const timeSpan = {
      start: new Date(Math.min(...memories.map(m => m.timestamp.getTime()))),
      end: new Date(Math.max(...memories.map(m => m.timestamp.getTime())))
    };
    
    return {
      id: crypto.randomUUID(),
      type: MemoryType.SEMANTIC,
      characterId,
      title: `压缩记忆集合`,
      description: `${timeSpan.start.toLocaleDateString()}到${timeSpan.end.toLocaleDateString()}的${memories.length}个记忆摘要`,
      content: {
        concept: 'compressed_memories',
        definition: '压缩的日常记忆集合',
        properties: {
          count: memories.length,
          timeSpan,
          types: [...new Set(memories.map(m => m.type))]
        },
        relationships: [],
        examples: memories.slice(0, 3).map(m => m.title)
      },
      timestamp: timeSpan.end,
      importance: MemoryImportance.ROUTINE,
      strength: 0.4,
      vividness: 0.3,
      relatedMemories: memories.map(m => m.id),
      relatedCharacters: [...new Set(memories.flatMap(m => m.relatedCharacters))],
      relatedEvents: [],
      tags: ['compressed', 'summary'],
      consolidationStatus: ConsolidationStatus.CONSOLIDATED,
      lastAccessed: new Date(),
      accessCount: 0,
      source: 'memory_compression',
      confidence: 0.7,
      createdAt: new Date(),
      lastUpdated: new Date()
    };
  }

  private discoverMemoryPatterns(memories: MemoryUnit[]): MemoryPattern[] {
    // 简化实现：按类型和时间模式检测
    const patterns: MemoryPattern[] = [];
    
    // 检测重复的记忆类型模式
    const typeSequences = memories.map(m => m.type);
    const typeFrequency = new Map<MemoryType, number>();
    
    for (const type of typeSequences) {
      typeFrequency.set(type, (typeFrequency.get(type) || 0) + 1);
    }
    
    for (const [type, frequency] of typeFrequency.entries()) {
      if (frequency >= 3) { // 至少出现3次
        patterns.push({
          id: crypto.randomUUID(),
          name: `${type}_pattern`,
          description: `${type}类型记忆的重复模式`,
          pattern: {
            triggers: ['conversation', 'interaction'],
            sequence: [type],
            outcomes: ['memory_formation']
          },
          frequency,
          confidence: Math.min(frequency / memories.length, 1),
          stability: 0.7,
          exampleMemories: memories.filter(m => m.type === type).slice(0, 3).map(m => m.id),
          predictiveValue: 0.6,
          discoveredAt: new Date(),
          lastSeen: new Date()
        });
      }
    }
    
    return patterns;
  }

  private createSemanticMemoryFromPattern(characterId: string, pattern: MemoryPattern): SemanticMemory | null {
    return {
      id: crypto.randomUUID(),
      type: MemoryType.SEMANTIC,
      characterId,
      title: `模式概念: ${pattern.name}`,
      description: `基于发现的记忆模式生成的概念理解`,
      content: {
        concept: pattern.name,
        definition: pattern.description,
        properties: {
          frequency: pattern.frequency,
          confidence: pattern.confidence,
          stability: pattern.stability
        },
        relationships: [{
          type: 'example',
          target: 'pattern_instances',
          strength: pattern.confidence
        }],
        examples: pattern.exampleMemories
      },
      timestamp: new Date(),
      importance: MemoryImportance.NOTABLE,
      strength: pattern.confidence,
      vividness: pattern.stability,
      relatedMemories: pattern.exampleMemories,
      relatedCharacters: [characterId],
      relatedEvents: [],
      tags: ['pattern', 'semantic', pattern.name],
      consolidationStatus: ConsolidationStatus.CONSOLIDATED,
      lastAccessed: new Date(),
      accessCount: 0,
      source: 'pattern_discovery',
      confidence: pattern.confidence,
      createdAt: new Date(),
      lastUpdated: new Date()
    };
  }

  private detectMemoryConflicts(memories: MemoryUnit[]): any[] {
    // 简化实现：检测相同时间的矛盾记忆
    const conflicts: any[] = [];
    const timeGroups = new Map<string, MemoryUnit[]>();
    
    for (const memory of memories) {
      const timeKey = memory.timestamp.toISOString().substring(0, 16); // 精确到分钟
      if (!timeGroups.has(timeKey)) {
        timeGroups.set(timeKey, []);
      }
      timeGroups.get(timeKey)!.push(memory);
    }
    
    for (const [timeKey, groupMemories] of timeGroups.entries()) {
      if (groupMemories.length > 1) {
        // 检查是否有矛盾的情感状态
        const emotions = groupMemories
          .filter(m => m.type === MemoryType.EMOTIONAL)
          .map(m => (m.content as any)?.emotion || 'unknown');
        
        if (emotions.length > 1 && new Set(emotions).size > 1) {
          conflicts.push({
            memoryIds: groupMemories.map(m => m.id),
            conflictType: 'emotional',
            description: `同一时间存在矛盾的情感状态: ${emotions.join(', ')}`,
            severity: 'moderate',
            suggestions: ['检查情感强度', '考虑情感复杂性']
          });
        }
      }
    }
    
    return conflicts;
  }

  private resolveMemoryConflict(characterId: string, conflict: any): MemoryUnit | null {
    // 简化实现：创建一个解决冲突的元记忆
    return {
      id: crypto.randomUUID(),
      type: MemoryType.SEMANTIC,
      characterId,
      title: `冲突解决: ${conflict.conflictType}`,
      description: `对${conflict.description}的冲突解决`,
      content: {
        concept: 'conflict_resolution',
        definition: conflict.description,
        properties: {
          conflictType: conflict.conflictType,
          severity: conflict.severity,
          resolvedAt: new Date()
        },
        relationships: [{
          type: 'resolves',
          target: 'memory_conflict',
          strength: 0.8
        }],
        examples: conflict.suggestions
      },
      timestamp: new Date(),
      importance: MemoryImportance.NOTABLE,
      strength: 0.7,
      vividness: 0.6,
      relatedMemories: conflict.memoryIds,
      relatedCharacters: [characterId],
      relatedEvents: [],
      tags: ['conflict_resolution', 'meta'],
      consolidationStatus: ConsolidationStatus.CONSOLIDATED,
      lastAccessed: new Date(),
      accessCount: 0,
      source: 'conflict_resolution',
      confidence: 0.75,
      createdAt: new Date(),
      lastUpdated: new Date()
    };
  }

  private calculateMemoryRelevance(memory: MemoryUnit, query: MemoryQuery): number {
    let relevance = 0;
    
    // 类型匹配
    if (query.types && query.types.includes(memory.type)) {
      relevance += 0.3;
    }
    
    // 关键词匹配
    if (query.keywords) {
      const memoryText = `${memory.title} ${memory.description} ${memory.tags.join(' ')}`.toLowerCase();
      const matchedKeywords = query.keywords.filter(keyword => 
        memoryText.includes(keyword.toLowerCase())
      );
      relevance += (matchedKeywords.length / query.keywords.length) * 0.4;
    }
    
    // 时间范围匹配
    if (query.timeRange) {
      const memoryTime = memory.timestamp.getTime();
      const startTime = query.timeRange.start.getTime();
      const endTime = query.timeRange.end.getTime();
      
      if (memoryTime >= startTime && memoryTime <= endTime) {
        relevance += 0.2;
      }
    }
    
    // 角色匹配
    if (query.characters && memory.relatedCharacters.some(char => query.characters!.includes(char))) {
      relevance += 0.1;
    }
    
    return Math.min(relevance, 1);
  }

  private generateRetrievalReasoning(memory: MemoryUnit, query: MemoryQuery): string {
    const reasons: string[] = [];
    
    if (query.types && query.types.includes(memory.type)) {
      reasons.push(`匹配记忆类型: ${memory.type}`);
    }
    
    if (query.keywords) {
      const memoryText = `${memory.title} ${memory.description}`.toLowerCase();
      const matchedKeywords = query.keywords.filter(keyword => 
        memoryText.includes(keyword.toLowerCase())
      );
      if (matchedKeywords.length > 0) {
        reasons.push(`匹配关键词: ${matchedKeywords.join(', ')}`);
      }
    }
    
    return reasons.join('; ') || '基础相关性匹配';
  }

  private generateRetrievalContext(memory: MemoryUnit, query: MemoryQuery): string {
    return `记忆强度: ${memory.strength.toFixed(2)}, 重要性: ${memory.importance}, 创建时间: ${memory.timestamp.toLocaleDateString()}`;
  }

  // 其他简化的辅助方法
  private generatePatternInsights(characterId: string, memories: MemoryUnit[]): MemoryInsight[] {
    return []; // 简化实现
  }

  private generateTrendInsights(characterId: string, memories: MemoryUnit[]): MemoryInsight[] {
    return []; // 简化实现
  }

  private generateGapInsights(characterId: string, memories: MemoryUnit[]): MemoryInsight[] {
    return []; // 简化实现
  }

  private groupConflictsByType(conflicts: any[]): Record<string, number> {
    const groups: Record<string, number> = {};
    for (const conflict of conflicts) {
      groups[conflict.conflictType] = (groups[conflict.conflictType] || 0) + 1;
    }
    return groups;
  }

  private groupConflictsBySeverity(conflicts: any[]): Record<string, number> {
    const groups: Record<string, number> = {};
    for (const conflict of conflicts) {
      groups[conflict.severity] = (groups[conflict.severity] || 0) + 1;
    }
    return groups;
  }

  private generateConsistencyRecommendations(conflicts: any[]): any[] {
    return conflicts.map(conflict => ({
      priority: conflict.severity === 'critical' ? 'high' : 'medium',
      action: `解决${conflict.conflictType}冲突`,
      affectedMemories: conflict.memoryIds,
      expectedImprovement: 0.1
    }));
  }

  private calculateMemoryStatistics(memories: MemoryUnit[]): any {
    const byType: Record<MemoryType, number> = {} as any;
    const byImportance: Record<MemoryImportance, number> = {} as any;
    const byStatus: Record<ConsolidationStatus, number> = {} as any;
    
    let totalStrength = 0;
    let totalVividness = 0;
    let totalConfidence = 0;
    
    for (const memory of memories) {
      byType[memory.type] = (byType[memory.type] || 0) + 1;
      byImportance[memory.importance] = (byImportance[memory.importance] || 0) + 1;
      byStatus[memory.consolidationStatus] = (byStatus[memory.consolidationStatus] || 0) + 1;
      
      totalStrength += memory.strength;
      totalVividness += memory.vividness;
      totalConfidence += memory.confidence;
    }
    
    const count = memories.length || 1;
    
    return {
      totalMemories: memories.length,
      memoriesByType: byType,
      memoriesByImportance: byImportance,
      averageStrength: totalStrength / count,
      averageVividness: totalVividness / count,
      averageConfidence: totalConfidence / count,
      consolidationProgress: byStatus
    };
  }

  private assessMemoryHealth(memories: MemoryUnit[]): any {
    return {
      coherence: 0.8,
      coverage: 0.75,
      integration: 0.7,
      accessibility: 0.85
    };
  }

  private calculateRecentActivity(characterId: string): any {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const memories = this.memories.get(characterId);
    if (!memories) return { newMemories: 0, modifiedMemories: 0, integrationsPerformed: 0, patternsDiscovered: 0 };
    
    const recentMemories = Array.from(memories.values())
      .filter(m => m.createdAt.getTime() > oneHourAgo);
    
    return {
      newMemories: recentMemories.length,
      modifiedMemories: 0,
      integrationsPerformed: 0,
      patternsDiscovered: 0
    };
  }

  private calculateMemoryCapacity(memories: MemoryUnit[]): any {
    const used = memories.length;
    const available = this.config.performance.maxMemorySize - used;
    
    return {
      used,
      available: Math.max(available, 0),
      efficiency: used > 0 ? used / this.config.performance.maxMemorySize : 0
    };
  }

  /**
   * 获取管理器状态
   */
  public getState(): MemoryManagerState {
    return { ...this.state };
  }

  /**
   * 清理缓存
   */
  public clearCache(): void {
    this.patternCache.clear();
    console.log('�� 综合记忆缓存已清理');
  }
} 