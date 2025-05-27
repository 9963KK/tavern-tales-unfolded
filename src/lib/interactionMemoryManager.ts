/**
 * 交互记忆管理器
 * 智能分析和记录AI角色间的交互模式
 */

import {
  InteractionEvent,
  InteractionSession,
  InteractionHistory,
  InteractionType,
  InteractionPattern,
  InteractionQuality,
  InteractionStatus,
  InteractionOutcome,
  InteractionPatternRecognition,
  InteractionAnalysisConfig,
  InteractionMemoryManagerState,
  InteractionInsight,
  InteractionIntelligence
} from '@/types/interaction';

import { Message, AICharacter } from '@/types/tavern';
import { EmotionalState } from '@/types/emotion';
import { Relationship } from '@/types/relationship';

/**
 * 默认交互分析配置
 */
const DEFAULT_INTERACTION_CONFIG: InteractionAnalysisConfig = {
  detection: {
    minSessionDuration: 5000,          // 5秒
    maxSessionGap: 180000,             // 3分钟
    minEventDuration: 1000,            // 1秒
    patternDetectionWindow: 10         // 10个事件
  },
  
  analysisDepth: 'moderate',
  
  qualityAssessment: {
    responseTimeWeight: 0.2,
    contentQualityWeight: 0.4,
    engagementWeight: 0.3,
    outcomeWeight: 0.1
  },
  
  patternRecognition: {
    enabled: true,
    minOccurrences: 3,
    confidenceThreshold: 0.7,
    temporalSensitivity: 0.8
  },
  
  performance: {
    maxHistorySize: 1000,
    cacheSize: 200,
    batchSize: 50,
    updateFrequency: 30
  }
};

/**
 * 交互分析结果
 */
interface InteractionAnalysisResult {
  type: InteractionType;
  pattern: InteractionPattern;
  quality: InteractionQuality;
  intensity: number;
  engagement: number;
  satisfaction: number;
  behaviorAnalysis: {
    dominance: Record<string, number>;
    cooperation: number;
    conflict: number;
    creativity: number;
    logic: number;
  };
  confidence: number;
  reasoning: string;
}

/**
 * 交互记忆管理器
 */
export class InteractionMemoryManager {
  private config: InteractionAnalysisConfig;
  private state: InteractionMemoryManagerState;
  private histories: Map<string, InteractionHistory> = new Map();
  private activeSessions: Map<string, InteractionSession> = new Map();
  private recentPatterns: Map<string, InteractionPatternRecognition> = new Map();
  private analysisCache: Map<string, InteractionAnalysisResult> = new Map();
  
  // 中文主题和关键词库
  private topicClassifier: Map<string, string[]> = new Map([
    ['social', ['聊天', '闲谈', '社交', '朋友', '分享', '倾诉']],
    ['learning', ['学习', '知识', '教学', '请教', '解释', '指导']],
    ['game', ['游戏', '玩', '娱乐', '比赛', '挑战', '竞争']],
    ['emotion', ['感情', '心情', '情感', '爱', '恨', '喜欢', '难过']],
    ['work', ['工作', '任务', '职责', '目标', '计划', '协作']],
    ['problem', ['问题', '困难', '麻烦', '解决', '帮助', '建议']],
    ['creative', ['创作', '创意', '想象', '艺术', '故事', '表演']],
    ['information', ['消息', '新闻', '信息', '告诉', '通知', '更新']]
  ]);

  constructor(characters: AICharacter[], config?: Partial<InteractionAnalysisConfig>) {
    this.config = { ...DEFAULT_INTERACTION_CONFIG, ...config };
    
    this.state = {
      isActive: true,
      totalSessions: 0,
      totalEvents: 0,
      totalPatterns: 0,
      performance: {
        analysisCount: 0,
        averageAnalysisTime: 0,
        cacheHitRate: 0,
        memoryUsage: 0
      },
      systemHealth: {
        dataIntegrity: 1.0,
        analysisAccuracy: 0.85,
        responseTime: 120
      },
      currentConfig: this.config,
      lastConfigUpdate: new Date(),
      lastUpdate: new Date()
    };

    // 初始化角色交互历史
    this.initializeCharacterHistories(characters);
    
    console.log('💬 交互记忆系统初始化完成');
  }

