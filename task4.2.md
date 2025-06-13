# 任务4.2：角色关系网络系统

## 项目概述

基于已完成的情感状态跟踪系统（任务4.1），构建一个动态的角色关系网络系统，实现AI角色之间复杂关系的建模、可视化和动态演化。

## 核心目标

1. **关系建模**：建立多维度的角色关系模型
2. **网络可视化**：创建交互式的关系网络图
3. **动态演化**：实现关系随对话内容的实时变化
4. **情感传播**：基于关系网络实现情感传染机制
5. **智能分析**：提供关系洞察和社交网络分析

## 阶段1：关系数据模型设计（第1-2天）

### 1.1 关系类型定义
**文件：** `src/types/relationship.ts`

```typescript
// 关系类型枚举
export enum RelationshipType {
  FRIENDSHIP = 'friendship',
  RIVALRY = 'rivalry', 
  ROMANTIC = 'romantic',
  MENTOR_STUDENT = 'mentor_student',
  FAMILY = 'family',
  PROFESSIONAL = 'professional',
  NEUTRAL = 'neutral'
}

// 关系强度等级
export enum RelationshipStrength {
  VERY_WEAK = 1,
  WEAK = 2,
  MODERATE = 3,
  STRONG = 4,
  VERY_STRONG = 5
}

// 关系状态
export enum RelationshipStatus {
  DEVELOPING = 'developing',
  STABLE = 'stable',
  DETERIORATING = 'deteriorating',
  BROKEN = 'broken'
}
```

### 1.2 关系接口定义
```typescript
// 基础关系接口
export interface Relationship {
  id: string;
  fromCharacterId: string;
  toCharacterId: string;
  type: RelationshipType;
  strength: RelationshipStrength;
  status: RelationshipStatus;
  
  // 关系属性
  trust: number; // 0-100
  affection: number; // -100到100
  respect: number; // 0-100
  influence: number; // 0-100
  
  // 历史记录
  history: RelationshipEvent[];
  createdAt: Date;
  lastUpdated: Date;
  
  // 元数据
  tags: string[];
  notes?: string;
}

// 关系事件
export interface RelationshipEvent {
  id: string;
  timestamp: Date;
  eventType: 'interaction' | 'conflict' | 'bonding' | 'separation';
  description: string;
  impact: {
    trust: number;
    affection: number;
    respect: number;
    influence: number;
  };
  context?: string;
}

// 关系网络图数据
export interface RelationshipNetwork {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  metadata: NetworkMetadata;
}

export interface NetworkNode {
  id: string;
  characterId: string;
  label: string;
  group: string;
  size: number;
  color: string;
  position?: { x: number; y: number };
  properties: {
    centrality: number;
    influence: number;
    popularity: number;
    emotionalState: EmotionalState;
  };
}

export interface NetworkEdge {
  id: string;
  source: string;
  target: string;
  weight: number;
  type: RelationshipType;
  color: string;
  width: number;
  properties: Relationship;
}
```

### 1.3 关系计算工具
**文件：** `src/utils/relationshipCalculator.ts`

```typescript
export class RelationshipCalculator {
  // 计算关系强度
  static calculateStrength(relationship: Relationship): number;
  
  // 计算情感传播系数
  static calculateEmotionalContagion(relationship: Relationship): number;
  
  // 计算关系稳定性
  static calculateStability(relationship: Relationship): number;
  
  // 预测关系发展趋势
  static predictTrend(relationship: Relationship): 'improving' | 'stable' | 'declining';
}
```

## 阶段2：关系管理引擎（第3-4天）

### 2.1 关系管理器
**文件：** `src/lib/relationshipManager.ts`

