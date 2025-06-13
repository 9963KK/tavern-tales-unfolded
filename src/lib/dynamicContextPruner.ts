import { Message } from '../types/message';
import { AICharacter } from '../types/character';
import { ChineseTextProcessor } from '../utils/chineseTextProcessor';
import { TFIDFCalculator } from './tfidfCalculator';
import { TopicRelevanceAnalyzer, RelevanceScore } from './topicRelevanceAnalyzer';

// 裁剪配置接口
export interface PruningConfig {
  // 基础配置
  maxTokens: number;              // 最大token预算（默认：4000）
  minRetainRatio: number;         // 最小保留比例（默认：0.3）
  
  // 重要性权重
  systemMessageWeight: number;    // 系统消息权重（默认：1.0）
  userMessageWeight: number;      // 用户消息权重（默认：0.8）
  aiMessageWeight: number;        // AI消息权重（默认：0.6）
  
  // 时间衰减
  timeDecayFactor: number;        // 时间衰减因子（默认：0.95）
  recentMessageBonus: number;     // 最近消息加成（默认：1.2）
  
  // 相关性阈值
  topicRelevanceThreshold: number; // 话题相关性阈值（默认：0.3）
  personalityWeight: number;       // 个性化权重系数（默认：0.4）
  
  // 性能配置
  enableCaching: boolean;         // 启用缓存（默认：true）
  maxCacheSize: number;          // 最大缓存大小（默认：1000）
  processingTimeout: number;      // 处理超时时间（默认：5000ms）
  
  // 系统消息优先级
  systemMessagePriority: number; // 系统消息优先级（默认：10）
}

// 消息重要性评分接口
export interface MessageImportance {
  messageId: string;
  baseScore: number;              // 基础重要性分数
  typeWeight: number;             // 消息类型权重
  timeWeight: number;             // 时间权重
  lengthWeight: number;           // 长度权重
  mentionWeight: number;          // @提及权重
  emotionWeight: number;          // 情感权重
  topicRelevance: number;         // 话题相关性
  personalityRelevance: number;   // 个性化相关性
  finalScore: number;             // 最终综合分数
  tokens: number;                 // 消息token数量
}

// 裁剪结果接口
export interface PruningResult {
  prunedMessages: Message[];      // 裁剪后的消息列表
  removedMessages: Message[];     // 被移除的消息列表
  totalTokens: number;            // 总token数量
  retainedTokens: number;         // 保留的token数量
  retainRatio: number;            // 保留比例
  processingTime: number;         // 处理时间（毫秒）
  importanceScores: MessageImportance[]; // 重要性评分详情
  metadata: {
    strategy: string;             // 使用的裁剪策略
    characterId?: string;         // 针对的角色ID
    topicKeywords: string[];      // 当前话题关键词
    cacheHits: number;            // 缓存命中次数
  };
}

// 预算分配策略
export interface BudgetAllocation {
  systemMessages: number;        // 系统消息预算（20%）
  characterDefinitions: number;  // 角色定义预算（15%）
  importantDialogue: number;     // 重要对话预算（40%）
  generalDialogue: number;       // 一般对话预算（25%）
}

// 动态上下文裁剪器主类
export class DynamicContextPruner {
  private config: PruningConfig;
  private cache: Map<string, any>;
  private cacheTimestamps: Map<string, number>;
  private textProcessor: ChineseTextProcessor;
  private tfidfCalculator: TFIDFCalculator;
  private topicAnalyzer: TopicRelevanceAnalyzer;

  constructor(config?: Partial<PruningConfig>) {
    // 默认配置
    this.config = {
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
      systemMessagePriority: 10,
      ...config
    };

    this.cache = new Map();
    this.cacheTimestamps = new Map();
    this.textProcessor = new ChineseTextProcessor();
    this.tfidfCalculator = new TFIDFCalculator();
    this.topicAnalyzer = new TopicRelevanceAnalyzer();
  }

  /**
   * 主要的上下文裁剪方法
   */
  async pruneContext(
    messages: Message[],
    character?: AICharacter,
    currentTopic?: string
  ): Promise<PruningResult> {
    const startTime = Date.now();
    
    try {
      // 1. 计算每条消息的token数量
      const messagesWithTokens = await this.calculateTokens(messages);
      
      // 2. 计算消息重要性评分
      const importanceScores = await this.calculateImportanceScores(
        messagesWithTokens,
        character,
        currentTopic
      );
      
      // 3. 执行裁剪策略
      const prunedResult = await this.executePruningStrategy(
        messagesWithTokens,
        importanceScores,
        character
      );
      
      const processingTime = Date.now() - startTime;
      
      return {
        ...prunedResult,
        processingTime,
        importanceScores,
        metadata: {
          strategy: 'dynamic',
          characterId: character?.id,
          topicKeywords: currentTopic ? [currentTopic] : [],
          cacheHits: 0 // 将在后续实现中更新
        }
      };
    } catch (error) {
      console.error('Context pruning failed:', error);
      // 回退策略：返回最近的消息
      return this.fallbackPruning(messages);
    }
  }