  /**
   * 处理新消息，检测和分析交互
   */
  public async processMessage(
    message: Message,
    characters: AICharacter[],
    context: Message[],
    emotionalStates?: Map<string, EmotionalState>,
    relationships?: Map<string, Relationship>
  ): Promise<void> {
    const startTime = Date.now();
    
    try {
      // 检测交互事件
      const interactionEvent = await this.detectInteractionEvent(
        message, 
        characters, 
        context, 
        emotionalStates
      );
      
      if (interactionEvent) {
        // 更新或创建会话
        await this.updateSession(interactionEvent, context);
        
        // 更新角色历史
        for (const participantId of interactionEvent.participantIds) {
          this.updateCharacterHistory(participantId, interactionEvent);
        }
        
        // 检测模式
        if (this.config.patternRecognition.enabled) {
          await this.detectInteractionPatterns(interactionEvent);
        }
        
        console.log(`💬 处理交互事件: ${interactionEvent.type}, 参与者: ${interactionEvent.participantIds.length}`);
      }
      
      // 更新性能统计
      this.updatePerformanceStats(Date.now() - startTime);
      
    } catch (error) {
      console.error('交互处理失败:', error);
    }
  }

  /**
   * 检测交互事件
   */
  private async detectInteractionEvent(
    message: Message,
    characters: AICharacter[],
    context: Message[],
    emotionalStates?: Map<string, EmotionalState>
  ): Promise<InteractionEvent | null> {
    // 只处理AI角色的消息
    const sender = characters.find(c => c.name === message.sender);
    if (!sender || message.isPlayer) {
      return null;
    }

    // 分析交互参与者
    const participantIds = this.identifyParticipants(message, context, characters);
    if (participantIds.length < 2) {
      return null; // 需要至少2个参与者
    }

    // 分析交互内容
    const analysisResult = await this.analyzeInteraction(message, context, characters);
    
    // 检测情感变化
    const emotionalChange = this.detectEmotionalChange(
      participantIds,
      emotionalStates,
      context
    );

    // 生成交互事件
    const interactionEvent: InteractionEvent = {
      id: crypto.randomUUID(),
      sessionId: await this.getOrCreateSessionId(participantIds, context),
      type: analysisResult.type,
      participantIds,
      initiatorId: sender.id,
      timestamp: message.timestamp,
      duration: this.estimateEventDuration(message, context),
      
      messageIds: [message.id],
      topics: this.extractTopics(message.text),
      keywords: this.extractKeywords(message.text),
      
      quality: analysisResult.quality,
      pattern: analysisResult.pattern,
      intensity: analysisResult.intensity,
      engagement: analysisResult.engagement,
      satisfaction: analysisResult.satisfaction,
      
      emotionalTone: this.detectEmotionalTone(message.text),
      emotionalChange,
      
      behaviorAnalysis: analysisResult.behaviorAnalysis,
      
      outcomes: [], // 将在后续分析中填充
      relationshipImpact: this.calculateRelationshipImpact(participantIds, analysisResult),
      
      status: InteractionStatus.COMPLETED,
      confidence: analysisResult.confidence,
      tags: this.generateEventTags(analysisResult, message),
      notes: analysisResult.reasoning
    };

    return interactionEvent;
  }

