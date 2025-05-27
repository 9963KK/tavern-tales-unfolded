import { Message } from '../types/message';
import { AICharacter } from '../types/character';
import { DynamicContextPruner, PruningConfig, PruningResult, MessageImportance } from './dynamicContextPruner';
import { PersonalizedPruningStrategy, CharacterPruningPreferences, PersonalizedWeights, PersonalizedRetentionResult } from './personalizedPruningStrategy';
import { TopicRelevanceAnalyzer, TopicInfo } from './topicRelevanceAnalyzer';
import { ChineseTextProcessor } from '../utils/chineseTextProcessor';

// 上下文管理器配置接口
export interface ContextManagerConfig {
  // 基础裁剪配置
  pruning: PruningConfig;
  
  // 个性化配置
  enablePersonalization: boolean;
  personalityWeight: number;
  
  // 性能配置
  enableCaching: boolean;
  maxCacheSize: number;
  enableDebugMode: boolean;
  
  // 自适应配置
  enableAdaptiveLearning: boolean;
  learningRate: number;
  
  // 集成配置
  integrationMode: 'enhanced' | 'fallback' | 'disabled';
  fallbackThreshold: number; // 失败回退阈值
}

// 上下文处理结果
export interface ContextProcessingResult {
  success: boolean;
  prunedMessages: Message[];
  originalMessageCount: number;
  finalMessageCount: number;
  tokenReduction: number;
  processingTime: number;
  strategy: string;
  metadata: {
    usedPersonalization: boolean;
    characterId?: string;
    topicKeywords: string[];
    retentionReasons: Map<string, string[]>;
    performanceStats: {
      pruningTime: number;
      personalizationTime: number;
      topicAnalysisTime: number;
    };
  };
  error?: string;
}

// 性能统计
export interface PerformanceStats {
  totalProcessed: number;
  averageProcessingTime: number;
  cacheHitRate: number;
  errorRate: number;
  tokenSavingsRate: number;
  lastUpdated: number;
}

// 统一上下文管理器
export class ContextManager {
  private config: ContextManagerConfig;
  private pruner: DynamicContextPruner;
  private personalizedStrategy: PersonalizedPruningStrategy;
  private topicAnalyzer: TopicRelevanceAnalyzer;
  private textProcessor: ChineseTextProcessor;
  
  // 性能监控
  private performanceStats: PerformanceStats;
  private processingHistory: ContextProcessingResult[];
  
  // 缓存管理
  private cache: Map<string, any>;
  private cacheTimestamps: Map<string, number>;
  
  // 学习数据
  private adaptiveLearningData: Map<string, any>;

  constructor(config?: Partial<ContextManagerConfig>) {
    // 默认配置
    this.config = {
      pruning: {
        maxTokens: 4000,
        minRetainRatio: 0.3,
        systemMessageWeight: 1.0,
        userMessageWeight: 0.8,
        aiMessageWeight: 0.6,
        timeDecayFactor: 0.95,
        recentMessageBonus: 1.2,
        topicRelevanceThreshold: 0.3,
        personalityWeight: 0.4,
        enableCaching: true,
        maxCacheSize: 1000,
        processingTimeout: 5000,
        systemMessagePriority: 10
      },
      enablePersonalization: true,
      personalityWeight: 0.4,
      enableCaching: true,
      maxCacheSize: 2000,
      enableDebugMode: false,
      enableAdaptiveLearning: true,
      learningRate: 0.1,
      integrationMode: 'enhanced',
      fallbackThreshold: 0.8,
      ...config
    };

    // 初始化组件
    this.pruner = new DynamicContextPruner(this.config.pruning);
    this.personalizedStrategy = new PersonalizedPruningStrategy();
    this.topicAnalyzer = new TopicRelevanceAnalyzer();
    this.textProcessor = new ChineseTextProcessor();

    // 初始化性能统计
    this.performanceStats = {
      totalProcessed: 0,
      averageProcessingTime: 0,
      cacheHitRate: 0,
      errorRate: 0,
      tokenSavingsRate: 0,
      lastUpdated: Date.now()
    };

    this.processingHistory = [];
    this.cache = new Map();
    this.cacheTimestamps = new Map();
    this.adaptiveLearningData = new Map();

    console.log('🧠 ContextManager 初始化完成');
  }