  /**
   * 计算消息token数量
   */
  private async calculateTokens(messages: Message[]): Promise<(Message & { tokens: number })[]> {
    return messages.map(message => ({
      ...message,
      tokens: this.estimateTokenCount(message.text || '')
    }));
  }

  /**
   * 估算token数量（简化实现，支持中文）
   */
  private estimateTokenCount(text: string): number {
    // 中文字符通常占用更多token
    const chineseCharCount = (text.match(/[\u4e00-\u9fff]/g) || []).length;
    const englishWordCount = text.split(/\s+/).filter(word => 
      word.length > 0 && !/[\u4e00-\u9fff]/.test(word)
    ).length;
    const specialCharCount = (text.match(/[^\w\s\u4e00-\u9fff]/g) || []).length;
    
    // 估算公式：中文字符*1.5 + 英文单词*1 + 特殊字符*0.5
    return Math.ceil(chineseCharCount * 1.5 + englishWordCount * 1 + specialCharCount * 0.5);
  }

  /**
   * 计算消息重要性评分
   */
  private async calculateImportanceScores(
    messages: (Message & { tokens: number })[],
    character?: AICharacter,
    currentTopic?: string
  ): Promise<MessageImportance[]> {
    const now = Date.now();
    
    // 使用话题分析器识别当前话题
    const topics = this.topicAnalyzer.identifyTopics(messages, 3);
    const dominantTopic = topics.length > 0 ? topics[0].keywords.join(' ') : currentTopic;
    
    return messages.map((message, index) => {
      // 基础分数
      const baseScore = this.calculateBaseScore(message);
      
      // 消息类型权重
      const typeWeight = this.getMessageTypeWeight(message);
      
      // 时间权重（越新越重要）
      const timeWeight = this.calculateTimeWeight(message, now, index, messages.length);
      
      // 长度权重（适中长度优先）
      const lengthWeight = this.calculateLengthWeight(message.tokens);
      
      // @提及权重
      const mentionWeight = this.calculateMentionWeight(message, character);
      
      // 情感权重（增强版）
      const emotionWeight = this.calculateEnhancedEmotionWeight(message);
      
      // 使用智能话题相关性分析
      const relevanceScore = this.topicAnalyzer.analyzeTopicRelevance(
        message,
        dominantTopic,
        character,
        messages
      );
      
      const topicRelevance = relevanceScore.topicRelevance;
      const personalityRelevance = relevanceScore.characterRelevance;
      
      // 最终综合分数（调整权重分配）
      const finalScore = (
        baseScore * 0.15 +
        typeWeight * 0.15 +
        timeWeight * 0.15 +
        lengthWeight * 0.08 +
        mentionWeight * 0.12 +
        emotionWeight * 0.1 +
        topicRelevance * 0.15 +
        personalityRelevance * 0.1
      );

      return {
        messageId: message.id,
        baseScore,
        typeWeight,
        timeWeight,
        lengthWeight,
        mentionWeight,
        emotionWeight,
        topicRelevance,
        personalityRelevance,
        finalScore,
        tokens: message.tokens
      };
    });
  }

  /**
   * 计算基础重要性分数
   */
  private calculateBaseScore(message: Message): number {
    // 系统消息最重要
    if (message.role === 'system') return 1.0;
    
    // 用户消息次之
    if (message.role === 'user') return 0.8;
    
    // AI消息相对较低
    return 0.6;
  }

  /**
   * 获取消息类型权重
   */
  private getMessageTypeWeight(message: Message): number {
    switch (message.role) {
      case 'system':
        return this.config.systemMessageWeight;
      case 'user':
        return this.config.userMessageWeight;
      case 'assistant':
        return this.config.aiMessageWeight;
      default:
        return 0.5;
    }
  }

  /**
   * 计算时间权重
   */
  private calculateTimeWeight(
    message: Message,
    now: number,
    index: number,
    totalMessages: number
  ): number {
    // 基于消息位置的权重（越靠后越重要）
    const positionWeight = (index + 1) / totalMessages;
    
    // 时间衰减
    const messageTime = new Date(message.timestamp).getTime();
    const timeDiff = now - messageTime;
    const hoursPassed = timeDiff / (1000 * 60 * 60);
    const timeDecay = Math.pow(this.config.timeDecayFactor, hoursPassed);
    
    // 最近消息加成
    const recentBonus = index >= totalMessages - 5 ? this.config.recentMessageBonus : 1.0;
    
    return positionWeight * timeDecay * recentBonus;
  }