  /**
   * 分析交互内容
   */
  private async analyzeInteraction(
    message: Message,
    context: Message[],
    characters: AICharacter[]
  ): Promise<InteractionAnalysisResult> {
    const text = message.text;
    const recentContext = context.slice(-5);
    
    // 检查缓存
    const cacheKey = `${message.id}_${text.substring(0, 50)}`;
    if (this.analysisCache.has(cacheKey)) {
      this.state.performance.cacheHitRate++;
      return this.analysisCache.get(cacheKey)!;
    }

    // 分析交互类型
    const type = this.classifyInteractionType(text, recentContext);
    
    // 分析交互模式
    const pattern = this.identifyInteractionPattern(message, recentContext, characters);
    
    // 评估交互质量
    const quality = this.assessInteractionQuality(message, recentContext);
    
    // 计算各项指标
    const intensity = this.calculateInteractionIntensity(text);
    const engagement = this.calculateEngagement(message, recentContext);
    const satisfaction = this.estimateSatisfaction(text, type, quality);
    
    // 行为分析
    const behaviorAnalysis = this.analyzeBehaviors(message, recentContext, characters);
    
    // 置信度计算
    const confidence = this.calculateAnalysisConfidence(text, recentContext);
    
    const result: InteractionAnalysisResult = {
      type,
      pattern,
      quality,
      intensity,
      engagement,
      satisfaction,
      behaviorAnalysis,
      confidence,
      reasoning: this.generateAnalysisReasoning(type, pattern, quality, text)
    };

    // 缓存结果
    this.analysisCache.set(cacheKey, result);
    if (this.analysisCache.size > this.config.performance.cacheSize) {
      const firstKey = this.analysisCache.keys().next().value;
      this.analysisCache.delete(firstKey);
    }

    return result;
  }

  /**
   * 分类交互类型
   */
  private classifyInteractionType(text: string, context: Message[]): InteractionType {
    // 基于关键词和上下文分析交互类型
    const textLower = text.toLowerCase();
    
    // 情感支持
    if (this.containsKeywords(textLower, ['安慰', '支持', '理解', '没关系', '别担心'])) {
      return InteractionType.EMOTIONAL_SUPPORT;
    }
    
    // 学习交流
    if (this.containsKeywords(textLower, ['学习', '教', '解释', '为什么', '如何', '请教'])) {
      return InteractionType.LEARNING;
    }
    
    // 协作互动
    if (this.containsKeywords(textLower, ['一起', '合作', '帮助', '协助', '配合'])) {
      return InteractionType.COLLABORATION;
    }
    
    // 冲突争执
    if (this.containsKeywords(textLower, ['反对', '不同意', '错了', '争论', '生气'])) {
      return InteractionType.CONFLICT;
    }
    
    // 游戏娱乐
    if (this.containsKeywords(textLower, ['游戏', '玩', '有趣', '娱乐', '笑', '开心'])) {
      return InteractionType.GAME;
    }
    
    // 问题解决
    if (this.containsKeywords(textLower, ['问题', '解决', '困难', '建议', '想办法'])) {
      return InteractionType.PROBLEM_SOLVING;
    }
    
    // 信息交换
    if (this.containsKeywords(textLower, ['告诉', '通知', '消息', '新闻', '信息', '知道'])) {
      return InteractionType.INFORMATION_EXCHANGE;
    }
    
    // 社交联结
    if (this.containsKeywords(textLower, ['朋友', '友谊', '关系', '喜欢', '亲密'])) {
      return InteractionType.SOCIAL_BONDING;
    }
    
    // 默认为对话交流
    return InteractionType.CONVERSATION;
  }