  /**
   * 主要的上下文处理方法
   */
  async processContext(
    messages: Message[],
    character?: AICharacter,
    currentTopic?: string,
    options?: {
      forcePersonalization?: boolean;
      customConfig?: Partial<PruningConfig>;
      debugMode?: boolean;
    }
  ): Promise<ContextProcessingResult> {
    const startTime = Date.now();
    const originalMessageCount = messages.length;
    
    try {
      // 检查缓存
      const cacheKey = this.generateCacheKey(messages, character, currentTopic);
      if (this.config.enableCaching && this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        this.updatePerformanceStats(Date.now() - startTime, true);
        return cached;
      }

      // 1. 基础上下文裁剪
      const pruningStartTime = Date.now();
      const pruningResult = await this.pruner.pruneContext(messages, character, currentTopic);
      const pruningTime = Date.now() - pruningStartTime;

      let finalMessages = pruningResult.prunedMessages;
      let strategy = 'basic';
      let usedPersonalization = false;
      let retentionReasons = new Map<string, string[]>();

      // 2. 个性化裁剪（如果启用）
      let personalizationTime = 0;
      if (this.config.enablePersonalization && character && 
          (options?.forcePersonalization || this.shouldUsePersonalization(pruningResult, character))) {
        
        const personalizationStartTime = Date.now();
        
        try {
          // 识别当前话题
          const topics = this.topicAnalyzer.identifyTopics(messages, 3);
          
          // 计算个性化权重
          const personalizedWeights = this.personalizedStrategy.calculatePersonalizedWeights(
            character,
            finalMessages,
            pruningResult.importanceScores,
            topics
          );

          // 实现个性化保留策略
          const retentionResult = this.personalizedStrategy.implementPersonalizedRetention(
            character,
            finalMessages,
            personalizedWeights,
            this.config.pruning
          );

          // 应用个性化结果
          finalMessages = this.applyPersonalizedRetention(finalMessages, retentionResult);
          retentionReasons = retentionResult.retentionReasons;
          strategy = 'personalized';
          usedPersonalization = true;

        } catch (error) {
          console.warn('个性化裁剪失败，使用基础裁剪结果:', error);
        }
        
        personalizationTime = Date.now() - personalizationStartTime;
      }

      // 3. 话题分析
      const topicAnalysisStartTime = Date.now();
      const currentTopics = this.topicAnalyzer.identifyTopics(finalMessages, 5);
      const topicKeywords = currentTopics.flatMap(topic => topic.keywords);
      const topicAnalysisTime = Date.now() - topicAnalysisStartTime;

      // 4. 计算token减少量
      const originalTokens = this.estimateTokens(messages);
      const finalTokens = this.estimateTokens(finalMessages);
      const tokenReduction = ((originalTokens - finalTokens) / originalTokens) * 100;

      const processingTime = Date.now() - startTime;

      const result: ContextProcessingResult = {
        success: true,
        prunedMessages: finalMessages,
        originalMessageCount,
        finalMessageCount: finalMessages.length,
        tokenReduction,
        processingTime,
        strategy,
        metadata: {
          usedPersonalization,
          characterId: character?.id,
          topicKeywords,
          retentionReasons,
          performanceStats: {
            pruningTime,
            personalizationTime,
            topicAnalysisTime
          }
        }
      };

      // 缓存结果
      if (this.config.enableCaching) {
        this.saveToCache(cacheKey, result);
      }

      // 更新性能统计
      this.updatePerformanceStats(processingTime, false);
      this.processingHistory.push(result);

      // 自适应学习
      if (this.config.enableAdaptiveLearning) {
        this.updateAdaptiveLearning(result, character);
      }

      if (this.config.enableDebugMode || options?.debugMode) {
        this.logDebugInfo(result);
      }

      return result;

    } catch (error) {
      console.error('上下文处理失败:', error);
      
      // 回退策略
      const fallbackResult = this.createFallbackResult(messages, error as Error);
      this.updatePerformanceStats(Date.now() - startTime, false, true);
      
      return fallbackResult;
    }
  }

