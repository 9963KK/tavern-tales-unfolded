/**
 * 交互记忆系统类型定义
 * 记录和分析AI角色之间的详细交互历史
 */

/**
 * 交互类型枚举
 */
export enum InteractionType {
  CONVERSATION = 'conversation',         // 对话交流
  COLLABORATION = 'collaboration',       // 协作互动
  CONFLICT = 'conflict',                 // 冲突争执
  GAME = 'game',                        // 游戏娱乐
  LEARNING = 'learning',                // 学习交流
  EMOTIONAL_SUPPORT = 'emotional_support', // 情感支持
  INFORMATION_EXCHANGE = 'information_exchange', // 信息交换
  SOCIAL_BONDING = 'social_bonding',     // 社交联结
  PROBLEM_SOLVING = 'problem_solving',   // 问题解决
  CASUAL_CHAT = 'casual_chat'           // 闲聊
}

/**
 * 交互模式枚举
 */
export enum InteractionPattern {
  TURN_TAKING = 'turn_taking',           // 轮流发言
  PARALLEL = 'parallel',                 // 平行交流
  DOMINANT_SUBMISSIVE = 'dominant_submissive', // 主导-服从
  COLLABORATIVE = 'collaborative',       // 协作式
  COMPETITIVE = 'competitive',          // 竞争式
  SUPPORTIVE = 'supportive',            // 支持式
  EXPLORATORY = 'exploratory',          // 探索式
  REACTIVE = 'reactive'                 // 反应式
}

/**
 * 交互质量枚举
 */
export enum InteractionQuality {
  EXCELLENT = 'excellent',             // 优秀
  GOOD = 'good',                       // 良好
  AVERAGE = 'average',                 // 一般
  POOR = 'poor',                       // 较差
  FAILED = 'failed'                    // 失败
}

/**
 * 交互状态枚举
 */
export enum InteractionStatus {
  ACTIVE = 'active',                   // 进行中
  PAUSED = 'paused',                   // 暂停
  COMPLETED = 'completed',             // 已完成
  INTERRUPTED = 'interrupted',         // 被中断
  FAILED = 'failed'                    // 失败
}

/**
 * 交互事件
 */
export interface InteractionEvent {
  id: string;
  sessionId: string;                   // 所属会话ID
  type: InteractionType;
  participantIds: string[];            // 参与者ID列表
  initiatorId: string;                 // 发起者ID
  timestamp: Date;
  duration: number;                    // 持续时间（毫秒）
  
  // 内容信息
  messageIds: string[];                // 相关消息ID
  topics: string[];                    // 交流主题
  keywords: string[];                  // 关键词
  
  // 分析结果
  quality: InteractionQuality;
  pattern: InteractionPattern;
  intensity: number;                   // 交互强度 [0, 1]
  engagement: number;                  // 参与度 [0, 1]
  satisfaction: number;                // 满意度 [0, 1]
  
  // 情感信息
  emotionalTone: string;               // 情感基调
  emotionalChange: {                   // 情感变化
    before: Record<string, number>;    // 交互前各角色情感状态
    after: Record<string, number>;     // 交互后各角色情感状态
  };
  
  // 行为分析
  behaviorAnalysis: {
    dominance: Record<string, number>; // 各角色主导性
    cooperation: number;               // 合作程度
    conflict: number;                  // 冲突程度
    creativity: number;                // 创造性
    logic: number;                     // 逻辑性
  };
  
  // 结果影响
  outcomes: InteractionOutcome[];
  relationshipImpact: Record<string, number>; // 对关系的影响
  
  status: InteractionStatus;
  confidence: number;                  // 分析置信度
  tags: string[];
  notes?: string;
}

/**
 * 交互结果
 */
export interface InteractionOutcome {
  id: string;
  type: 'decision' | 'agreement' | 'conflict' | 'learning' | 'emotional' | 'creative';
  description: string;
  participantIds: string[];
  impact: number;                      // 影响程度 [0, 1]
  success: boolean;
  consequences: string[];              // 后续影响
  timestamp: Date;
}

/**
 * 交互会话
 */
export interface InteractionSession {
  id: string;
  title: string;
  participantIds: string[];
  startTime: Date;
  endTime?: Date;
  duration: number;
  
  // 会话统计
  totalEvents: number;
  messageCount: number;
  averageResponseTime: number;
  
  // 会话特征
  mainTopics: string[];
  dominantPattern: InteractionPattern;
  overallQuality: InteractionQuality;
  
  // 参与度分析
  participantEngagement: Record<string, {
    messageCount: number;
    wordCount: number;
    responseTime: number;
    initiationCount: number;
    engagement: number;
  }>;
  
  // 情感轨迹
  emotionalArc: {
    timestamp: Date;
    emotions: Record<string, number>;   // 各角色情感状态
  }[];
  
  status: InteractionStatus;
  events: InteractionEvent[];
  outcomes: InteractionOutcome[];
  tags: string[];
  summary?: string;
}

/**
 * 交互模式识别
 */
export interface InteractionPatternRecognition {
  patternId: string;
  pattern: InteractionPattern;
  frequency: number;                   // 出现频率
  contexts: string[];                  // 出现上下文
  participants: string[];              // 常见参与者
  
  // 模式特征
  characteristics: {
    averageDuration: number;
    averageParticipants: number;
    commonTopics: string[];
    successRate: number;
    satisfactionLevel: number;
  };
  
  // 触发条件
  triggers: {
    topics: string[];
    emotions: string[];
    relationships: string[];
    timeOfDay: number[];               // 时间段
    participantCombinations: string[][];
  };
  