  /**
   * 识别交互模式
   */
  private identifyInteractionPattern(
    message: Message,
    context: Message[],
    characters: AICharacter[]
  ): InteractionPattern {
    const recentMessages = context.slice(-10);
    
    // 分析发言模式
    const speakers = recentMessages.map(msg => msg.sender);
    const uniqueSpeakers = new Set(speakers);
    
    // 轮流发言模式
    if (this.isAlternatingPattern(speakers)) {
      return InteractionPattern.TURN_TAKING;
    }
    
    // 主导-服从模式
    if (this.isDominantSubmissivePattern(speakers, recentMessages)) {
      return InteractionPattern.DOMINANT_SUBMISSIVE;
    }
    
    // 协作模式
    if (this.isCollaborativePattern(message.text, recentMessages)) {
      return InteractionPattern.COLLABORATIVE;
    }
    
    // 竞争模式
    if (this.isCompetitivePattern(message.text, recentMessages)) {
      return InteractionPattern.COMPETITIVE;
    }
    
    // 支持模式
    if (this.isSupportivePattern(message.text, recentMessages)) {
      return InteractionPattern.SUPPORTIVE;
    }
    
    // 探索模式
    if (this.isExploratoryPattern(message.text, recentMessages)) {
      return InteractionPattern.EXPLORATORY;
    }
    
    // 平行交流（多人同时说话）
    if (uniqueSpeakers.size > 2 && this.hasOverlappingMessages(recentMessages)) {
      return InteractionPattern.PARALLEL;
    }
    
    // 默认为反应式
    return InteractionPattern.REACTIVE;
  }

  /**
   * 评估交互质量
   */
  private assessInteractionQuality(message: Message, context: Message[]): InteractionQuality {
    let qualityScore = 0.5; // 基础分数
    
    // 响应时间评估
    if (context.length > 0) {
      const lastMessage = context[context.length - 1];
      const responseTime = message.timestamp.getTime() - lastMessage.timestamp.getTime();
      
      if (responseTime < 10000) { // 10秒内
        qualityScore += 0.2;
      } else if (responseTime > 60000) { // 超过1分钟
        qualityScore -= 0.1;
      }
    }
    
    // 内容质量评估
    const text = message.text;
    
    // 长度适中
    if (text.length >= 10 && text.length <= 200) {
      qualityScore += 0.1;
    }
    
    // 包含问号（互动性）
    if (text.includes('？') || text.includes('?')) {
      qualityScore += 0.1;
    }
    
    // 情感表达
    if (this.containsEmotionalWords(text)) {
      qualityScore += 0.1;
    }
    
    // 上下文相关性
    if (this.isContextually RelevantText(text, context)) {
      qualityScore += 0.1;
    }
    
    // 转换为质量等级
    if (qualityScore >= 0.8) return InteractionQuality.EXCELLENT;
    if (qualityScore >= 0.65) return InteractionQuality.GOOD;
    if (qualityScore >= 0.4) return InteractionQuality.AVERAGE;
    if (qualityScore >= 0.2) return InteractionQuality.POOR;
    return InteractionQuality.FAILED;
  }

  /**
   * 计算交互强度
   */
  private calculateInteractionIntensity(text: string): number {
    let intensity = 0.3; // 基础强度
    
    // 感叹号增加强度
    const exclamationCount = (text.match(/[！!]/g) || []).length;
    intensity += Math.min(0.3, exclamationCount * 0.1);
    
    // 大写字母（如果有英文）
    const upperCaseRatio = (text.match(/[A-Z]/g) || []).length / text.length;
    intensity += upperCaseRatio * 0.2;
    
    // 情感词汇
    if (this.containsKeywords(text, ['激动', '兴奋', '愤怒', '惊讶', '震惊'])) {
      intensity += 0.3;
    }
    
    // 重复字符
    if (/(.)\1{2,}/.test(text)) {
      intensity += 0.2;
    }
    
    return Math.max(0.1, Math.min(1.0, intensity));
  }

  /**
   * 计算参与度
   */
  private calculateEngagement(message: Message, context: Message[]): number {
    let engagement = 0.5;
    
    // 消息长度
    const textLength = message.text.length;
    if (textLength > 20) engagement += 0.2;
    if (textLength > 50) engagement += 0.1;
    
    // 包含问题
    if (message.text.includes('？') || message.text.includes('?')) {
      engagement += 0.2;
    }
    
    // 提及他人
    if (message.mentionedCharacters && message.mentionedCharacters.length > 0) {
      engagement += 0.2;
    }
    
    // 与上下文的连贯性
    if (context.length > 0 && this.isContextually RelevantText(message.text, context)) {
      engagement += 0.1;
    }
    
    return Math.max(0.1, Math.min(1.0, engagement));
  }

