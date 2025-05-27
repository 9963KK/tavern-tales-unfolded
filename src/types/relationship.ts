/**
 * 关系记忆系统核心类型定义
 * 基于图数据结构的AI角色关系建模
 */

/**
 * 关系类型枚举
 * 定义角色间可能的各种关系类型
 */
export enum RelationType {
  // 正面关系
  FRIENDSHIP = 'friendship',          // 友谊
  ROMANTIC = 'romantic',             // 爱情/浪漫关系
  MENTOR_STUDENT = 'mentor_student', // 师生关系
  ALLIANCE = 'alliance',             // 联盟/合作关系
  FAMILY = 'family',                 // 家人关系
  RESPECT = 'respect',               // 尊敬关系
  
  // 负面关系
  RIVALRY = 'rivalry',               // 竞争/敌对
  HATRED = 'hatred',                 // 仇恨
  SUSPICION = 'suspicion',          // 怀疑/不信任
  CONTEMPT = 'contempt',            // 蔑视
  FEAR = 'fear',                    // 恐惧
  
  // 中性关系
  NEUTRAL = 'neutral',               // 中性/陌生人
  ACQUAINTANCE = 'acquaintance',    // 熟人
  PROFESSIONAL = 'professional',     // 职业关系
  CUSTOMER = 'customer',             // 客户关系
  
  // 特殊关系
  COMPLEX = 'complex'                // 复杂关系（多种类型混合）
}

/**
 * 关系强度等级
 */
export enum RelationshipStrength {
  MINIMAL = 0.1,      // 极弱
  WEAK = 0.3,         // 弱
  MODERATE = 0.5,     // 中等
  STRONG = 0.7,       // 强
  INTENSE = 0.9       // 极强
}

/**
 * 关系状态枚举
 */
export enum RelationshipStatus {
  DEVELOPING = 'developing',    // 发展中
  STABLE = 'stable',           // 稳定
  DECLINING = 'declining',     // 衰退中
  VOLATILE = 'volatile',       // 不稳定/波动
  DORMANT = 'dormant',         // 休眠状态
  ENDED = 'ended'              // 已结束
}

/**
 * 关系变化触发因素
 */
export enum RelationshipTrigger {
  // 直接互动
  POSITIVE_INTERACTION = 'positive_interaction',   // 积极互动
  NEGATIVE_INTERACTION = 'negative_interaction',   // 消极互动
  SHARED_EXPERIENCE = 'shared_experience',         // 共同经历
  CONFLICT = 'conflict',                          // 冲突事件
  COOPERATION = 'cooperation',                    // 合作事件
  
  // 间接影响
  THIRD_PARTY_INFLUENCE = 'third_party_influence', // 第三方影响
  REPUTATION_CHANGE = 'reputation_change',         // 声誉变化
  COMMON_INTEREST = 'common_interest',             // 共同兴趣
  VALUE_ALIGNMENT = 'value_alignment',             // 价值观契合
  
  // 时间因素
  TIME_PASSAGE = 'time_passage',                   // 时间流逝
  ABSENCE = 'absence',                            // 长期不联系
  REUNION = 'reunion',                            // 重逢
  
  // 其他
  CIRCUMSTANCE = 'circumstance',                   // 环境变化
  PERSONALITY_CLASH = 'personality_clash',         // 性格冲突
  MISUNDERSTANDING = 'misunderstanding',           // 误解
  UNKNOWN = 'unknown'                             // 未知因素
}

/**
 * 关系维度
 * 多维度描述关系的复杂性
 */
export interface RelationshipDimensions {
  trust: number;           // 信任度 [0, 1]
  intimacy: number;        // 亲密度 [0, 1]
  respect: number;         // 尊重度 [0, 1]
  attraction: number;      // 吸引力 [-1, 1] (负值表示排斥)
  compatibility: number;   // 兼容性 [-1, 1]
  influence: number;       // 影响力 [-1, 1] (A对B的影响程度)
  dependence: number;      // 依赖度 [0, 1]
  stability: number;       // 稳定性 [0, 1]
}

/**
 * 关系核心接口
 * 描述两个角色间的关系状态
 */
export interface Relationship {
  id: string;                              // 关系唯一ID
  fromCharacterId: string;                 // 关系发起方
  toCharacterId: string;                   // 关系接收方
  type: RelationType;                      // 关系类型
  