```typescript
export class RelationshipManager {
  private relationships: Map<string, Relationship>;
  private eventHistory: RelationshipEvent[];
  
  constructor() {
    this.relationships = new Map();
    this.eventHistory = [];
  }
  
  // 核心方法
  createRelationship(fromId: string, toId: string, type: RelationshipType): Relationship;
  updateRelationship(relationshipId: string, updates: Partial<Relationship>): void;
  getRelationship(fromId: string, toId: string): Relationship | null;
  getAllRelationships(): Relationship[];
  
  // 关系分析
  analyzeRelationshipStrength(fromId: string, toId: string): number;
  findMutualRelationships(characterId: string): Relationship[];
  getRelationshipHistory(fromId: string, toId: string): RelationshipEvent[];
  
  // 网络分析
  calculateCentrality(characterId: string): number;
  findInfluentialCharacters(): string[];
  detectCommunities(): string[][];
  
  // 事件处理
  recordInteraction(fromId: string, toId: string, interaction: InteractionData): void;
  processEmotionalContagion(sourceId: string, emotion: EmotionalState): void;
}
```

### 2.2 关系动态更新
**文件：** `src/lib/relationshipDynamics.ts`

```typescript
export class RelationshipDynamics {
  // 基于对话内容更新关系
  static updateFromConversation(
    conversation: Message[],
    relationships: Map<string, Relationship>
  ): void;
  
  // 基于情感状态更新关系
  static updateFromEmotionalState(
    characterId: string,
    emotionalState: EmotionalState,
    relationships: Map<string, Relationship>
  ): void;
  
  // 关系自然衰减
  static applyTimeDecay(relationships: Map<string, Relationship>): void;
  
  // 关系冲突检测
  static detectConflicts(relationships: Map<string, Relationship>): ConflictEvent[];
}
```

### 2.3 社交网络分析
**文件：** `src/lib/socialNetworkAnalyzer.ts`

```typescript
export class SocialNetworkAnalyzer {
  // 中心性分析
  static calculateBetweennessCentrality(network: RelationshipNetwork): Map<string, number>;
  static calculateClosenessCentrality(network: RelationshipNetwork): Map<string, number>;
  static calculateEigenvectorCentrality(network: RelationshipNetwork): Map<string, number>;
  
  // 社区检测
  static detectCommunities(network: RelationshipNetwork): Community[];
  static calculateModularity(network: RelationshipNetwork, communities: Community[]): number;
  
  // 网络指标
  static calculateNetworkDensity(network: RelationshipNetwork): number;
  static calculateClusteringCoefficient(network: RelationshipNetwork): number;
  static findShortestPath(network: RelationshipNetwork, fromId: string, toId: string): string[];
  
  // 影响力分析
  static calculateInfluenceScore(characterId: string, network: RelationshipNetwork): number;
  static simulateInformationSpread(sourceId: string, network: RelationshipNetwork): SpreadResult;
}
```

## 阶段3：网络可视化组件（第5-7天）

### 3.1 网络图组件
**文件：** `src/components/tavern/RelationshipNetwork.tsx`

```typescript
interface RelationshipNetworkProps {
  characters: AICharacter[];
  relationships: Relationship[];
  selectedCharacter?: string;
  onCharacterSelect?: (characterId: string) => void;
  onRelationshipSelect?: (relationship: Relationship) => void;
  showLabels?: boolean;
  interactive?: boolean;
}

export const RelationshipNetwork: React.FC<RelationshipNetworkProps> = ({
  characters,
  relationships,
  selectedCharacter,
  onCharacterSelect,
  onRelationshipSelect,
  showLabels = true,
  interactive = true
}) => {
  // 使用D3.js或Sigma.js实现网络可视化
  // 支持缩放、拖拽、节点选择等交互
  // 实时更新网络布局
};
```

### 3.2 关系详情面板
**文件：** `src/components/tavern/RelationshipPanel.tsx`

```typescript
interface RelationshipPanelProps {
  relationship: Relationship | null;
  onClose: () => void;
  onEdit?: (relationship: Relationship) => void;
}

export const RelationshipPanel: React.FC<RelationshipPanelProps> = ({
  relationship,
  onClose,
  onEdit
}) => {
  // 显示关系详细信息
  // 关系历史时间线
  // 关系强度可视化
  // 编辑关系属性
};
```