  /**
   * 估计满意度
   */
  private estimateSatisfaction(
    text: string, 
    type: InteractionType, 
    quality: InteractionQuality
  ): number {
    let satisfaction = 0.5;
    
    // 基于质量
    switch (quality) {
      case InteractionQuality.EXCELLENT:
        satisfaction = 0.9;
        break;
      case InteractionQuality.GOOD:
        satisfaction = 0.75;
        break;
      case InteractionQuality.AVERAGE:
        satisfaction = 0.5;
        break;
      case InteractionQuality.POOR:
        satisfaction = 0.3;
        break;
      case InteractionQuality.FAILED:
        satisfaction = 0.1;
        break;
    }
    
    // 基于交互类型调整
    if (type === InteractionType.EMOTIONAL_SUPPORT || type === InteractionType.SOCIAL_BONDING) {
      satisfaction += 0.1;
    } else if (type === InteractionType.CONFLICT) {
      satisfaction -= 0.2;
    }
    
    // 基于情感词汇
    if (this.containsKeywords(text, ['开心', '高兴', '满意', '棒', '好'])) {
      satisfaction += 0.1;
    } else if (this.containsKeywords(text, ['不满', '失望', '糟糕', '烦'])) {
      satisfaction -= 0.2;
    }
    
    return Math.max(0.0, Math.min(1.0, satisfaction));
  }

  /**
   * 分析行为模式
   */
  private analyzeBehaviors(
    message: Message,
    context: Message[],
    characters: AICharacter[]
  ): {
    dominance: Record<string, number>;
    cooperation: number;
    conflict: number;
    creativity: number;
    logic: number;
  } {
    const text = message.text;
    const sender = characters.find(c => c.name === message.sender);
    
    // 主导性分析
    const dominance: Record<string, number> = {};
    if (sender) {
      let dominanceScore = 0.5;
      
      // 命令式语言
      if (this.containsKeywords(text, ['应该', '必须', '一定要', '命令', '要求'])) {
        dominanceScore += 0.3;
      }
      
      // 问题vs陈述
      const questionRatio = (text.match(/[？?]/g) || []).length / text.length;
      dominanceScore -= questionRatio * 5; // 问题降低主导性
      
      dominance[sender.id] = Math.max(0, Math.min(1, dominanceScore));
    }
    
    // 合作程度
    let cooperation = 0.5;
    if (this.containsKeywords(text, ['一起', '合作', '帮助', '支持', '同意'])) {
      cooperation += 0.3;
    }
    
    // 冲突程度
    let conflict = 0.1;
    if (this.containsKeywords(text, ['不同意', '反对', '错了', '争论', '批评'])) {
      conflict += 0.4;
    }
    
    // 创造性
    let creativity = 0.3;
    if (this.containsKeywords(text, ['想象', '创意', '新的', '有趣', '创作', '故事'])) {
      creativity += 0.3;
    }
    
    // 逻辑性
    let logic = 0.4;
    if (this.containsKeywords(text, ['因为', '所以', '原因', '逻辑', '分析', '推理'])) {
      logic += 0.3;
    }
    
    return {
      dominance,
      cooperation: Math.max(0, Math.min(1, cooperation)),
      conflict: Math.max(0, Math.min(1, conflict)),
      creativity: Math.max(0, Math.min(1, creativity)),
      logic: Math.max(0, Math.min(1, logic))
    };
  }

