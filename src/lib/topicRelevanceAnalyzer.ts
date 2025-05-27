import { Message } from '../types/message';
import { AICharacter } from '../types/character';
import { ChineseTextProcessor } from '../utils/chineseTextProcessor';
import { TFIDFCalculator, TFIDFVector } from './tfidfCalculator';

// 话题信息接口
export interface TopicInfo {
  id: string;
  keywords: string[];
  weight: number;
  messageIds: string[];
  createdAt: number;
  lastUpdated: number;
}

// 相关性评分结果
export interface RelevanceScore {
  messageId: string;
  topicRelevance: number;
  characterRelevance: number;
  historicalRelevance: number;
  finalScore: number;
  matchedKeywords: string[];
  explanation: string;
}

// 话题转换检测结果
export interface TopicTransition {
  fromTopic: TopicInfo | null;
  toTopic: TopicInfo;
  transitionPoint: number; // 消息索引
  confidence: number;
  triggerKeywords: string[];
}

// 话题聚类结果
export interface TopicCluster {
  clusterId: string;
  centerKeywords: string[];
  messages: Message[];
  coherenceScore: number;
  timeSpan: { start: number; end: number };
}

// 话题相关性分析器
export class TopicRelevanceAnalyzer {
  private textProcessor: ChineseTextProcessor;
  private tfidfCalculator: TFIDFCalculator;
  private currentTopics: Map<string, TopicInfo>;
  private messageTopicMap: Map<string, string>; // 消息ID -> 话题ID
  private cache: Map<string, any>;
  private config: {
    maxTopics: number;
    topicDecayFactor: number;
    relevanceThreshold: number;
    transitionThreshold: number;
    keywordWeight: number;
    semanticWeight: number;
    temporalWeight: number;
  };

  constructor(config?: Partial<typeof this.config>) {
    this.textProcessor = new ChineseTextProcessor();
    this.tfidfCalculator = new TFIDFCalculator();
    this.currentTopics = new Map();
    this.messageTopicMap = new Map();
    this.cache = new Map();
    
    this.config = {
      maxTopics: 10,
      topicDecayFactor: 0.95,
      relevanceThreshold: 0.3,
      transitionThreshold: 0.6,
      keywordWeight: 0.4,
      semanticWeight: 0.4,
      temporalWeight: 0.2,
      ...config
    };
  }