  /**
   * 判断是否应该使用个性化裁剪
   */
  private shouldUsePersonalization(pruningResult: PruningResult, character: AICharacter): boolean {
    // 如果基础裁剪效果不佳，尝试个性化
    if (pruningResult.retainRatio < this.config.fallbackThreshold) {
      return true;
    }

    // 如果角色有明确的个性特征，使用个性化
    if (character.personality && Object.keys(character.personality).length > 0) {
      return true;
    }

    // 如果消息中有角色相关内容，使用个性化
    const characterMentions = pruningResult.prunedMessages.filter(msg => 
      msg.content.includes(character.name) || msg.characterId === character.id
    );
    
    return characterMentions.length > 0;
  }

  /**
   * 应用个性化保留策略
   */
  private applyPersonalizedRetention(
    messages: Message[],
    retentionResult: PersonalizedRetentionResult
  ): Message[] {
    const retainedIds = new Set([
      ...retentionResult.mustRetainMessages,
      ...retentionResult.preferRetainMessages
    ]);

    return messages.filter(msg => retainedIds.has(msg.id));
  }

  /**
   * 估算消息token数量
   */
  private estimateTokens(messages: Message[]): number {
    return messages.reduce((total, msg) => {
      const chineseCharCount = (msg.content.match(/[\u4e00-\u9fff]/g) || []).length;
      const englishWordCount = msg.content.split(/\s+/).filter(word => 
        word.length > 0 && !/[\u4e00-\u9fff]/.test(word)
      ).length;
      const specialCharCount = (msg.content.match(/[^\w\s\u4e00-\u9fff]/g) || []).length;
      
      return total + Math.ceil(chineseCharCount * 1.5 + englishWordCount * 1 + specialCharCount * 0.5);
    }, 0);
  }

  /**
   * 生成缓存键
   */
  private generateCacheKey(messages: Message[], character?: AICharacter, currentTopic?: string): string {
    const messageHash = this.hashMessages(messages);
    const characterId = character?.id || 'none';
    const topic = currentTopic || 'none';
    return `context_${messageHash}_${characterId}_${topic}`;
  }

  /**
   * 消息哈希
   */
  private hashMessages(messages: Message[]): string {
    const content = messages.map(m => `${m.id}_${m.content.length}`).join('|');
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString();
  }

  /**
   * 保存到缓存
   */
  private saveToCache(key: string, result: ContextProcessingResult): void {
    if (this.cache.size >= this.config.maxCacheSize) {
      this.cleanOldCache();
    }
    
    this.cache.set(key, result);
    this.cacheTimestamps.set(key, Date.now());
  }

  /**
   * 清理旧缓存
   */
  private cleanOldCache(): void {
    const now = Date.now();
    const maxAge = 30 * 60 * 1000; // 30分钟
    const toDelete: string[] = [];

    for (const [key, timestamp] of this.cacheTimestamps.entries()) {
      if (now - timestamp > maxAge) {
        toDelete.push(key);
      }
    }

    for (const key of toDelete) {
      this.cache.delete(key);
      this.cacheTimestamps.delete(key);
    }

    // 如果还是太多，删除最旧的一半
    if (this.cache.size >= this.config.maxCacheSize) {
      const entries = Array.from(this.cacheTimestamps.entries())
        .sort((a, b) => a[1] - b[1]);
      
      const deleteCount = Math.floor(this.cache.size / 2);
      for (let i = 0; i < deleteCount; i++) {
        const key = entries[i][0];
        this.cache.delete(key);
        this.cacheTimestamps.delete(key);
      }
    }
  }