  /**
   * 识别交互参与者
   */
  private identifyParticipants(
    message: Message,
    context: Message[],
    characters: AICharacter[]
  ): string[] {
    const participants = new Set<string>();
    
    // 发送者
    const sender = characters.find(c => c.name === message.sender);
    if (sender) {
      participants.add(sender.id);
    }
    
    // 明确提及的角色
    if (message.mentionedCharacters) {
      for (const mentionedName of message.mentionedCharacters) {
        const mentioned = characters.find(c => c.name === mentionedName);
        if (mentioned) {
          participants.add(mentioned.id);
        }
      }
    }
    
    // 最近的对话参与者
    const recentSpeakers = context
      .slice(-5)
      .filter(msg => !msg.isPlayer)
      .map(msg => msg.sender);
    
    for (const speakerName of recentSpeakers) {
      const speaker = characters.find(c => c.name === speakerName);
      if (speaker) {
        participants.add(speaker.id);
      }
    }
    
    return Array.from(participants);
  }

  /**
   * 检测情感变化
   */
  private detectEmotionalChange(
    participantIds: string[],
    emotionalStates?: Map<string, EmotionalState>,
    context?: Message[]
  ): {
    before: Record<string, number>;
    after: Record<string, number>;
  } {
    const before: Record<string, number> = {};
    const after: Record<string, number> = {};
    
    for (const participantId of participantIds) {
      // 简化实现：基于上下文推测情感变化
      before[participantId] = 0.5; // 中性基线
      after[participantId] = 0.5;
      
      if (emotionalStates?.has(participantId)) {
        const emotional = emotionalStates.get(participantId)!;
        after[participantId] = emotional.valence; // 使用情感效价作为情感值
      }
    }
    
    return { before, after };
  }

  /**
   * 提取主题
   */
  private extractTopics(text: string): string[] {
    const topics: string[] = [];
    
    for (const [topic, keywords] of this.topicClassifier.entries()) {
      if (keywords.some(keyword => text.includes(keyword))) {
        topics.push(topic);
      }
    }
    
    return topics.length > 0 ? topics : ['general'];
  }

  /**
   * 提取关键词
   */
  private extractKeywords(text: string): string[] {
    // 简化的关键词提取：寻找重要词汇
    const keywords: string[] = [];
    const importantWords = ['学习', '游戏', '朋友', '帮助', '问题', '开心', '难过', '工作', '创作'];
    
    for (const word of importantWords) {
      if (text.includes(word)) {
        keywords.push(word);
      }
    }
    
    return keywords;
  }

  /**
   * 辅助方法：检查是否包含关键词
   */
  private containsKeywords(text: string, keywords: string[]): boolean {
    return keywords.some(keyword => text.includes(keyword));
  }

  /**
   * 辅助方法：检查是否包含情感词汇
   */
  private containsEmotionalWords(text: string): boolean {
    const emotionalWords = ['开心', '难过', '愤怒', '兴奋', '失望', '满意', '焦虑', '平静'];
    return this.containsKeywords(text, emotionalWords);
  }

  /**
   * 辅助方法：检查上下文相关性
   */
  private isContextuallyRelevantText(text: string, context: Message[]): boolean {
    if (context.length === 0) return true;
    
    const lastMessage = context[context.length - 1];
    const commonWords = this.findCommonWords(text, lastMessage.text);
    
    return commonWords.length > 0;
  }

  /**
   * 辅助方法：寻找共同词汇
   */
  private findCommonWords(text1: string, text2: string): string[] {
    const words1 = text1.split(/\s+/);
    const words2 = text2.split(/\s+/);
    
    return words1.filter(word => word.length > 1 && words2.includes(word));
  }

  /**
   * 辅助方法：检查轮流发言模式
   */
  private isAlternatingPattern(speakers: string[]): boolean {
    if (speakers.length < 4) return false;
    
    const recent = speakers.slice(-6);
    let alternations = 0;
    
    for (let i = 1; i < recent.length; i++) {
      if (recent[i] !== recent[i - 1]) {
        alternations++;
      }
    }
    
    return alternations >= recent.length * 0.7;
  }