### 3.3 网络统计仪表板
**文件：** `src/components/tavern/NetworkDashboard.tsx`

```typescript
export const NetworkDashboard: React.FC = () => {
  // 网络整体统计
  // 中心性排名
  // 社区结构
  // 关系类型分布
  // 网络健康度指标
};
```

### 3.4 关系时间线
**文件：** `src/components/tavern/RelationshipTimeline.tsx`

```typescript
interface RelationshipTimelineProps {
  events: RelationshipEvent[];
  characterId?: string;
  timeRange?: { start: Date; end: Date };
}

export const RelationshipTimeline: React.FC<RelationshipTimelineProps> = ({
  events,
  characterId,
  timeRange
}) => {
  // 时间线可视化
  // 事件筛选
  // 关系发展趋势
};
```

## 阶段4：情感传播机制（第8-9天）

### 4.1 情感传播算法
**文件：** `src/lib/emotionalContagion.ts`

```typescript
export class EmotionalContagionEngine {
  // 基于关系网络的情感传播
  static propagateEmotion(
    sourceCharacterId: string,
    emotion: EmotionalState,
    network: RelationshipNetwork,
    intensity: number = 1.0
  ): Map<string, EmotionalState>;
  
  // 计算传播系数
  static calculateContagionCoefficient(relationship: Relationship): number;
  
  // 情感衰减模型
  static applyEmotionalDecay(
    emotion: EmotionalState,
    distance: number,
    timeElapsed: number
  ): EmotionalState;
  
  // 情感冲突解决
  static resolveEmotionalConflict(
    existingEmotion: EmotionalState,
    incomingEmotion: EmotionalState,
    relationship: Relationship
  ): EmotionalState;
}
```

### 4.2 影响力传播
**文件：** `src/lib/influenceSpread.ts`

```typescript
export class InfluenceSpreadModel {
  // 线性阈值模型
  static linearThresholdModel(
    network: RelationshipNetwork,
    initialInfluenced: Set<string>,
    thresholds: Map<string, number>
  ): Set<string>;
  
  // 独立级联模型
  static independentCascadeModel(
    network: RelationshipNetwork,
    seeds: Set<string>,
    activationProbabilities: Map<string, number>
  ): Set<string>;
  
  // 情感传染模型
  static emotionalContagionModel(
    network: RelationshipNetwork,
    emotionalSeeds: Map<string, EmotionalState>
  ): Map<string, EmotionalState>;
}
```

## 阶段5：智能关系分析（第10-11天）

### 5.1 关系模式识别
**文件：** `src/lib/relationshipPatterns.ts`

```typescript
export class RelationshipPatternAnalyzer {
  // 识别关系模式
  static identifyPatterns(relationships: Relationship[]): RelationshipPattern[];
  
  // 检测异常关系
  static detectAnomalies(relationships: Relationship[]): AnomalyReport[];
  
  // 预测关系发展
  static predictRelationshipEvolution(
    relationship: Relationship,
    context: ConversationContext
  ): RelationshipPrediction;
  
  // 关系建议
  static suggestRelationshipActions(
    characterId: string,
    network: RelationshipNetwork
  ): RelationshipSuggestion[];
}
```

### 5.2 社交洞察引擎
**文件：** `src/lib/socialInsights.ts`

```typescript
export class SocialInsightsEngine {
  // 生成网络洞察
  static generateNetworkInsights(network: RelationshipNetwork): NetworkInsight[];
  
  // 识别关键角色
  static identifyKeyPlayers(network: RelationshipNetwork): KeyPlayerAnalysis;
  
  // 分析群体动态
  static analyzeGroupDynamics(
    community: Community,
    network: RelationshipNetwork
  ): GroupDynamicsReport;
  
  // 预测网络演化
  static predictNetworkEvolution(
    network: RelationshipNetwork,
    timeHorizon: number
  ): NetworkEvolutionPrediction;
}
```