  /**
   * 更新性能统计
   */
  private updatePerformanceStats(processingTime: number, cacheHit: boolean, error: boolean = false): void {
    this.performanceStats.totalProcessed++;
    
    // 更新平均处理时间
    const totalTime = this.performanceStats.averageProcessingTime * (this.performanceStats.totalProcessed - 1) + processingTime;
    this.performanceStats.averageProcessingTime = totalTime / this.performanceStats.totalProcessed;
    
    // 更新缓存命中率
    if (cacheHit) {
      const totalHits = this.performanceStats.cacheHitRate * (this.performanceStats.totalProcessed - 1) + 1;
      this.performanceStats.cacheHitRate = totalHits / this.performanceStats.totalProcessed;
    } else {
      this.performanceStats.cacheHitRate = this.performanceStats.cacheHitRate * (this.performanceStats.totalProcessed - 1) / this.performanceStats.totalProcessed;
    }
    
    // 更新错误率
    if (error) {
      const totalErrors = this.performanceStats.errorRate * (this.performanceStats.totalProcessed - 1) + 1;
      this.performanceStats.errorRate = totalErrors / this.performanceStats.totalProcessed;
    } else {
      this.performanceStats.errorRate = this.performanceStats.errorRate * (this.performanceStats.totalProcessed - 1) / this.performanceStats.totalProcessed;
    }
    
    this.performanceStats.lastUpdated = Date.now();
  }

  /**
   * 自适应学习更新
   */
  private updateAdaptiveLearning(result: ContextProcessingResult, character?: AICharacter): void {
    if (!character) return;

    const learningKey = `adaptive_${character.id}`;
    const currentData = this.adaptiveLearningData.get(learningKey) || {
      successfulStrategies: new Map(),
      averageTokenReduction: 0,
      preferredRetentionRatio: 0.5,
      updateCount: 0
    };

    // 更新成功策略统计
    const strategyCount = currentData.successfulStrategies.get(result.strategy) || 0;
    currentData.successfulStrategies.set(result.strategy, strategyCount + 1);

    // 更新平均token减少量
    currentData.averageTokenReduction = 
      (currentData.averageTokenReduction * currentData.updateCount + result.tokenReduction) / 
      (currentData.updateCount + 1);

    // 更新偏好保留比例
    const retentionRatio = result.finalMessageCount / result.originalMessageCount;
    currentData.preferredRetentionRatio = 
      (currentData.preferredRetentionRatio * currentData.updateCount + retentionRatio) / 
      (currentData.updateCount + 1);

    currentData.updateCount++;
    this.adaptiveLearningData.set(learningKey, currentData);

    // 动态调整个性化策略
    if (currentData.updateCount > 10) {
      this.adjustPersonalizationStrategy(character, currentData);
    }
  }

  /**
   * 调整个性化策略
   */
  private adjustPersonalizationStrategy(character: AICharacter, learningData: any): void {
    const preferences = this.personalizedStrategy.getCharacterPreferences(character.id);
    if (!preferences) return;

    // 基于学习数据调整偏好
    const adjustments: Partial<CharacterPruningPreferences> = {};

    // 如果token减少量过低，增加记忆重要性
    if (learningData.averageTokenReduction < 20) {
      adjustments.memoryImportance = Math.min(preferences.memoryImportance + 0.1, 1.0);
    }

    // 如果保留比例过高，降低社交权重
    if (learningData.preferredRetentionRatio > 0.8) {
      adjustments.socialWeight = Math.max(preferences.socialWeight - 0.1, 0.1);
    }

    if (Object.keys(adjustments).length > 0) {
      this.personalizedStrategy.updateCharacterPreferences(character.id, adjustments);
      console.log(`🎯 自适应调整角色 ${character.name} 的裁剪偏好:`, adjustments);
    }
  }