  // 关系强度和方向性
  strength: number;                        // 关系强度 [0, 1]
  isDirectional: boolean;                  // 是否有方向性（单向/双向）
  isMutual: boolean;                       // 是否互相认知
  
  // 多维度描述
  dimensions: RelationshipDimensions;      // 关系各维度值
  
  // 元数据
  status: RelationshipStatus;              // 关系状态
  confidence: number;                      // 关系判定置信度 [0, 1]
  lastInteraction: Date;                   // 最后互动时间
  
  // 历史追踪
  establishedAt: Date;                     // 关系建立时间
  lastUpdated: Date;                       // 最后更新时间
  
  // 上下文信息
  tags: string[];                          // 关系标签
  notes?: string;                          // 关系备注
}

/**
 * 关系变化事件
 * 记录关系演变的具体事件
 */
export interface RelationshipEvent {
  id: string;
  relationshipId: string;                  // 关联的关系ID
  
  // 变化详情
  trigger: RelationshipTrigger;            // 触发因素
  description: string;                     // 事件描述
  context: string;                         // 事件上下文
  
  // 变化前后状态
  beforeState: Partial<Relationship>;      // 变化前状态
  afterState: Partial<Relationship>;       // 变化后状态
  
  // 变化量化
  impactScore: number;                     // 影响程度 [0, 1]
  changeVector: Partial<RelationshipDimensions>; // 各维度变化量
  
  // 元数据
  timestamp: Date;
  relatedMessageId?: string;               // 相关消息ID
  participantIds: string[];                // 参与者ID列表
  witnessIds?: string[];                   // 见证者ID列表
}

/**
 * 关系模式识别结果
 */
export interface RelationshipPattern {
  id: string;
  patternType: 'cyclical' | 'progressive' | 'stable' | 'volatile' | 'decay';
  description: string;
  
  // 模式特征
  involvedRelationships: string[];         // 涉及的关系ID
  commonTriggers: RelationshipTrigger[];   // 常见触发因素
  typicalChanges: Partial<RelationshipDimensions>[]; // 典型变化模式
  
  // 统计信息
  frequency: number;                       // 出现频率
  confidence: number;                      // 模式置信度
  predictability: number;                  // 可预测性
  
  // 时间信息
  detectedAt: Date;
  lastObserved: Date;
}

/**
 * 关系网络节点
 * 表示关系网络中的角色节点
 */
export interface RelationshipNode {
  characterId: string;
  
  // 网络属性
  centrality: number;                      // 中心性 [0, 1]
  influence: number;                       // 影响力 [0, 1]
  popularity: number;                      // 受欢迎程度 [-1, 1]
  
  // 关系统计
  totalRelationships: number;              // 总关系数
  positiveRelationships: number;           // 正面关系数
  negativeRelationships: number;           // 负面关系数
  
  // 角色在网络中的角色
  networkRole: 'leader' | 'connector' | 'isolate' | 'follower' | 'mediator';
  
  // 更新时间
  lastUpdated: Date;
}

/**
 * 关系网络图
 * 完整的角色关系网络表示
 */
export interface RelationshipNetwork {
  id: string;
  name: string;                            // 网络名称（如"酒馆关系网"）
  
  // 网络节点和边
  nodes: Map<string, RelationshipNode>;    // 角色节点
  relationships: Map<string, Relationship>; // 关系边
  
  // 网络统计
  density: number;                         // 网络密度 [0, 1]
  clustering: number;                      // 聚类系数 [0, 1]
  avgPathLength: number;                   // 平均路径长度
  
  // 子网络识别
  communities: string[][];                 // 社群划分
  cliques: string[][];                     // 完全子图
  
  // 元数据
  createdAt: Date;
  lastAnalyzed: Date;
}

/**
 * 关系记忆存储
 * 单个角色的关系记忆数据
 */
export interface RelationshipMemory {
  characterId: string;
  
  // 关系数据
  relationships: Map<string, Relationship>; // 该角色的所有关系
  relationshipHistory: RelationshipEvent[]; // 关系变化历史
  
  // 模式与分析
  patterns: RelationshipPattern[];          // 识别出的关系模式
  socialPreferences: {                     // 社交偏好
    preferredRelationTypes: RelationType[];
    avoidedRelationTypes: RelationType[];
    socialComfortZone: RelationshipDimensions;
  };
  
  // 网络位置
  networkPosition: RelationshipNode;       // 在网络中的位置
  
