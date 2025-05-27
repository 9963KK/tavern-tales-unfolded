/**
 * 上下文记忆系统类型定义
 * 记录和管理AI角色的环境、场景、时间等上下文信息
 */

/**
 * 上下文类型枚举
 */
export enum ContextType {
  TEMPORAL = 'temporal',               // 时间上下文
  SPATIAL = 'spatial',                 // 空间上下文
  SOCIAL = 'social',                   // 社交上下文
  TOPICAL = 'topical',                 // 话题上下文
  ENVIRONMENTAL = 'environmental',     // 环境上下文
  ACTIVITY = 'activity',               // 活动上下文
  EMOTIONAL = 'emotional',             // 情感上下文
  CULTURAL = 'cultural'                // 文化上下文
}

/**
 * 上下文重要性等级
 */
export enum ContextImportance {
  CRITICAL = 'critical',               // 关键
  HIGH = 'high',                       // 重要
  MEDIUM = 'medium',                   // 一般
  LOW = 'low',                         // 较低
  MINIMAL = 'minimal'                  // 最低
}

/**
 * 上下文稳定性
 */
export enum ContextStability {
  PERMANENT = 'permanent',             // 永久性（地理位置）
  LONG_TERM = 'long_term',            // 长期（季节、关系）
  MEDIUM_TERM = 'medium_term',        // 中期（活动、项目）
  SHORT_TERM = 'short_term',          // 短期（对话、情绪）
  TRANSIENT = 'transient'             // 瞬时（动作、表情）
}

/**
 * 基础上下文元素
 */
export interface ContextElement {
  id: string;
  type: ContextType;
  name: string;
  description: string;
  
  // 时间信息
  startTime: Date;
  endTime?: Date;
  duration?: number;                   // 持续时间（毫秒）
  
  // 属性
  importance: ContextImportance;
  stability: ContextStability;
  confidence: number;                  // 确信度 [0, 1]
  
  // 关联信息
  relatedCharacters: string[];         // 相关角色
  relatedEvents: string[];             // 相关事件
  relatedTopics: string[];             // 相关话题
  
  // 元数据
  tags: string[];
  notes?: string;
  createdAt: Date;
  lastUpdated: Date;
}

/**
 * 时间上下文
 */
export interface TemporalContext extends ContextElement {
  type: ContextType.TEMPORAL;
  
  // 时间特征
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  dayOfWeek: number;                   // 0-6, 周日为0
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  isWeekend: boolean;
  isHoliday: boolean;
  
  // 时间模式
  isRecurring: boolean;                // 是否周期性
  frequency?: string;                  // 频率（如daily, weekly）
  
  // 时区信息
  timezone: string;
  utcOffset: number;
}

/**
 * 空间上下文
 */
export interface SpatialContext extends ContextElement {
  type: ContextType.SPATIAL;
  
  // 位置信息
  location: {
    name: string;
    type: 'indoor' | 'outdoor' | 'virtual';
    category: string;                  // 如：酒馆、森林、市场
    description: string;
  };
  
  // 环境特征
  atmosphere: {
    lighting: 'bright' | 'dim' | 'dark' | 'natural';
    noise: 'quiet' | 'normal' | 'noisy' | 'loud';
    temperature: 'cold' | 'cool' | 'warm' | 'hot';
    crowding: 'empty' | 'sparse' | 'moderate' | 'crowded';
  };
  
  // 空间关系
  adjacentLocations: string[];         // 邻近位置
  parentLocation?: string;             // 上级位置
  landmarks: string[];                 // 地标
}

/**
 * 社交上下文
 */
export interface SocialContext extends ContextElement {
  type: ContextType.SOCIAL;
  
  // 社交场景
  scenario: {
    type: 'private' | 'public' | 'group' | 'formal' | 'casual';
    size: number;                      // 参与人数
    formality: 'very_formal' | 'formal' | 'casual' | 'informal' | 'intimate';
  };
  
  // 角色关系
  relationships: {
    characterId: string;
    role: string;                      // 在该上下文中的角色
    influence: number;                 // 影响力 [0, 1]
  }[];
  
  // 社交规范
  norms: string[];                     // 社交规范
  taboos: string[];                    // 禁忌话题
  expectations: string[];              // 期望行为
}

/**
 * 话题上下文
 */
export interface TopicalContext extends ContextElement {
  type: ContextType.TOPICAL;
  