  /**
   * 辅助方法：检查主导-服从模式
   */
  private isDominantSubmissivePattern(speakers: string[], messages: Message[]): boolean {
    const speakerCounts = new Map<string, number>();
    
    for (const speaker of speakers) {
      speakerCounts.set(speaker, (speakerCounts.get(speaker) || 0) + 1);
    }
    
    const counts = Array.from(speakerCounts.values()).sort((a, b) => b - a);
    
    // 如果最多发言者的发言数量是第二多的2倍以上
    return counts.length >= 2 && counts[0] >= counts[1] * 2;
  }

  /**
   * 辅助方法：检查协作模式
   */
  private isCollaborativePattern(text: string, context: Message[]): boolean {
    return this.containsKeywords(text, ['一起', '合作', '我们', '共同', '帮助']);
  }

  /**
   * 辅助方法：检查竞争模式
   */
  private isCompetitivePattern(text: string, context: Message[]): boolean {
    return this.containsKeywords(text, ['比赛', '竞争', '胜利', '输赢', '挑战']);
  }

  /**
   * 辅助方法：检查支持模式
   */
  private isSupportivePattern(text: string, context: Message[]): boolean {
    return this.containsKeywords(text, ['支持', '鼓励', '理解', '没关系', '加油']);
  }

  /**
   * 辅助方法：检查探索模式
   */
  private isExploratoryPattern(text: string, context: Message[]): boolean {
    return this.containsKeywords(text, ['探索', '发现', '试试', '看看', '研究', '了解']);
  }

  /**
   * 辅助方法：检查重叠消息
   */
  private hasOverlappingMessages(messages: Message[]): boolean {
    // 简化实现：检查消息时间戳是否过于接近
    for (let i = 1; i < messages.length; i++) {
      const timeDiff = messages[i].timestamp.getTime() - messages[i - 1].timestamp.getTime();
      if (timeDiff < 2000) { // 2秒内
        return true;
      }
    }
    return false;
  }

  // ... 其他辅助方法和实现将在下一部分继续 ...

  /**
   * 初始化角色交互历史
   */
  private initializeCharacterHistories(characters: AICharacter[]): void {
    for (const character of characters) {
      if (!this.histories.has(character.id)) {
        const history: InteractionHistory = {
          characterId: character.id,
          totalInteractions: 0,
          totalSessions: 0,
          totalDuration: 0,
          averageSessionDuration: 0,
          
          interactionTypeDistribution: {} as Record<InteractionType, number>,
          qualityDistribution: {} as Record<InteractionQuality, number>,
          averageQuality: 0,
          averageSatisfaction: 0,
          
          preferredPatterns: [],
          commonPartners: [],
          
          behaviorProfile: {
            dominanceLevel: 0.5,
            cooperativeness: 0.5,
            responsiveness: 0.5,
            initiationRate: 0.5,
            adaptability: 0.5
          },
          
          timePatterns: {
            peakHours: [],
            seasonality: {},
            weekdayPatterns: new Array(7).fill(0)
          },
          
          learningProgress: {
            skillImprovements: {},
            knowledgeGains: [],
            socialSkillsDevelopment: 0.5
          },
          
          recentTrends: {
            qualityTrend: 0,
            engagementTrend: 0,
            diversityTrend: 0
          },
          
          sessions: [],
          patterns: [],
          
          createdAt: new Date(),
          lastUpdated: new Date()
        };
        
        this.histories.set(character.id, history);
      }
    }
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
   * 获取角色交互历史
   */
  public getCharacterHistory(characterId: string): InteractionHistory | undefined {
    return this.histories.get(characterId);
  }

  /**
   * 获取管理器状态
   */
  public getState(): InteractionMemoryManagerState {
    return { ...this.state };
  }

  /**
   * 清理缓存
   */
  public clearCache(): void {
    this.analysisCache.clear();
    console.log('🧹 交互分析缓存已清理');
  }

  // 这里将继续实现其他方法...
} 