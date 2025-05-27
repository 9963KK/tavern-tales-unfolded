/**
 * 综合记忆整合系统类型定义
 * 整合情感、关系、交互、上下文等所有记忆子系统
 */

import { EmotionalState, EmotionalMemory } from './emotion';
import { Relationship, RelationshipMemory } from './relationship';
import { InteractionHistory, InteractionSession, InteractionEvent } from './interaction';
import { ContextMemory, ContextElement, ContextInference } from './context';
import { AICharacter, Message } from './tavern';

/**
 * 记忆类型枚举
 */
export enum MemoryType {
  EMOTIONAL = 'emotional',           // 情感记忆
  RELATIONSHIP = 'relationship',     // 关系记忆
  INTERACTION = 'interaction',       // 交互记忆
  CONTEXT = 'context',              // 上下文记忆
  EPISODIC = 'episodic',            // 情节记忆
  SEMANTIC = 'semantic',            // 语义记忆
  PROCEDURAL = 'procedural',        // 程序记忆
  AUTOBIOGRAPHICAL = 'autobiographical' // 自传记忆
}

/**
 * 记忆重要性等级
 */
export enum MemoryImportance {
  CORE = 'core',                    // 核心记忆
  SIGNIFICANT = 'significant',      // 重要记忆
  NOTABLE = 'notable',              // 显著记忆
  ROUTINE = 'routine',              // 日常记忆
  TRIVIAL = 'trivial'              // 琐碎记忆
}

/**
 * 记忆层级枚举
 */
export enum MemoryLayer {
  IMMEDIATE = 'immediate',          // 即时记忆
  SHORT_TERM = 'short_term',       // 短期记忆
  LONG_TERM = 'long_term',         // 长期记忆
  PERMANENT = 'permanent'           // 永久记忆
}

/**
 * 记忆层配置
 */
export interface MemoryLayerConfig {
  name: MemoryLayer;
  maxCapacity: number;              // 最大容量
  retentionTime: number;            // 保持时间（毫秒）
  compressionThreshold: number;     // 压缩阈值
  minImportance: MessageImportance; // 最小重要性要求
}

/**
 * 消息重要性等级
 */
export enum MessageImportance {
  CRITICAL = 'critical',            // 关键消息
  HIGH = 'high',                   // 高重要性
  MEDIUM = 'medium',               // 中等重要性
  LOW = 'low',                     // 低重要性
  MINIMAL = 'minimal'              // 最低重要性
}

/**
 * 重要性评分结果
 */
export interface ImportanceScore {
  overall: number;                  // 总体评分 [0, 10]
  importance: MessageImportance;    // 重要性等级
  factors: {
    plot: number;                   // 情节因子
    character: number;              // 角色因子
    interaction: number;            // 交互因子
    continuity: number;             // 连贯性因子
    emotion: number;                // 情感因子
  };
  reasons: string[];                // 评分理由
  keywords: string[];               // 关键词
}

/**
 * 重要性评估配置
 */
export interface ImportanceConfig {
  weights: {
    plot: number;                   // 情节权重
    character: number;              // 角色权重
    interaction: number;            // 交互权重
    continuity: number;             // 连贯性权重
    emotion: number;                // 情感权重
  };
  playerMentionBonus: number;       // 玩家提及加成
  aiMentionBonus: number;           // AI提及加成
  emotionalKeywordsBonus: number;   // 情感关键词加成
  timeDecayFactor: number;          // 时间衰减因子
}

/**
 * 记忆巩固状态
 */
export enum ConsolidationStatus {
  FRESH = 'fresh',                  // 新鲜记忆
  CONSOLIDATING = 'consolidating',  // 巩固中
  CONSOLIDATED = 'consolidated',    // 已巩固
  INTEGRATED = 'integrated',        // 已整合
  ARCHIVED = 'archived'             // 已归档
}

/**
 * 基础记忆单元
 */
export interface MemoryUnit {
  id: string;
  type: MemoryType;
  characterId: string;
  
  // 内容信息
  title: string;
  description: string;
  content: any;                     // 具体记忆内容
  
  // 时间信息
  timestamp: Date;
  duration?: number;                // 持续时间（毫秒）
  