  // 话题信息
  mainTopic: string;
  subTopics: string[];
  keywords: string[];
  
  // 话题特征
  complexity: 'simple' | 'moderate' | 'complex' | 'expert';
  sensitivity: 'public' | 'private' | 'sensitive' | 'confidential';
  urgency: 'low' | 'normal' | 'high' | 'urgent';
  
  // 话题历史
  previousDiscussions: {
    timestamp: Date;
    participants: string[];
    outcome: string;
    sentiment: 'positive' | 'negative' | 'neutral';
  }[];
  
  // 相关知识
  requiredKnowledge: string[];
  prerequisites: string[];
}

/**
 * 环境上下文
 */
export interface EnvironmentalContext extends ContextElement {
  type: ContextType.ENVIRONMENTAL;
  
  // 物理环境
  weather?: {
    condition: 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'snowy';
    temperature: number;
    humidity: number;
    windSpeed: number;
  };
  
  // 事件环境
  events: {
    type: 'celebration' | 'conflict' | 'emergency' | 'routine' | 'special';
    status: 'upcoming' | 'ongoing' | 'completed';
    impact: 'none' | 'low' | 'medium' | 'high' | 'extreme';
  }[];
  
  // 资源状况
  resources: {
    availability: 'abundant' | 'adequate' | 'limited' | 'scarce';
    type: string;
    impact: number;                    // 对交互的影响 [-1, 1]
  }[];
}

/**
 * 活动上下文
 */
export interface ActivityContext extends ContextElement {
  type: ContextType.ACTIVITY;
  
  // 活动信息
  activity: {
    name: string;
    category: 'work' | 'leisure' | 'social' | 'learning' | 'survival' | 'combat';
    status: 'planned' | 'preparing' | 'active' | 'paused' | 'completed' | 'cancelled';
    priority: 'low' | 'normal' | 'high' | 'urgent';
  };
  
  // 参与信息
  participants: {
    characterId: string;
    role: 'leader' | 'participant' | 'observer' | 'supporter';
    involvement: number;               // 参与度 [0, 1]
  }[];
  
  // 活动目标
  objectives: string[];
  progress: number;                    // 进度 [0, 1]
  challenges: string[];               // 遇到的挑战
  achievements: string[];             // 已取得的成果
}

/**
 * 上下文变化事件
 */
export interface ContextChangeEvent {
  id: string;
  timestamp: Date;
  contextId: string;
  changeType: 'created' | 'updated' | 'deleted' | 'activated' | 'deactivated';
  
  // 变化详情
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
    reason: string;
  }[];
  
  // 影响分析
  impact: {
    affectedCharacters: string[];
    impactLevel: 'none' | 'minimal' | 'moderate' | 'significant' | 'major';
    adaptationRequired: boolean;
  };
  
  triggeredBy: {
    type: 'message' | 'event' | 'timer' | 'system' | 'user';
    source: string;
  };
}

/**
 * 上下文层次结构
 */
export interface ContextHierarchy {
  id: string;
  name: string;
  
  // 层次结构
  parentId?: string;
  children: string[];                  // 子上下文ID
  level: number;                       // 层级深度
  
  // 范围
  scope: 'global' | 'regional' | 'local' | 'personal';
  coverage: {
    spatial: number;                   // 空间覆盖范围
    temporal: number;                  // 时间覆盖范围
    social: number;                    // 社交覆盖范围
  };
  
  // 继承规则
  inheritance: {
    inheritsFrom: string[];            // 继承来源
    overrides: string[];               // 覆盖的属性
    priority: number;                  // 优先级
  };
}

/**
 * 上下文记忆
 */
export interface ContextMemory {
  characterId: string;
  
  // 活跃上下文
  activeContexts: Map<string, ContextElement>;
  
  // 上下文历史
  contextHistory: {
    temporal: TemporalContext[];
    spatial: SpatialContext[];
    social: SocialContext[];
    topical: TopicalContext[];
    environmental: EnvironmentalContext[];
    activity: ActivityContext[];
  };
  
  // 上下文关联
  associations: {
    contextId: string;
    relatedContexts: string[];
    strength: number;                  // 关联强度 [0, 1]
    type: 'causal' | 'temporal' | 'spatial' | 'thematic' | 'coincidental';
  }[];
  