  // 预测信息
  predictability: number;              // 可预测性 [0, 1]
  stability: number;                   // 稳定性 [0, 1]
  
  confidence: number;
  lastDetected: Date;
  createdAt: Date;
}

/**
 * 交互历史记录
 */
export interface InteractionHistory {
  characterId: string;
  
  // 基础统计
  totalInteractions: number;
  totalSessions: number;
  totalDuration: number;               // 总交互时间（毫秒）
  averageSessionDuration: number;
  
  // 交互类型分布
  interactionTypeDistribution: Record<InteractionType, number>;
  
  // 质量统计
  qualityDistribution: Record<InteractionQuality, number>;
  averageQuality: number;
  averageSatisfaction: number;
  
  // 模式分析
  preferredPatterns: InteractionPattern[];
  commonPartners: string[];            // 常见交互伙伴
  
  // 行为特征
  behaviorProfile: {
    dominanceLevel: number;            // 平均主导性
    cooperativeness: number;           // 合作性
    responsiveness: number;            // 响应性
    initiationRate: number;            // 主动性
    adaptability: number;              // 适应性
  };
  
  // 时间模式
  timePatterns: {
    peakHours: number[];               // 活跃时段
    seasonality: Record<string, number>; // 季节性模式
    weekdayPatterns: number[];         // 工作日模式
  };
  
  // 学习轨迹
  learningProgress: {
    skillImprovements: Record<string, number>;
    knowledgeGains: string[];
    socialSkillsDevelopment: number;
  };
  
  // 最近趋势
  recentTrends: {
    qualityTrend: number;              // 质量趋势 [-1, 1]
    engagementTrend: number;           // 参与度趋势
    diversityTrend: number;            // 多样性趋势
  };
  
  sessions: InteractionSession[];
  patterns: InteractionPatternRecognition[];
  
  createdAt: Date;
  lastUpdated: Date;
}

/**
 * 交互分析配置
 */
export interface InteractionAnalysisConfig {
  // 检测参数
  detection: {
    minSessionDuration: number;        // 最小会话时长（毫秒）
    maxSessionGap: number;             // 最大会话间隔（毫秒）
    minEventDuration: number;          // 最小事件时长
    patternDetectionWindow: number;    // 模式检测窗口（事件数）
  };
  
  // 分析深度
  analysisDepth: 'basic' | 'moderate' | 'deep';
  
  // 质量评估
  qualityAssessment: {
    responseTimeWeight: number;        // 响应时间权重
    contentQualityWeight: number;      // 内容质量权重
    engagementWeight: number;          // 参与度权重
    outcomeWeight: number;             // 结果权重
  };
  
  // 模式识别
  patternRecognition: {
    enabled: boolean;
    minOccurrences: number;            // 最小出现次数
    confidenceThreshold: number;       // 置信度阈值
    temporalSensitivity: number;       // 时间敏感性
  };
  
  // 性能配置
  performance: {
    maxHistorySize: number;            // 最大历史记录数
    cacheSize: number;                 // 缓存大小
    batchSize: number;                 // 批处理大小
    updateFrequency: number;           // 更新频率（秒）
  };
}

/**
 * 交互记忆管理器状态
 */
export interface InteractionMemoryManagerState {
  isActive: boolean;
  totalSessions: number;
  totalEvents: number;
  totalPatterns: number;
  
  // 性能指标
  performance: {
    analysisCount: number;
    averageAnalysisTime: number;
    cacheHitRate: number;
    memoryUsage: number;
  };
  
  // 系统健康
  systemHealth: {
    dataIntegrity: number;             // 数据完整性
    analysisAccuracy: number;          // 分析准确性
    responseTime: number;              // 响应时间
  };
  
  currentConfig: InteractionAnalysisConfig;
  lastConfigUpdate: Date;
  lastUpdate: Date;
}

/**
 * 交互洞察
 */
export interface InteractionInsight {
  id: string;
  type: 'pattern' | 'trend' | 'anomaly' | 'opportunity' | 'risk';
  title: string;
  description: string;
  
  // 关联信息
  relatedCharacters: string[];
  relatedSessions: string[];
  relatedPatterns: string[];
  
  // 数据支撑
  evidence: {
    dataPoints: number;
    confidence: number;
    significance: number;
  };
  
  // 预测和建议
  predictions: {
    likelihood: number;
    timeframe: string;
    impact: number;
  };
  
  recommendations: {
    priority: 'high' | 'medium' | 'low';
    actions: string[];
    expectedOutcome: string;
  };
  
  discoveredAt: Date;
  relevanceScore: number;
  tags: string[];
}

/**
 * 交互智能分析结果
 */
export interface InteractionIntelligence {
  characterId: string;
  
  // 个人特征
  personalityInsights: {
    communicationStyle: string;
    preferredTopics: string[];
    socialRole: string;
    adaptabilityScore: number;
  };
  
  // 关系洞察
  relationshipInsights: {
    strongestPartners: string[];
    growingRelationships: string[];
    challengingRelationships: string[];
    networkPosition: string;
  };
  
  // 行为模式
  behaviorPatterns: {
    consistentBehaviors: string[];
    changingPatterns: string[];
    seasonalVariations: string[];
    contextualAdaptations: string[];
  };
  
  // 发展轨迹
  developmentTrajectory: {
    skillGrowthAreas: string[];
    learningStyle: string;
    socialProgress: number;
    communicationImprovement: number;
  };
  
  // 预测和建议
  predictions: {
    futureTrends: string[];
    potentialChallenges: string[];
    growthOpportunities: string[];
  };
  
  insights: InteractionInsight[];
  
  generatedAt: Date;
  validUntil: Date;
  confidence: number;
} 