  // 重要性和强度
  importance: MemoryImportance;
  strength: number;                 // 记忆强度 [0, 1]
  vividness: number;                // 生动性 [0, 1]
  
  // 关联信息
  relatedMemories: string[];        // 相关记忆ID
  relatedCharacters: string[];      // 相关角色
  relatedEvents: string[];          // 相关事件
  tags: string[];
  
  // 记忆状态
  consolidationStatus: ConsolidationStatus;
  lastAccessed: Date;
  accessCount: number;
  
  // 元数据
  source: string;                   // 记忆来源
  confidence: number;               // 记忆可信度 [0, 1]
  createdAt: Date;
  lastUpdated: Date;
}

/**
 * 情节记忆（具体事件的记忆）
 */
export interface EpisodicMemory extends MemoryUnit {
  type: MemoryType.EPISODIC;
  content: {
    event: {
      type: string;
      description: string;
      participants: string[];
      location?: string;
      outcome?: string;
    };
    sensoryDetails: {
      visual?: string[];
      auditory?: string[];
      emotional?: string[];
    };
    contextualFactors: {
      timeOfDay?: string;
      weather?: string;
      mood?: string;
      activity?: string;
    };
  };
}

/**
 * 语义记忆（一般知识和概念）
 */
export interface SemanticMemory extends MemoryUnit {
  type: MemoryType.SEMANTIC;
  content: {
    concept: string;
    definition: string;
    properties: Record<string, any>;
    relationships: {
      type: string;
      target: string;
      strength: number;
    }[];
    examples: string[];
    contradictions?: string[];
  };
}

/**
 * 程序记忆（技能和习惯）
 */
export interface ProceduralMemory extends MemoryUnit {
  type: MemoryType.PROCEDURAL;
  content: {
    skill: string;
    category: 'communication' | 'problem_solving' | 'social' | 'creative' | 'physical';
    steps: {
      order: number;
      action: string;
      condition?: string;
      result?: string;
    }[];
    proficiencyLevel: number;       // 熟练程度 [0, 1]
    successRate: number;            // 成功率 [0, 1]
    improvements: string[];
  };
}

/**
 * 自传记忆（个人历史和身份）
 */
export interface AutobiographicalMemory extends MemoryUnit {
  type: MemoryType.AUTOBIOGRAPHICAL;
  content: {
    lifePeriod: string;
    significance: string;
    personalGrowth: {
      lessonsLearned: string[];
      skillsDeveloped: string[];
      relationshipsFormed: string[];
      challengesOvercome: string[];
    };
    identityImpact: {
      valuesAffected: string[];
      beliefsChanged: string[];
      personalityShifts: string[];
    };
    narrativeRole: 'origin' | 'turning_point' | 'achievement' | 'failure' | 'relationship' | 'discovery';
  };
}

/**
 * 记忆关联
 */
export interface MemoryAssociation {
  id: string;
  sourceMemoryId: string;
  targetMemoryId: string;
  
  // 关联类型
  associationType: 'temporal' | 'causal' | 'similarity' | 'contrast' | 'hierarchical' | 'thematic';
  
  // 关联强度
  strength: number;                 // [0, 1]
  bidirectional: boolean;
  
  // 关联描述
  description: string;
  context: string;
  
  // 学习信息
  learnedAt: Date;
  reinforced: number;               // 强化次数
  lastReinforced: Date;
}

/**
 * 记忆聚类
 */
export interface MemoryCluster {
  id: string;
  name: string;
  description: string;
  
  // 聚类内容
  memoryIds: string[];
  centerMemoryId: string;           // 中心记忆
  
  // 聚类特征
  coherence: number;                // 连贯性 [0, 1]
  diversity: number;                // 多样性 [0, 1]
  importance: MemoryImportance;
  
  // 聚类主题
  primaryThemes: string[];
  secondaryThemes: string[];
  
  // 时间跨度
  timeSpan: {
    start: Date;
    end: Date;
    duration: number;
  };
  
  createdAt: Date;
  lastUpdated: Date;
}

/**
 * 记忆模式
 */
export interface MemoryPattern {
  id: string;
  name: string;
  description: string;
  
  // 模式特征
  pattern: {
    triggers: string[];             // 触发条件
    sequence: string[];             // 序列模式
    outcomes: string[];             // 结果模式
  };
  