  /**
   * 计算长度权重
   */
  private calculateLengthWeight(tokens: number): number {
    // 适中长度优先（20-200 tokens）
    if (tokens < 5) return 0.3;
    if (tokens < 20) return 0.7;
    if (tokens <= 200) return 1.0;
    if (tokens <= 500) return 0.8;
    return 0.6;
  }

  /**
   * 计算@提及权重
   */
  private calculateMentionWeight(message: Message, character?: AICharacter): number {
    if (!character) return 1.0;
    
    const content = (message.text || '').toLowerCase();
    const characterName = character.name.toLowerCase();
    
    // 检查是否包含@提及
    if (content.includes(`@${characterName}`) || content.includes(`@${character.id}`)) {
      return 2.0; // 直接提及权重翻倍
    }
    
    // 检查是否包含角色名称
    if (content.includes(characterName)) {
      return 1.5; // 包含名称权重增加
    }
    
    return 1.0;
  }

  /**
   * 计算情感权重（简化实现）
   */
  private calculateEmotionWeight(message: Message): number {
    const content = message.text || '';
    
    // 简单的情感标记检测
    const emotionMarkers = ['!', '?', '...', '😊', '😢', '😡', '❤️', '💔'];
    let emotionScore = 1.0;
    
    for (const marker of emotionMarkers) {
      if (content.includes(marker)) {
        emotionScore += 0.1;
      }
    }
    
    return Math.min(emotionScore, 2.0);
  }

  /**
   * 计算增强的情感权重
   */
  private calculateEnhancedEmotionWeight(message: Message): number {
    const content = message.text || '';
    let emotionScore = 1.0;
    
    // 情感表情符号权重
    const emotionEmojis = {
      '😊': 0.15, '😄': 0.15, '😃': 0.15, '😁': 0.15, '🙂': 0.1,
      '😢': 0.2, '😭': 0.25, '😞': 0.15, '😔': 0.15, '😟': 0.15,
      '😡': 0.25, '😠': 0.2, '🤬': 0.3, '😤': 0.15,
      '❤️': 0.2, '💕': 0.15, '💖': 0.15, '💔': 0.25,
      '😱': 0.2, '😨': 0.15, '😰': 0.15, '😳': 0.15,
      '🤔': 0.1, '😏': 0.1, '😎': 0.1, '🙄': 0.1
    };
    
    for (const [emoji, weight] of Object.entries(emotionEmojis)) {
      if (content.includes(emoji)) {
        emotionScore += weight;
      }
    }
    
    // 情感词汇检测
    const emotionWords = {
      // 积极情感
      '开心': 0.15, '高兴': 0.15, '快乐': 0.15, '兴奋': 0.2, '激动': 0.2,
      '喜欢': 0.1, '爱': 0.15, '感谢': 0.1, '谢谢': 0.1, '棒': 0.1,
      
      // 消极情感
      '难过': 0.2, '伤心': 0.2, '痛苦': 0.25, '失望': 0.15, '沮丧': 0.15,
      '生气': 0.2, '愤怒': 0.25, '讨厌': 0.15, '烦': 0.1, '郁闷': 0.15,
      '害怕': 0.15, '恐惧': 0.2, '担心': 0.1, '焦虑': 0.15,
      
      // 强调词
      '非常': 0.1, '特别': 0.1, '超级': 0.15, '极其': 0.15, '太': 0.1,
      '真的': 0.05, '确实': 0.05, '绝对': 0.1
    };
    
    for (const [word, weight] of Object.entries(emotionWords)) {
      if (content.includes(word)) {
        emotionScore += weight;
      }
    }
    
    // 标点符号强度
    const exclamationCount = (content.match(/!/g) || []).length;
    const questionCount = (content.match(/\?/g) || []).length;
    const ellipsisCount = (content.match(/\.\.\./g) || []).length;
    
    emotionScore += Math.min(exclamationCount * 0.1, 0.3);
    emotionScore += Math.min(questionCount * 0.05, 0.2);
    emotionScore += Math.min(ellipsisCount * 0.1, 0.2);
    
    // 大写字母比例（表示强调）
    const upperCaseRatio = (content.match(/[A-Z]/g) || []).length / content.length;
    if (upperCaseRatio > 0.3) {
      emotionScore += 0.15;
    }
    
    return Math.min(emotionScore, 2.5);
  }

  /**
   * 计算话题相关性（简化实现）
   */
  private calculateTopicRelevance(message: Message, currentTopic?: string): number {
    if (!currentTopic) return 1.0;
    
    const content = (message.text || '').toLowerCase();
    const topic = currentTopic.toLowerCase();
    
    // 简单的关键词匹配
    if (content.includes(topic)) {
      return 1.5;
    }
    
    return 1.0;
  }