  /**
   * 分析消息与当前话题的相关性
   */
  analyzeTopicRelevance(
    message: Message,
    currentTopic?: string,
    character?: AICharacter,
    messageHistory?: Message[]
  ): RelevanceScore {
    const cacheKey = `relevance_${message.id}_${currentTopic || 'none'}_${character?.id || 'none'}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // 1. 计算与当前话题的相关性
    const topicRelevance = this.calculateTopicRelevance(message, currentTopic);

    // 2. 计算与角色兴趣的匹配度
    const characterRelevance = this.calculateCharacterRelevance(message, character);

    // 3. 计算与历史重要对话的关联性
    const historicalRelevance = this.calculateHistoricalRelevance(message, messageHistory);

    // 4. 综合计算最终分数
    const finalScore = (
      topicRelevance * this.config.keywordWeight +
      characterRelevance * this.config.semanticWeight +
      historicalRelevance * this.config.temporalWeight
    );

    // 5. 提取匹配的关键词
    const matchedKeywords = this.extractMatchedKeywords(message, currentTopic);

    // 6. 生成解释
    const explanation = this.generateExplanation(
      topicRelevance,
      characterRelevance,
      historicalRelevance,
      matchedKeywords
    );

    const result: RelevanceScore = {
      messageId: message.id,
      topicRelevance,
      characterRelevance,
      historicalRelevance,
      finalScore,
      matchedKeywords,
      explanation
    };

    this.cache.set(cacheKey, result);
    return result;
  }

  /**
   * 计算与当前话题的相关性
   */
  private calculateTopicRelevance(message: Message, currentTopic?: string): number {
    if (!currentTopic) return 0.5; // 默认中等相关性

    const messageSegment = this.textProcessor.segmentText(message.content);
    const topicSegment = this.textProcessor.segmentText(currentTopic);

    // 使用Jaccard相似度计算基础相关性
    const messageWords = new Set(messageSegment.filteredWords);
    const topicWords = new Set(topicSegment.filteredWords);

    const intersection = new Set([...messageWords].filter(word => topicWords.has(word)));
    const union = new Set([...messageWords, ...topicWords]);

    if (union.size === 0) return 0;

    const jaccardSimilarity = intersection.size / union.size;

    // 考虑关键词权重
    let keywordBonus = 0;
    for (const keyword of topicSegment.keywords) {
      if (messageWords.has(keyword)) {
        keywordBonus += 0.1;
      }
    }

    return Math.min(jaccardSimilarity + keywordBonus, 1.0);
  }

  /**
   * 计算与角色兴趣的匹配度
   */
  private calculateCharacterRelevance(message: Message, character?: AICharacter): number {
    if (!character) return 0.5;

    const messageSegment = this.textProcessor.segmentText(message.content);
    
    // 基于角色描述计算相关性
    const characterDescription = `${character.name} ${character.personality} ${character.background}`;
    const characterSegment = this.textProcessor.segmentText(characterDescription);

    // 计算语义相似度
    const similarity = this.textProcessor.calculateSimilarity(
      message.content,
      characterDescription
    );

    // 检查是否提及角色
    const mentionBonus = this.checkCharacterMention(message, character) ? 0.3 : 0;

    // 检查角色特定关键词
    const keywordBonus = this.calculateCharacterKeywordMatch(
      messageSegment.filteredWords,
      characterSegment.keywords
    );

    return Math.min(similarity + mentionBonus + keywordBonus, 1.0);
  }

  /**
   * 计算与历史重要对话的关联性
   */
  private calculateHistoricalRelevance(message: Message, messageHistory?: Message[]): number {
    if (!messageHistory || messageHistory.length === 0) return 0.5;

    // 获取最近的重要消息（最近10条）
    const recentMessages = messageHistory.slice(-10);
    
    let maxSimilarity = 0;
    let totalSimilarity = 0;
    let count = 0;

    for (const histMsg of recentMessages) {
      if (histMsg.id === message.id) continue;

      const similarity = this.textProcessor.calculateSimilarity(
        message.content,
        histMsg.content
      );

      maxSimilarity = Math.max(maxSimilarity, similarity);
      totalSimilarity += similarity;
      count++;
    }

    if (count === 0) return 0.5;

    // 结合最大相似度和平均相似度
    const avgSimilarity = totalSimilarity / count;
    return (maxSimilarity * 0.6 + avgSimilarity * 0.4);
  }

  /**
   * 检查角色提及
   */
  private checkCharacterMention(message: Message, character: AICharacter): boolean {
    const content = message.content.toLowerCase();
    const characterName = character.name.toLowerCase();
    
    return (
      content.includes(`@${characterName}`) ||
      content.includes(`@${character.id}`) ||
      content.includes(characterName)
    );
  }

  /**
   * 计算角色关键词匹配度
   */
  private calculateCharacterKeywordMatch(messageWords: string[], characterKeywords: string[]): number {
    let matchCount = 0;
    
    for (const keyword of characterKeywords) {
      if (messageWords.includes(keyword)) {
        matchCount++;
      }
    }

    return Math.min(matchCount * 0.1, 0.5);
  }

  /**
   * 提取匹配的关键词
   */
  private extractMatchedKeywords(message: Message, currentTopic?: string): string[] {
    if (!currentTopic) return [];

    const messageSegment = this.textProcessor.segmentText(message.content);
    const topicSegment = this.textProcessor.segmentText(currentTopic);

    const messageWords = new Set(messageSegment.filteredWords);
    const topicWords = new Set(topicSegment.filteredWords);

    return Array.from(messageWords).filter(word => topicWords.has(word));
  }

  /**
   * 生成相关性解释
   */
  private generateExplanation(
    topicRelevance: number,
    characterRelevance: number,
    historicalRelevance: number,
    matchedKeywords: string[]
  ): string {
    const explanations: string[] = [];

    if (topicRelevance > 0.7) {
      explanations.push(`与当前话题高度相关 (${(topicRelevance * 100).toFixed(1)}%)`);
    } else if (topicRelevance > 0.4) {
      explanations.push(`与当前话题中等相关 (${(topicRelevance * 100).toFixed(1)}%)`);
    } else {
      explanations.push(`与当前话题相关性较低 (${(topicRelevance * 100).toFixed(1)}%)`);
    }

    if (characterRelevance > 0.6) {
      explanations.push('与角色兴趣高度匹配');
    }

    if (historicalRelevance > 0.6) {
      explanations.push('与历史对话关联性强');
    }

    if (matchedKeywords.length > 0) {
      explanations.push(`匹配关键词: ${matchedKeywords.slice(0, 3).join(', ')}`);
    }

    return explanations.join('; ');
  }

  /**
   * 动态话题识别
   */
  identifyTopics(messages: Message[], topK: number = 5): TopicInfo[] {
    if (messages.length === 0) return [];

    // 1. 使用TF-IDF分析消息
    const documents = messages.map(msg => ({
      id: msg.id,
      content: msg.content
    }));

    const tfidfResult = this.tfidfCalculator.calculateTFIDF(documents);

    // 2. 基于关键词聚类识别话题
    const topics = this.clusterMessagesByKeywords(messages, tfidfResult.documentVectors);

    // 3. 更新话题信息
    this.updateTopicInfo(topics);

    // 4. 返回前topK个话题
    return Array.from(this.currentTopics.values())
      .sort((a, b) => b.weight - a.weight)
      .slice(0, topK);
  }

  /**
   * 基于关键词聚类消息
   */
  private clusterMessagesByKeywords(messages: Message[], vectors: TFIDFVector[]): TopicCluster[] {
    const clusters: TopicCluster[] = [];
    const vectorMap = new Map(vectors.map(v => [v.documentId, v]));

    // 简化的聚类算法：基于关键词重叠
    const processed = new Set<string>();

    for (const message of messages) {
      if (processed.has(message.id)) continue;

      const vector = vectorMap.get(message.id);
      if (!vector) continue;

      const cluster: TopicCluster = {
        clusterId: `topic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        centerKeywords: vector.keywords.slice(0, 5),
        messages: [message],
        coherenceScore: 1.0,
        timeSpan: {
          start: new Date(message.timestamp).getTime(),
          end: new Date(message.timestamp).getTime()
        }
      };