  // 统计信息
  frequency: number;                // 出现频率
  confidence: number;               // 模式置信度 [0, 1]
  stability: number;                // 稳定性 [0, 1]
  
  // 涉及的记忆
  exampleMemories: string[];
  
  // 预测能力
  predictiveValue: number;          // 预测价值 [0, 1]
  
  discoveredAt: Date;
  lastSeen: Date;
}

/**
 * 记忆整合结果
 */
export interface MemoryIntegrationResult {
  id: string;
  timestamp: Date;
  
  // 整合类型
  integrationType: 'synthesis' | 'compression' | 'association' | 'pattern_discovery' | 'conflict_resolution';
  
  // 输入记忆
  inputMemories: string[];
  
  // 输出结果
  outputMemories: string[];         // 新生成的记忆
  modifiedMemories: string[];       // 被修改的记忆
  archivedMemories: string[];       // 被归档的记忆
  
  // 整合描述
  description: string;
  rationale: string;
  
  // 质量评估
  quality: {
    coherence: number;              // 连贯性
    completeness: number;           // 完整性
    consistency: number;            // 一致性
    novelty: number;                // 新颖性
  };
  
  confidence: number;
}

/**
 * 记忆检索查询
 */
export interface MemoryQuery {
  // 查询条件
  types?: MemoryType[];
  keywords?: string[];
  timeRange?: {
    start: Date;
    end: Date;
  };
  characters?: string[];
  
  // 查询参数
  maxResults?: number;
  minRelevance?: number;            // 最小相关性阈值
  sortBy?: 'relevance' | 'recency' | 'importance' | 'strength';
  includeArchived?: boolean;
  
  // 上下文信息
  currentContext?: {
    situation: string;
    participants: string[];
    goals: string[];
  };
}

/**
 * 记忆检索结果
 */
export interface MemorySearchResult {
  memory: MemoryUnit;
  relevance: number;                // 相关性得分 [0, 1]
  reasoning: string;                // 检索理由
  context: string;                  // 上下文匹配
}

/**
 * 综合记忆状态
 */
export interface IntegratedMemoryState {
  characterId: string;
  
  // 记忆统计
  statistics: {
    totalMemories: number;
    memoriesByType: Record<MemoryType, number>;
    memoriesByImportance: Record<MemoryImportance, number>;
    
    averageStrength: number;
    averageVividness: number;
    averageConfidence: number;
    
    consolidationProgress: Record<ConsolidationStatus, number>;
  };
  
  // 记忆健康度
  health: {
    coherence: number;              // 记忆连贯性
    coverage: number;               // 记忆覆盖度
    integration: number;            // 整合度
    accessibility: number;          // 可访问性
  };
  
  // 近期活动
  recentActivity: {
    newMemories: number;            // 新增记忆数
    modifiedMemories: number;       // 修改记忆数
    integrationsPerformed: number;  // 执行的整合数
    patternsDiscovered: number;     // 发现的模式数
  };
  
  // 记忆容量
  capacity: {
    used: number;                   // 已使用容量
    available: number;              // 可用容量
    efficiency: number;             // 使用效率
  };
  
  lastUpdate: Date;
}

/**
 * 记忆整合配置
 */
export interface MemoryIntegrationConfig {
  // 整合触发条件
  triggers: {
    memoryThreshold: number;        // 记忆数量阈值
    timeThreshold: number;          // 时间阈值（毫秒）
    importanceThreshold: MemoryImportance; // 重要性阈值
    coherenceThreshold: number;     // 连贯性阈值
  };
  
  // 整合策略
  strategies: {
    enableSynthesis: boolean;       // 启用综合
    enableCompression: boolean;     // 启用压缩
    enablePatternDiscovery: boolean; // 启用模式发现
    enableConflictResolution: boolean; // 启用冲突解决
  };
  
  // 整合参数
  parameters: {
    maxIntegrationsPerCycle: number; // 每周期最大整合数
    associationThreshold: number;   // 关联阈值
    clusteringThreshold: number;    // 聚类阈值
    patternMinSupport: number;      // 模式最小支持度
  };
  