  /**
   * 创建回退结果
   */
  private createFallbackResult(messages: Message[], error: Error): ContextProcessingResult {
    // 简单的回退策略：保留最近的消息
    const maxMessages = Math.floor(this.config.pruning.maxTokens / 50);
    const retainCount = Math.min(maxMessages, messages.length);
    const fallbackMessages = messages.slice(-retainCount);

    return {
      success: false,
      prunedMessages: fallbackMessages,
      originalMessageCount: messages.length,
      finalMessageCount: fallbackMessages.length,
      tokenReduction: ((messages.length - fallbackMessages.length) / messages.length) * 100,
      processingTime: 0,
      strategy: 'fallback',
      metadata: {
        usedPersonalization: false,
        topicKeywords: [],
        retentionReasons: new Map(),
        performanceStats: {
          pruningTime: 0,
          personalizationTime: 0,
          topicAnalysisTime: 0
        }
      },
      error: error.message
    };
  }

  /**
   * 记录调试信息
   */
  private logDebugInfo(result: ContextProcessingResult): void {
    console.log('🧠 ContextManager 处理结果:');
    console.log(`📊 消息数量: ${result.originalMessageCount} → ${result.finalMessageCount}`);
    console.log(`🎯 Token减少: ${result.tokenReduction.toFixed(1)}%`);
    console.log(`⏱️ 处理时间: ${result.processingTime}ms`);
    console.log(`🔧 策略: ${result.strategy}`);
    console.log(`🎭 个性化: ${result.metadata.usedPersonalization ? '是' : '否'}`);
    console.log(`🏷️ 话题关键词: ${result.metadata.topicKeywords.join(', ')}`);
  }

  /**
   * 获取性能统计
   */
  getPerformanceStats(): PerformanceStats {
    return { ...this.performanceStats };
  }

  /**
   * 获取处理历史
   */
  getProcessingHistory(limit: number = 50): ContextProcessingResult[] {
    return this.processingHistory.slice(-limit);
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<ContextManagerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // 更新子组件配置
    if (newConfig.pruning) {
      this.pruner.updateConfig(newConfig.pruning);
    }
    
    console.log('🔧 ContextManager 配置已更新');
  }

  /**
   * 获取当前配置
   */
  getConfig(): ContextManagerConfig {
    return { ...this.config };
  }

  /**
   * 清理缓存和学习数据
   */
  clearCache(): void {
    this.cache.clear();
    this.cacheTimestamps.clear();
    this.adaptiveLearningData.clear();
    this.pruner.clearCache();
    this.personalizedStrategy.clearCache();
    this.topicAnalyzer.clearCache();
    this.textProcessor.clearCache();
    
    console.log('🧹 ContextManager 缓存已清理');
  }

  /**
   * 获取角色个性化偏好
   */
  getCharacterPreferences(characterId: string): CharacterPruningPreferences | undefined {
    return this.personalizedStrategy.getCharacterPreferences(characterId);
  }

  /**
   * 更新角色个性化偏好
   */
  updateCharacterPreferences(characterId: string, preferences: Partial<CharacterPruningPreferences>): void {
    this.personalizedStrategy.updateCharacterPreferences(characterId, preferences);
  }

  /**
   * 获取自适应学习数据
   */
  getAdaptiveLearningData(characterId: string): any {
    return this.adaptiveLearningData.get(`adaptive_${characterId}`);
  }
}

// 创建全局实例
export const contextManager = new ContextManager();

// 导出便捷函数
export async function processContextForAI(
  messages: Message[],
  character?: AICharacter,
  currentTopic?: string,
  options?: {
    maxTokens?: number;
    enablePersonalization?: boolean;
    debugMode?: boolean;
  }
): Promise<ContextProcessingResult> {
  // 临时配置覆盖
  if (options?.maxTokens) {
    const tempConfig = { ...contextManager.getConfig() };
    tempConfig.pruning.maxTokens = options.maxTokens;
    contextManager.updateConfig(tempConfig);
  }

  return contextManager.processContext(messages, character, currentTopic, {
    forcePersonalization: options?.enablePersonalization,
    debugMode: options?.debugMode
  });
} 