  // 关系策略
  relationshipStrategy: {
    approachStyle: 'proactive' | 'reactive' | 'selective' | 'avoidant';
    conflictResolution: 'confrontational' | 'diplomatic' | 'avoidant' | 'mediating';
    loyaltyLevel: number;                  // 忠诚度 [0, 1]
    trustThreshold: number;                // 信任阈值 [0, 1]
  };
  
  // 统计信息
  statistics: {
    totalInteractions: number;             // 总互动次数
    successfulRelationships: number;      // 成功关系数
    failedRelationships: number;          // 失败关系数
    averageRelationshipDuration: number;  // 平均关系持续时间(天)
    socialSatisfaction: number;           // 社交满意度 [0, 1]
  };
  
  // 元数据
  createdAt: Date;
  lastUpdated: Date;
}

/**
 * 关系推理结果
 * 基于现有关系推断可能的新关系或变化
 */
export interface RelationshipInference {
  type: 'new_relationship' | 'relationship_change' | 'indirect_influence';
  
  // 推理目标
  subjectId: string;                       // 推理主体
  targetId: string;                        // 推理目标
  
  // 推理内容
  predictedRelationship?: Partial<Relationship>; // 预测的关系
  predictedChange?: Partial<RelationshipDimensions>; // 预测的变化
  
  // 推理依据
  reasoning: string;                       // 推理说明
  evidenceRelationships: string[];         // 证据关系ID
  analogyRelationships: string[];          // 类比关系ID
  
  // 可信度
  confidence: number;                      // 推理置信度 [0, 1]
  riskAssessment: 'low' | 'medium' | 'high'; // 风险评估
  
  // 元数据
  inferredAt: Date;
  expiresAt: Date;                        // 推理有效期
}

/**
 * 关系影响评估
 * 评估关系对角色行为和决策的影响
 */
export interface RelationshipInfluence {
  characterId: string;
  influencingRelationshipId: string;
  
  // 影响类型
  influenceType: 'behavioral' | 'emotional' | 'decisional' | 'social';
  
  // 影响程度
  intensity: number;                       // 影响强度 [0, 1]
  direction: 'positive' | 'negative' | 'mixed'; // 影响方向
  
  // 具体影响内容
  affectedAspects: string[];              // 受影响的方面
  behavioralChanges: string[];            // 行为变化
  emotionalImpact: string;                // 情感影响描述
  
  // 时间因素
  duration: 'temporary' | 'short_term' | 'long_term' | 'permanent';
  decayRate: number;                      // 影响衰减率
  
  // 元数据
  assessedAt: Date;
  validUntil: Date;
}

/**
 * 关系分析配置
 */
export interface RelationshipAnalysisConfig {
  // 分析参数
  analysisDepth: 'shallow' | 'moderate' | 'deep';
  updateFrequency: number;                 // 更新频率(秒)
  
  // 阈值设置
  relationshipThresholds: {
    minimumStrength: number;               // 最小关系强度
    significantChange: number;             // 显著变化阈值
    patternDetectionMinEvents: number;     // 模式检测最小事件数
  };
  
  // 网络分析
  networkAnalysis: {
    enabled: boolean;
    communityDetection: boolean;           // 社群检测
    influenceCalculation: boolean;         // 影响力计算
    pathAnalysis: boolean;                 // 路径分析
  };
  
  // 推理设置
  inference: {
    enabled: boolean;
    maxInferenceDepth: number;             // 最大推理深度
    confidenceThreshold: number;          // 推理置信度阈值
    analogyWeight: number;                 // 类比权重
  };
  
  // 性能设置
  performance: {
    maxRelationships: number;              // 最大关系数
    historyRetention: number;              // 历史保留天数
    cacheSize: number;                     // 缓存大小
  };
}

/**
 * 关系管理器状态
 */
export interface RelationshipManagerState {
  isActive: boolean;
  
  // 统计信息
  totalRelationships: number;
  totalEvents: number;
  totalPatterns: number;
  
  // 性能指标
  performance: {
    analysisCount: number;
    averageAnalysisTime: number;
    cacheHitRate: number;
    memoryUsage: number;
  };
  
  // 网络状态
  networkHealth: {
    density: number;
    stability: number;
    activityLevel: number;
  };
  
  // 配置状态
  currentConfig: RelationshipAnalysisConfig;
  lastConfigUpdate: Date;
  
  // 更新时间
  lastUpdate: Date;
} 