  // 性能配置
  performance: {
    maxMemorySize: number;          // 最大记忆数量
    archiveOldMemories: boolean;    // 自动归档旧记忆
    compressionRatio: number;       // 压缩比例
    backgroundProcessing: boolean;   // 后台处理
  };
}

/**
 * 记忆洞察
 */
export interface MemoryInsight {
  id: string;
  type: 'pattern' | 'trend' | 'gap' | 'conflict' | 'opportunity';
  
  // 洞察内容
  title: string;
  description: string;
  implications: string[];
  
  // 支持证据
  supportingMemories: string[];
  evidence: {
    strength: number;
    examples: string[];
    counterExamples?: string[];
  };
  
  // 实用性
  actionable: boolean;
  recommendations: string[];
  
  // 时间相关
  discoveredAt: Date;
  relevanceWindow: number;          // 相关性窗口（毫秒）
  
  confidence: number;
  importance: MemoryImportance;
}

/**
 * 记忆一致性检查结果
 */
export interface MemoryConsistencyCheck {
  id: string;
  timestamp: Date;
  
  // 检查结果
  overallConsistency: number;       // 总体一致性 [0, 1]
  
  // 发现的问题
  conflicts: {
    memoryIds: string[];
    conflictType: 'factual' | 'temporal' | 'logical' | 'emotional';
    description: string;
    severity: 'minor' | 'moderate' | 'major' | 'critical';
    suggestions: string[];
  }[];
  
  // 不一致性统计
  inconsistencies: {
    total: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
  };
  
  // 建议的修复
  recommendations: {
    priority: 'high' | 'medium' | 'low';
    action: string;
    affectedMemories: string[];
    expectedImprovement: number;
  }[];
}

/**
 * 记忆演化追踪
 */
export interface MemoryEvolution {
  characterId: string;
  
  // 演化阶段
  stages: {
    id: string;
    name: string;
    startDate: Date;
    endDate?: Date;
    
    characteristics: {
      dominantThemes: string[];
      memoryTypes: MemoryType[];
      averageImportance: MemoryImportance;
      coherenceLevel: number;
    };
    
    keyEvents: string[];             // 关键事件记忆ID
    milestones: string[];            // 里程碑记忆ID
  }[];
  
  // 演化趋势
  trends: {
    memoryGrowthRate: number;        // 记忆增长率
    importanceShift: number;         // 重要性转移
    thematicEvolution: string[];     // 主题演化
    skillDevelopment: string[];      // 技能发展
  };
  
  // 预测
  predictions: {
    nextThemes: string[];
    potentialChallenges: string[];
    growthOpportunities: string[];
    timeframe: string;
    confidence: number;
  };
  
  lastAnalysis: Date;
}

/**
 * 记忆管理器状态
 */
export interface MemoryManagerState {
  isActive: boolean;
  totalCharacters: number;
  totalMemories: number;
  
  // 子系统状态
  subsystems: {
    emotional: boolean;
    relationship: boolean;
    interaction: boolean;
    context: boolean;
  };
  
  // 性能指标
  performance: {
    integrationSuccessRate: number;  // 整合成功率
    retrievalAccuracy: number;       // 检索准确率
    consistencyScore: number;        // 一致性分数
    averageProcessingTime: number;   // 平均处理时间
  };
  
  // 系统健康
  systemHealth: {
    memoryIntegrity: number;         // 记忆完整性
    processingEfficiency: number;    // 处理效率
    resourceUtilization: number;     // 资源利用率
    errorRate: number;               // 错误率
  };
  
  currentConfig: MemoryIntegrationConfig;
  lastConfigUpdate: Date;
  lastIntegration: Date;
  lastUpdate: Date;
}

/**
 * 记忆快照
 */
export interface MemorySnapshot {
  id: string;
  characterId: string;
  timestamp: Date;
  
  // 快照内容
  memories: MemoryUnit[];
  associations: MemoryAssociation[];
  clusters: MemoryCluster[];
  patterns: MemoryPattern[];
  
  // 快照元数据
  version: string;
  description: string;
  triggerEvent?: string;
  
  // 比较基准
  baselineSnapshot?: string;        // 基准快照ID
  changes?: {
    added: string[];                // 新增记忆
    modified: string[];             // 修改记忆
    removed: string[];              // 删除记忆
  };
} 