  // 上下文模式
  patterns: {
    id: string;
    name: string;
    contexts: string[];                // 涉及的上下文
    frequency: number;                 // 出现频率
    triggers: string[];                // 触发条件
    outcomes: string[];                // 常见结果
    confidence: number;                // 模式可信度
  }[];
  
  // 适应性学习
  adaptations: {
    contextId: string;
    adaptationType: 'behavioral' | 'communicative' | 'emotional' | 'strategic';
    adaptation: string;
    effectiveness: number;             // 适应效果 [0, 1]
    learnedAt: Date;
  }[];
  
  // 统计信息
  statistics: {
    totalContexts: number;
    activeContextsCount: number;
    contextChangeFrequency: number;    // 上下文变化频率
    adaptationSuccessRate: number;     // 适应成功率
  };
  
  createdAt: Date;
  lastUpdated: Date;
}

/**
 * 上下文推理结果
 */
export interface ContextInference {
  id: string;
  contextId: string;
  
  // 推理类型
  inferenceType: 'prediction' | 'explanation' | 'recommendation' | 'alert';
  
  // 推理内容
  inference: {
    description: string;
    implications: string[];
    recommendations: string[];
    confidence: number;
    timeframe: string;                 // 时间范围
  };
  
  // 证据支持
  evidence: {
    contextElements: string[];
    patterns: string[];
    historicalData: string[];
    confidence: number;
  };
  
  // 验证信息
  validation: {
    status: 'pending' | 'confirmed' | 'refuted' | 'partial';
    accuracy: number;                  // 准确度 [0, 1]
    feedback: string[];
  };
  
  createdAt: Date;
  validUntil: Date;
}

/**
 * 上下文适应策略
 */
export interface ContextAdaptationStrategy {
  id: string;
  name: string;
  description: string;
  
  // 适用条件
  applicableContexts: ContextType[];
  triggers: {
    conditions: string[];
    thresholds: Record<string, number>;
  };
  
  // 适应动作
  adaptations: {
    type: 'communication' | 'behavior' | 'goal' | 'strategy';
    action: string;
    parameters: Record<string, any>;
    priority: number;
  }[];
  
  // 效果评估
  effectiveness: {
    successRate: number;
    averageImprovement: number;
    sideEffects: string[];
    cost: number;                      // 适应成本
  };
  
  // 学习记录
  usage: {
    totalApplications: number;
    successfulApplications: number;
    lastUsed: Date;
    improvements: string[];
  };
}

/**
 * 上下文分析配置
 */
export interface ContextAnalysisConfig {
  // 检测参数
  detection: {
    sensitivityLevel: 'low' | 'medium' | 'high';
    updateFrequency: number;           // 更新频率（毫秒）
    minConfidence: number;             // 最小置信度
    contextWindow: number;             // 上下文窗口大小
  };
  
  // 记忆管理
  memory: {
    maxActiveContexts: number;         // 最大活跃上下文数
    retentionPeriod: number;           // 记忆保留时间（毫秒）
    compressionThreshold: number;      // 压缩阈值
    priorityWeights: Record<ContextType, number>;
  };
  
  // 推理设置
  inference: {
    enabled: boolean;
    maxInferences: number;             // 最大推理数量
    confidenceThreshold: number;       // 推理置信度阈值
    timeHorizon: number;               // 预测时间范围
  };
  
  // 适应性学习
  adaptation: {
    enabled: boolean;
    learningRate: number;              // 学习率
    adaptationThreshold: number;       // 适应阈值
    maxStrategies: number;             // 最大策略数量
  };
}

/**
 * 上下文记忆管理器状态
 */
export interface ContextMemoryManagerState {
  isActive: boolean;
  totalContexts: number;
  activeContexts: number;
  contextChanges: number;
  
  // 性能指标
  performance: {
    detectionAccuracy: number;         // 检测准确率
    inferenceAccuracy: number;         // 推理准确率
    adaptationSuccessRate: number;     // 适应成功率
    averageResponseTime: number;       // 平均响应时间
  };
  
  // 系统健康
  systemHealth: {
    memoryUsage: number;               // 内存使用率
    processingLoad: number;            // 处理负载
    errorRate: number;                 // 错误率
    dataIntegrity: number;             // 数据完整性
  };
  
  currentConfig: ContextAnalysisConfig;
  lastConfigUpdate: Date;
  lastUpdate: Date;
} 