      processed.add(message.id);

      // 查找相似的消息
      for (const otherMessage of messages) {
        if (processed.has(otherMessage.id)) continue;

        const otherVector = vectorMap.get(otherMessage.id);
        if (!otherVector) continue;

        // 计算关键词重叠度
        const overlap = this.calculateKeywordOverlap(vector.keywords, otherVector.keywords);
        
        if (overlap > 0.3) { // 30%重叠度阈值
          cluster.messages.push(otherMessage);
          processed.add(otherMessage.id);
          
          // 更新时间跨度
          const msgTime = new Date(otherMessage.timestamp).getTime();
          cluster.timeSpan.start = Math.min(cluster.timeSpan.start, msgTime);
          cluster.timeSpan.end = Math.max(cluster.timeSpan.end, msgTime);
        }
      }

      // 计算聚类一致性分数
      cluster.coherenceScore = this.calculateClusterCoherence(cluster);

      if (cluster.messages.length >= 2) { // 至少2条消息才算一个话题
        clusters.push(cluster);
      }
    }

    return clusters.sort((a, b) => b.coherenceScore - a.coherenceScore);
  }

  /**
   * 计算关键词重叠度
   */
  private calculateKeywordOverlap(keywords1: string[], keywords2: string[]): number {
    const set1 = new Set(keywords1);
    const set2 = new Set(keywords2);
    
    const intersection = new Set([...set1].filter(k => set2.has(k)));
    const union = new Set([...set1, ...set2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * 计算聚类一致性分数
   */
  private calculateClusterCoherence(cluster: TopicCluster): number {
    if (cluster.messages.length < 2) return 1.0;

    let totalSimilarity = 0;
    let pairCount = 0;

    // 计算聚类内消息的平均相似度
    for (let i = 0; i < cluster.messages.length; i++) {
      for (let j = i + 1; j < cluster.messages.length; j++) {
        const similarity = this.textProcessor.calculateSimilarity(
          cluster.messages[i].content,
          cluster.messages[j].content
        );
        totalSimilarity += similarity;
        pairCount++;
      }
    }

    return pairCount > 0 ? totalSimilarity / pairCount : 0;
  }

  /**
   * 更新话题信息
   */
  private updateTopicInfo(clusters: TopicCluster[]): void {
    const now = Date.now();

    // 衰减现有话题权重
    for (const topic of this.currentTopics.values()) {
      topic.weight *= this.config.topicDecayFactor;
    }

    // 添加或更新话题
    for (const cluster of clusters) {
      const topicId = cluster.clusterId;
      
      const topicInfo: TopicInfo = {
        id: topicId,
        keywords: cluster.centerKeywords,
        weight: cluster.coherenceScore * cluster.messages.length,
        messageIds: cluster.messages.map(m => m.id),
        createdAt: cluster.timeSpan.start,
        lastUpdated: now
      };

      this.currentTopics.set(topicId, topicInfo);

      // 更新消息-话题映射
      for (const message of cluster.messages) {
        this.messageTopicMap.set(message.id, topicId);
      }
    }

    // 清理过期或权重过低的话题
    this.cleanupTopics();
  }

  /**
   * 清理过期话题
   */
  private cleanupTopics(): void {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24小时
    const minWeight = 0.1;

    for (const [topicId, topic] of this.currentTopics.entries()) {
      const age = now - topic.lastUpdated;
      
      if (age > maxAge || topic.weight < minWeight) {
        this.currentTopics.delete(topicId);
        
        // 清理消息映射
        for (const messageId of topic.messageIds) {
          this.messageTopicMap.delete(messageId);
        }
      }
    }

    // 限制话题数量
    if (this.currentTopics.size > this.config.maxTopics) {
      const sortedTopics = Array.from(this.currentTopics.entries())
        .sort((a, b) => b[1].weight - a[1].weight);
      
      const toRemove = sortedTopics.slice(this.config.maxTopics);
      for (const [topicId] of toRemove) {
        this.currentTopics.delete(topicId);
      }
    }
  }

  /**
   * 检测话题转换
   */
  detectTopicTransition(messages: Message[]): TopicTransition | null {
    if (messages.length < 2) return null;

    const recentMessages = messages.slice(-5); // 分析最近5条消息
    const topics = this.identifyTopics(recentMessages, 2);

    if (topics.length < 2) return null;

    const [newTopic, oldTopic] = topics;
    
    // 检查是否发生了显著的话题转换
    const transitionConfidence = this.calculateTransitionConfidence(newTopic, oldTopic);
    
    if (transitionConfidence > this.config.transitionThreshold) {
      return {
        fromTopic: oldTopic,
        toTopic: newTopic,
        transitionPoint: messages.length - 3, // 估算转换点
        confidence: transitionConfidence,
        triggerKeywords: newTopic.keywords.slice(0, 3)
      };
    }

    return null;
  }

  /**
   * 计算话题转换置信度
   */
  private calculateTransitionConfidence(newTopic: TopicInfo, oldTopic: TopicInfo): number {
    // 基于关键词差异和权重差异计算
    const keywordOverlap = this.calculateKeywordOverlap(newTopic.keywords, oldTopic.keywords);
    const weightRatio = newTopic.weight / (oldTopic.weight + 0.1);
    
    // 重叠度越低，权重比越高，转换置信度越高
    return (1 - keywordOverlap) * Math.min(weightRatio, 2.0) * 0.5;
  }

  /**
   * 获取当前活跃话题
   */
  getCurrentTopics(): TopicInfo[] {
    return Array.from(this.currentTopics.values())
      .sort((a, b) => b.weight - a.weight);
  }

  /**
   * 获取消息所属话题
   */
  getMessageTopic(messageId: string): TopicInfo | null {
    const topicId = this.messageTopicMap.get(messageId);
    return topicId ? this.currentTopics.get(topicId) || null : null;
  }

  /**
   * 清理缓存
   */
  clearCache(): void {
    this.cache.clear();
    this.textProcessor.clearCache();
    this.tfidfCalculator.clearCache();
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<typeof this.config>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    activeTopics: number;
    totalMessages: number;
    cacheSize: number;
    averageTopicWeight: number;
  } {
    const topics = Array.from(this.currentTopics.values());
    const averageWeight = topics.length > 0 
      ? topics.reduce((sum, t) => sum + t.weight, 0) / topics.length 
      : 0;

    return {
      activeTopics: this.currentTopics.size,
      totalMessages: this.messageTopicMap.size,
      cacheSize: this.cache.size,
      averageTopicWeight: averageWeight
    };
  }
} 