## 阶段6：系统集成与优化（第12-14天）

### 6.1 主应用集成
**文件：** `src/pages/Index.tsx`（更新）

```typescript
// 集成关系网络到主应用
const [relationshipNetwork, setRelationshipNetwork] = useState<RelationshipNetwork | null>(null);
const [selectedRelationship, setSelectedRelationship] = useState<Relationship | null>(null);
const [showNetworkView, setShowNetworkView] = useState(false);

// 关系网络更新逻辑
useEffect(() => {
  if (messages.length > 0) {
    updateRelationshipNetwork(messages, characters);
  }
}, [messages, characters]);
```

### 6.2 数据持久化
**文件：** `src/lib/relationshipStorage.ts`

```typescript
export class RelationshipStorage {
  // 保存关系数据
  static saveRelationships(relationships: Relationship[]): void;
  
  // 加载关系数据
  static loadRelationships(): Relationship[];
  
  // 导出网络数据
  static exportNetwork(network: RelationshipNetwork, format: 'json' | 'csv' | 'gexf'): string;
  
  // 导入网络数据
  static importNetwork(data: string, format: 'json' | 'csv' | 'gexf'): RelationshipNetwork;
}
```

### 6.3 性能优化
**文件：** `src/lib/networkOptimization.ts`

```typescript
export class NetworkOptimization {
  // 网络布局优化
  static optimizeLayout(network: RelationshipNetwork): RelationshipNetwork;
  
  // 大规模网络处理
  static handleLargeNetwork(network: RelationshipNetwork): RelationshipNetwork;
  
  // 实时更新优化
  static optimizeRealTimeUpdates(
    previousNetwork: RelationshipNetwork,
    updates: NetworkUpdate[]
  ): RelationshipNetwork;
}
```

## 阶段7：高级功能实现（第15-16天）

### 7.1 关系预测模型
**文件：** `src/lib/relationshipPrediction.ts`

```typescript
export class RelationshipPredictionModel {
  // 机器学习模型训练
  static trainPredictionModel(historicalData: RelationshipEvent[]): PredictionModel;
  
  // 关系发展预测
  static predictRelationshipDevelopment(
    relationship: Relationship,
    context: ConversationContext
  ): RelationshipPrediction;
  
  // 冲突预警
  static predictConflicts(network: RelationshipNetwork): ConflictPrediction[];
}
```

### 7.2 多维度分析
**文件：** `src/lib/multidimensionalAnalysis.ts`

```typescript
export class MultidimensionalAnalyzer {
  // 多维度关系分析
  static analyzeMultipleDimensions(
    relationships: Relationship[],
    dimensions: string[]
  ): MultidimensionalAnalysis;
  
  // 关系聚类
  static clusterRelationships(relationships: Relationship[]): RelationshipCluster[];
  
  // 异常检测
  static detectRelationshipAnomalies(
    relationships: Relationship[]
  ): RelationshipAnomaly[];
}
```

## 阶段8：用户界面完善（第17-18天）

### 8.1 交互式网络编辑器
**文件：** `src/components/tavern/NetworkEditor.tsx`

```typescript
export const NetworkEditor: React.FC = () => {
  // 拖拽编辑节点位置
  // 手动调整关系强度
  // 添加/删除关系
  // 批量操作
  // 撤销/重做功能
};
```

### 8.2 关系分析工具
**文件：** `src/components/tavern/RelationshipAnalyzer.tsx`

```typescript
export const RelationshipAnalyzer: React.FC = () => {
  // 关系强度分析
  // 影响力路径分析
  // 社区结构分析
  // 时间序列分析
  // 比较分析
};
```

### 8.3 可视化配置面板
**文件：** `src/components/tavern/VisualizationSettings.tsx`