  /**
   * 计算个性化相关性
   */
  private calculatePersonalityRelevance(message: Message, character?: AICharacter): number {
    if (!character) return 1.0;
    
    // 如果是角色自己的消息，权重较高
    if (message.characterId === character.id) {
      return 1.3;
    }
    
    // 如果是对该角色的回复，权重增加
    if (message.role === 'user' || message.role === 'assistant') {
      return 1.1;
    }
    
    return 1.0;
  }

  /**
   * 执行裁剪策略
   */
  private async executePruningStrategy(
    messages: (Message & { tokens: number })[],
    importanceScores: MessageImportance[],
    character?: AICharacter
  ): Promise<Omit<PruningResult, 'processingTime' | 'importanceScores' | 'metadata'>> {
    // 计算总token数
    const totalTokens = messages.reduce((sum, msg) => sum + msg.tokens, 0);
    
    // 如果总token数在预算内，直接返回
    if (totalTokens <= this.config.maxTokens) {
      return {
        prunedMessages: messages,
        removedMessages: [],
        totalTokens,
        retainedTokens: totalTokens,
        retainRatio: 1.0
      };
    }
    
    // 创建预算分配
    const budgetAllocation = this.createBudgetAllocation();
    
    // 按重要性排序
    const sortedMessages = messages
      .map((msg, index) => ({ ...msg, importance: importanceScores[index] }))
      .sort((a, b) => b.importance.finalScore - a.importance.finalScore);
    
    // 选择要保留的消息
    const retainedMessages: typeof sortedMessages = [];
    let currentTokens = 0;
    
    // 首先保留系统消息
    for (const msg of sortedMessages) {
      if (msg.role === 'system') {
        retainedMessages.push(msg);
        currentTokens += msg.tokens;
      }
    }
    
    // 然后按重要性选择其他消息
    for (const msg of sortedMessages) {
      if (msg.role !== 'system' && currentTokens + msg.tokens <= this.config.maxTokens) {
        retainedMessages.push(msg);
        currentTokens += msg.tokens;
      }
    }
    
    // 确保保留比例不低于最小值
    const minRetainCount = Math.ceil(messages.length * this.config.minRetainRatio);
    if (retainedMessages.length < minRetainCount) {
      // 添加最近的消息直到达到最小保留比例
      const recentMessages = messages.slice(-minRetainCount);
      for (const msg of recentMessages) {
        if (!retainedMessages.find(retained => retained.id === msg.id)) {
          retainedMessages.push({ ...msg, importance: importanceScores[messages.indexOf(msg)] });
        }
      }
    }
    
    // 按原始顺序排序
    const finalMessages = retainedMessages
      .sort((a, b) => messages.indexOf(a) - messages.indexOf(b))
      .map(({ importance, ...msg }) => msg);
    
    const removedMessages = messages.filter(
      msg => !finalMessages.find(retained => retained.id === msg.id)
    );
    
    return {
      prunedMessages: finalMessages,
      removedMessages,
      totalTokens,
      retainedTokens: currentTokens,
      retainRatio: currentTokens / totalTokens
    };
  }

  /**
   * 创建预算分配策略
   */
  private createBudgetAllocation(): BudgetAllocation {
    const total = this.config.maxTokens;
    return {
      systemMessages: Math.floor(total * 0.2),      // 20%
      characterDefinitions: Math.floor(total * 0.15), // 15%
      importantDialogue: Math.floor(total * 0.4),   // 40%
      generalDialogue: Math.floor(total * 0.25)     // 25%
    };
  }

  /**
   * 回退裁剪策略（简单的滑动窗口）
   */
  private fallbackPruning(messages: Message[]): PruningResult {
    const maxMessages = Math.floor(this.config.maxTokens / 50); // 假设平均50 tokens per message
    const retainCount = Math.max(
      Math.ceil(messages.length * this.config.minRetainRatio),
      Math.min(maxMessages, messages.length)
    );
    
    const prunedMessages = messages.slice(-retainCount);
    const removedMessages = messages.slice(0, -retainCount);
    
    return {
      prunedMessages,
      removedMessages,
      totalTokens: messages.length * 50, // 估算
      retainedTokens: prunedMessages.length * 50, // 估算
      retainRatio: prunedMessages.length / messages.length,
      processingTime: 0,
      importanceScores: [],
      metadata: {
        strategy: 'fallback',
        topicKeywords: [],
        cacheHits: 0
      }
    };
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<PruningConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * 获取当前配置
   */
  getConfig(): PruningConfig {
    return { ...this.config };
  }

  /**
   * 清理缓存
   */
  clearCache(): void {
    this.cache.clear();
    this.cacheTimestamps.clear();
  }
} 