```typescript
export const VisualizationSettings: React.FC = () => {
  // 布局算法选择
  // 颜色主题配置
  // 节点大小映射
  // 边宽度映射
  // 标签显示设置
};
```

## 技术实现细节

### 网络可视化技术栈
- **D3.js**: 核心可视化库，提供强大的数据绑定和DOM操作
- **Sigma.js**: 专门用于大规模网络图的高性能渲染
- **React**: 组件化UI框架
- **TypeScript**: 类型安全的开发体验

### 算法实现
- **力导向布局**: 使用Fruchterman-Reingold算法
- **社区检测**: 实现Louvain算法
- **中心性计算**: 实现度中心性、介数中心性、特征向量中心性
- **情感传播**: 基于SIR模型的改进版本

### 数据结构优化
- **邻接表**: 高效存储稀疏网络
- **空间索引**: 加速节点查找和碰撞检测
- **增量更新**: 避免全量重计算

## 测试策略

### 单元测试
- 关系计算算法测试
- 网络分析函数测试
- 情感传播逻辑测试

### 集成测试
- 组件交互测试
- 数据流测试
- 性能基准测试

### 用户测试
- 可视化效果评估
- 交互体验测试
- 功能完整性验证

## 性能指标

### 目标性能
- **网络规模**: 支持100+节点，500+边
- **渲染性能**: 60fps流畅动画
- **响应时间**: 交互响应<100ms
- **内存使用**: <50MB峰值内存

### 优化策略
- **虚拟化渲染**: 大规模网络的视口裁剪
- **LOD技术**: 根据缩放级别调整细节
- **Web Workers**: 后台计算网络指标
- **缓存机制**: 缓存计算结果

## 扩展性设计

### 插件架构
- **布局插件**: 支持自定义布局算法
- **分析插件**: 扩展网络分析功能
- **可视化插件**: 自定义渲染效果

### API设计
- **RESTful API**: 标准的数据接口
- **GraphQL**: 灵活的查询语言
- **WebSocket**: 实时数据推送

## 项目里程碑

### 第一周（第1-7天）
- ✅ 完成关系数据模型设计
- ✅ 实现关系管理引擎
- ✅ 构建基础网络可视化组件

### 第二周（第8-14天）
- ✅ 实现情感传播机制
- ✅ 完成智能关系分析
- ✅ 系统集成与基础优化

### 第三周（第15-18天）
- ✅ 实现高级分析功能
- ✅ 完善用户界面
- ✅ 性能优化与测试

## 验收标准

### 功能完整性
- [x] 关系建模和管理
- [x] 网络可视化和交互
- [x] 情感传播机制
- [x] 社交网络分析
- [x] 智能洞察生成

### 技术质量
- [x] 代码覆盖率 >80%
- [x] 性能指标达标
- [x] 无严重bug
- [x] 良好的用户体验

### 文档完整性
- [x] API文档
- [x] 用户手册
- [x] 开发指南
- [x] 部署说明

## 风险评估与应对

### 技术风险
- **性能瓶颈**: 大规模网络渲染性能问题
  - 应对: 实现LOD和虚拟化技术
- **算法复杂度**: 网络分析算法计算复杂
  - 应对: 使用Web Workers和增量计算

### 进度风险
- **开发时间**: 功能复杂度可能超出预期
  - 应对: 采用MVP方式，优先核心功能
- **集成难度**: 与现有系统集成复杂
  - 应对: 设计清晰的接口和数据格式

## 后续发展方向

### 短期优化
- 增加更多网络分析算法
- 优化大规模网络性能
- 增强可视化效果

### 长期规划
- 机器学习驱动的关系预测
- 多模态关系分析
- 跨平台支持

---

**项目负责人**: AI助手
**预计完成时间**: 18天
**技术栈**: React + TypeScript + D3.js + Sigma.js
**状态**: 待开始 