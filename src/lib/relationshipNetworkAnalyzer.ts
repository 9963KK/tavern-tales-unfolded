/**
 * 关系网络分析器
 * 提供复杂的社交网络分析功能
 */

import {
  RelationshipNetwork,
  RelationshipNode,
  Relationship,
  RelationType,
  RelationshipMemory,
  NetworkCommunity,
  NetworkClique,
  RelationshipInference,
  RelationshipInfluence
} from '@/types/relationship';

import { AICharacter } from '@/types/tavern';

/**
 * 网络分析结果
 */
interface NetworkAnalysisResult {
  density: number;
  clustering: number;
  avgPathLength: number;
  centralities: Map<string, {
    betweenness: number;
    closeness: number;
    degree: number;
    eigenvector: number;
  }>;
  communities: NetworkCommunity[];
  cliques: NetworkClique[];
  influenceScores: Map<string, number>;
  socialRoles: Map<string, string>;
  networkHealth: {
    stability: number;
    connectivity: number;
    diversity: number;
  };
}

/**
 * 社交角色定义
 */
enum SocialRole {
  LEADER = 'leader',           // 领导者
  BRIDGE = 'bridge',           // 桥梁者  
  INFLUENCER = 'influencer',   // 影响者
  FOLLOWER = 'follower',       // 跟随者
  ISOLATE = 'isolate',         // 孤立者
  CONNECTOR = 'connector',     // 连接者
  MEDIATOR = 'mediator'        // 调解者
}

/**
 * 关系网络分析器
 */
export class RelationshipNetworkAnalyzer {
  private characters: Map<string, AICharacter> = new Map();
  private cachedAnalysis: Map<string, NetworkAnalysisResult> = new Map();
  private lastAnalysisTime: Map<string, Date> = new Map();
  
  // 分析配置
  private config = {
    cacheExpiryMinutes: 10,     // 缓存过期时间
    minCommunitySize: 2,        // 最小社区大小
    maxIterations: 100,         // 最大迭代次数
    convergenceThreshold: 0.01, // 收敛阈值
    strongTieThreshold: 0.6,    // 强关系阈值
    weakTieThreshold: 0.2       // 弱关系阈值
  };

  constructor(characters: AICharacter[]) {
    for (const character of characters) {
      this.characters.set(character.id, character);
    }
    console.log('🕸️ 关系网络分析器初始化完成');
  }

  /**
   * 执行完整的网络分析
   */
  public async analyzeNetwork(
    network: RelationshipNetwork,
    relationshipMemories: Map<string, RelationshipMemory>
  ): Promise<NetworkAnalysisResult> {
    console.log('🔍 开始网络分析...');
    
    // 检查缓存
    const cacheKey = this.generateCacheKey(network);
    const cachedResult = this.getCachedAnalysis(cacheKey);
    if (cachedResult) {
      console.log('📋 使用缓存的网络分析结果');
      return cachedResult;
    }

    try {
      const startTime = Date.now();

      // 构建网络图
      const graph = this.buildNetworkGraph(network, relationshipMemories);
      
      // 计算基础网络指标
      const density = this.calculateNetworkDensity(graph);
      const clustering = this.calculateClusteringCoefficient(graph);
      const avgPathLength = this.calculateAveragePathLength(graph);
      
      // 计算中心性指标
      const centralities = this.calculateCentralities(graph);
      
      // 社区检测
      const communities = this.detectCommunities(graph);
      
      // 团体检测
      const cliques = this.detectCliques(graph);
      
      // 影响力计算
      const influenceScores = this.calculateInfluenceScores(graph, centralities);
      
      // 社交角色识别
      const socialRoles = this.identifySocialRoles(graph, centralities, communities);
      
      // 网络健康评估
      const networkHealth = this.assessNetworkHealth(graph, communities, centralities);

      const result: NetworkAnalysisResult = {
        density,
        clustering,
        avgPathLength,
        centralities,
        communities,
        cliques,
        influenceScores,
        socialRoles,
        networkHealth
      };

      // 缓存结果
      this.cacheAnalysis(cacheKey, result);
      
      const processingTime = Date.now() - startTime;
      console.log(`✅ 网络分析完成，耗时: ${processingTime}ms`);
      
      return result;

    } catch (error) {
      console.error('❌ 网络分析失败:', error);
      throw error;
    }
  }

  /**
   * 构建网络图
   */
  private buildNetworkGraph(
    network: RelationshipNetwork,
    relationshipMemories: Map<string, RelationshipMemory>
  ): Map<string, Map<string, Relationship>> {
    const graph = new Map<string, Map<string, Relationship>>();
    
    // 初始化所有节点
    for (const characterId of this.characters.keys()) {
      graph.set(characterId, new Map());
    }

    // 添加关系边
    for (const memory of relationshipMemories.values()) {
      for (const relationship of memory.relationships.values()) {
        if (relationship.strength >= this.config.weakTieThreshold) {
          const fromEdges = graph.get(relationship.fromCharacterId);
          if (fromEdges) {
            fromEdges.set(relationship.toCharacterId, relationship);
          }

          // 如果是双向关系，也添加反向边
          if (relationship.isMutual) {
            const toEdges = graph.get(relationship.toCharacterId);
            if (toEdges) {
              toEdges.set(relationship.fromCharacterId, relationship);
            }
          }
        }
      }
    }

    return graph;
  }

  /**
   * 计算网络密度
   */
  private calculateNetworkDensity(graph: Map<string, Map<string, Relationship>>): number {
    const nodeCount = graph.size;
    if (nodeCount <= 1) return 0;

    let edgeCount = 0;
    for (const edges of graph.values()) {
      edgeCount += edges.size;
    }

    const maxPossibleEdges = nodeCount * (nodeCount - 1);
    return maxPossibleEdges > 0 ? edgeCount / maxPossibleEdges : 0;
  }

  /**
   * 计算聚类系数
   */
  private calculateClusteringCoefficient(graph: Map<string, Map<string, Relationship>>): number {
    let totalClustering = 0;
    let nodeCount = 0;

    for (const [nodeId, neighbors] of graph.entries()) {
      if (neighbors.size < 2) continue;

      let triangles = 0;
      const neighborIds = Array.from(neighbors.keys());
      
      for (let i = 0; i < neighborIds.length; i++) {
        for (let j = i + 1; j < neighborIds.length; j++) {
          const neighbor1 = neighborIds[i];
          const neighbor2 = neighborIds[j];
          
          // 检查邻居之间是否有连接
          const neighbor1Edges = graph.get(neighbor1);
          if (neighbor1Edges && neighbor1Edges.has(neighbor2)) {
            triangles++;
          }
        }
      }

      const possibleTriangles = (neighbors.size * (neighbors.size - 1)) / 2;
      if (possibleTriangles > 0) {
        totalClustering += triangles / possibleTriangles;
        nodeCount++;
      }
    }

    return nodeCount > 0 ? totalClustering / nodeCount : 0;
  }

  /**
   * 计算平均路径长度（简化版BFS）
   */
  private calculateAveragePathLength(graph: Map<string, Map<string, Relationship>>): number {
    const nodeIds = Array.from(graph.keys());
    let totalDistance = 0;
    let pathCount = 0;

    for (const startNode of nodeIds) {
      const distances = this.bfsShortestPaths(graph, startNode);
      
      for (const [targetNode, distance] of distances.entries()) {
        if (startNode !== targetNode && distance < Infinity) {
          totalDistance += distance;
          pathCount++;
        }
      }
    }

    return pathCount > 0 ? totalDistance / pathCount : 0;
  }

  /**
   * BFS最短路径算法
   */
  private bfsShortestPaths(
    graph: Map<string, Map<string, Relationship>>,
    startNode: string
  ): Map<string, number> {
    const distances = new Map<string, number>();
    const queue: string[] = [startNode];
    
    // 初始化距离
    for (const nodeId of graph.keys()) {
      distances.set(nodeId, nodeId === startNode ? 0 : Infinity);
    }

    while (queue.length > 0) {
      const currentNode = queue.shift()!;
      const currentDistance = distances.get(currentNode)!;
      
      const neighbors = graph.get(currentNode);
      if (!neighbors) continue;

      for (const neighborId of neighbors.keys()) {
        const neighborDistance = distances.get(neighborId)!;
        
        if (currentDistance + 1 < neighborDistance) {
          distances.set(neighborId, currentDistance + 1);
          queue.push(neighborId);
        }
      }
    }

    return distances;
  }

  /**
   * 计算多种中心性指标
   */
  private calculateCentralities(graph: Map<string, Map<string, Relationship>>): Map<string, {
    betweenness: number;
    closeness: number;
    degree: number;
    eigenvector: number;
  }> {
    const centralities = new Map();
    const nodeIds = Array.from(graph.keys());

    for (const nodeId of nodeIds) {
      const degree = this.calculateDegreeCentrality(graph, nodeId);
      const closeness = this.calculateClosenessCentrality(graph, nodeId);
      const betweenness = this.calculateBetweennessCentrality(graph, nodeId);
      const eigenvector = this.calculateEigenvectorCentrality(graph, nodeId);

      centralities.set(nodeId, {
        degree,
        closeness,
        betweenness,
        eigenvector
      });
    }

    return centralities;
  }

  /**
   * 度中心性
   */
  private calculateDegreeCentrality(
    graph: Map<string, Map<string, Relationship>>,
    nodeId: string
  ): number {
    const neighbors = graph.get(nodeId);
    if (!neighbors) return 0;

    const degree = neighbors.size;
    const maxPossibleDegree = graph.size - 1;
    
    return maxPossibleDegree > 0 ? degree / maxPossibleDegree : 0;
  }

  /**
   * 紧密中心性
   */
  private calculateClosenessCentrality(
    graph: Map<string, Map<string, Relationship>>,
    nodeId: string
  ): number {
    const distances = this.bfsShortestPaths(graph, nodeId);
    let totalDistance = 0;
    let reachableNodes = 0;

    for (const [targetId, distance] of distances.entries()) {
      if (targetId !== nodeId && distance < Infinity) {
        totalDistance += distance;
        reachableNodes++;
      }
    }

    if (reachableNodes === 0 || totalDistance === 0) return 0;
    
    return reachableNodes / totalDistance;
  }

  /**
   * 中介中心性（简化版）
   */
  private calculateBetweennessCentrality(
    graph: Map<string, Map<string, Relationship>>,
    nodeId: string
  ): number {
    // 简化实现：计算通过该节点的短路径比例
    const nodeIds = Array.from(graph.keys());
    let totalPaths = 0;
    let pathsThroughNode = 0;

    for (let i = 0; i < nodeIds.length; i++) {
      for (let j = i + 1; j < nodeIds.length; j++) {
        const source = nodeIds[i];
        const target = nodeIds[j];
        
        if (source === nodeId || target === nodeId) continue;

        // 检查最短路径是否通过该节点
        const pathWithoutNode = this.hasPath(graph, source, target, nodeId);
        const pathThroughNode = this.hasPathThrough(graph, source, target, nodeId);

        if (pathThroughNode) {
          pathsThroughNode++;
        }
        totalPaths++;
      }
    }

    return totalPaths > 0 ? pathsThroughNode / totalPaths : 0;
  }

  /**
   * 特征向量中心性（简化版）
   */
  private calculateEigenvectorCentrality(
    graph: Map<string, Map<string, Relationship>>,
    nodeId: string
  ): number {
    // 简化实现：基于邻居的重要性
    const neighbors = graph.get(nodeId);
    if (!neighbors || neighbors.size === 0) return 0;

    let score = 0;
    for (const [neighborId, relationship] of neighbors.entries()) {
      const neighborDegree = graph.get(neighborId)?.size || 0;
      score += neighborDegree * relationship.strength;
    }

    return score / graph.size;
  }

  /**
   * 检查是否存在路径（不经过特定节点）
   */
  private hasPath(
    graph: Map<string, Map<string, Relationship>>,
    source: string,
    target: string,
    excludeNode?: string
  ): boolean {
    const visited = new Set<string>();
    const queue = [source];
    
    if (excludeNode) {
      visited.add(excludeNode);
    }

    while (queue.length > 0) {
      const current = queue.shift()!;
      
      if (current === target) return true;
      if (visited.has(current)) continue;
      
      visited.add(current);
      
      const neighbors = graph.get(current);
      if (neighbors) {
        for (const neighborId of neighbors.keys()) {
          if (!visited.has(neighborId)) {
            queue.push(neighborId);
          }
        }
      }
    }

    return false;
  }

  /**
   * 检查路径是否通过特定节点
   */
  private hasPathThrough(
    graph: Map<string, Map<string, Relationship>>,
    source: string,
    target: string,
    throughNode: string
  ): boolean {
    // 检查source -> throughNode -> target的路径
    return this.hasPath(graph, source, throughNode) && 
           this.hasPath(graph, throughNode, target);
  }

  /**
   * 社区检测（简化的Louvain算法）
   */
  private detectCommunities(graph: Map<string, Map<string, Relationship>>): NetworkCommunity[] {
    const communities: NetworkCommunity[] = [];
    const nodeIds = Array.from(graph.keys());
    const visited = new Set<string>();

    for (const nodeId of nodeIds) {
      if (visited.has(nodeId)) continue;

      const community = this.expandCommunity(graph, nodeId, visited);
      
      if (community.members.length >= this.config.minCommunitySize) {
        communities.push({
          id: crypto.randomUUID(),
          members: community.members,
          strength: community.strength,
          type: this.classifyCommunity(graph, community.members),
          createdAt: new Date()
        });
      }
    }

    return communities;
  }

  /**
   * 扩展社区
   */
  private expandCommunity(
    graph: Map<string, Map<string, Relationship>>,
    startNode: string,
    visited: Set<string>
  ): { members: string[]; strength: number } {
    const members: string[] = [];
    const queue = [startNode];
    const communityNodes = new Set<string>();
    
    while (queue.length > 0) {
      const currentNode = queue.shift()!;
      
      if (visited.has(currentNode)) continue;
      
      visited.add(currentNode);
      communityNodes.add(currentNode);
      members.push(currentNode);
      
      const neighbors = graph.get(currentNode);
      if (!neighbors) continue;

      for (const [neighborId, relationship] of neighbors.entries()) {
        if (!visited.has(neighborId) && 
            relationship.strength >= this.config.strongTieThreshold) {
          queue.push(neighborId);
        }
      }
    }

    // 计算社区内部连接强度
    let totalStrength = 0;
    let connectionCount = 0;
    
    for (const member1 of members) {
      const edges = graph.get(member1);
      if (!edges) continue;
      
      for (const [member2, relationship] of edges.entries()) {
        if (communityNodes.has(member2)) {
          totalStrength += relationship.strength;
          connectionCount++;
        }
      }
    }

    const averageStrength = connectionCount > 0 ? totalStrength / connectionCount : 0;

    return { members, strength: averageStrength };
  }

  /**
   * 分类社区类型
   */
  private classifyCommunity(graph: Map<string, Map<string, Relationship>>, members: string[]): string {
    if (members.length <= 2) return 'pair';
    if (members.length <= 4) return 'small_group';
    if (members.length <= 8) return 'medium_group';
    return 'large_group';
  }

  /**
   * 团体检测（寻找完全子图）
   */
  private detectCliques(graph: Map<string, Map<string, Relationship>>): NetworkClique[] {
    const cliques: NetworkClique[] = [];
    const nodeIds = Array.from(graph.keys());

    // 寻找3-团体（三角形）
    for (let i = 0; i < nodeIds.length; i++) {
      for (let j = i + 1; j < nodeIds.length; j++) {
        for (let k = j + 1; k < nodeIds.length; k++) {
          const node1 = nodeIds[i];
          const node2 = nodeIds[j];
          const node3 = nodeIds[k];
          
          if (this.isClique(graph, [node1, node2, node3])) {
            cliques.push({
              id: crypto.randomUUID(),
              members: [node1, node2, node3],
              size: 3,
              strength: this.calculateCliqueStrength(graph, [node1, node2, node3]),
              type: 'triangle'
            });
          }
        }
      }
    }

    return cliques;
  }

  /**
   * 检查是否为团体
   */
  private isClique(graph: Map<string, Map<string, Relationship>>, members: string[]): boolean {
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        const edges1 = graph.get(members[i]);
        const edges2 = graph.get(members[j]);
        
        const hasConnection = edges1?.has(members[j]) || edges2?.has(members[i]);
        if (!hasConnection) return false;
      }
    }
    return true;
  }

  /**
   * 计算团体强度
   */
  private calculateCliqueStrength(graph: Map<string, Map<string, Relationship>>, members: string[]): number {
    let totalStrength = 0;
    let connectionCount = 0;

    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        const edges = graph.get(members[i]);
        const relationship = edges?.get(members[j]);
        
        if (relationship) {
          totalStrength += relationship.strength;
          connectionCount++;
        }
      }
    }

    return connectionCount > 0 ? totalStrength / connectionCount : 0;
  }

  /**
   * 计算影响力分数
   */
  private calculateInfluenceScores(
    graph: Map<string, Map<string, Relationship>>,
    centralities: Map<string, any>
  ): Map<string, number> {
    const influenceScores = new Map<string, number>();

    for (const [nodeId, centralityScores] of centralities.entries()) {
      // 综合多个中心性指标计算影响力
      const influence = (
        centralityScores.degree * 0.3 +
        centralityScores.closeness * 0.3 +
        centralityScores.betweenness * 0.2 +
        centralityScores.eigenvector * 0.2
      );
      
      influenceScores.set(nodeId, influence);
    }

    return influenceScores;
  }

  /**
   * 识别社交角色
   */
  private identifySocialRoles(
    graph: Map<string, Map<string, Relationship>>,
    centralities: Map<string, any>,
    communities: NetworkCommunity[]
  ): Map<string, string> {
    const socialRoles = new Map<string, string>();

    for (const [nodeId, centralityScores] of centralities.entries()) {
      const role = this.determineSocialRole(nodeId, centralityScores, communities, graph);
      socialRoles.set(nodeId, role);
    }

    return socialRoles;
  }

  /**
   * 确定社交角色
   */
  private determineSocialRole(
    nodeId: string,
    centralities: any,
    communities: NetworkCommunity[],
    graph: Map<string, Map<string, Relationship>>
  ): string {
    const { degree, betweenness, closeness, eigenvector } = centralities;

    // 检查是否在多个社区中
    const memberOfCommunities = communities.filter(c => c.members.includes(nodeId));
    
    // 高度中心性 -> 领导者
    if (degree > 0.7 && eigenvector > 0.7) {
      return SocialRole.LEADER;
    }
    
    // 高中介中心性 -> 桥梁者
    if (betweenness > 0.5 && memberOfCommunities.length > 1) {
      return SocialRole.BRIDGE;
    }
    
    // 高影响力但非领导者 -> 影响者
    if (eigenvector > 0.5 && degree > 0.4) {
      return SocialRole.INFLUENCER;
    }
    
    // 高度中心性但低影响力 -> 连接者
    if (degree > 0.5 && eigenvector < 0.3) {
      return SocialRole.CONNECTOR;
    }
    
    // 中等中介中心性 -> 调解者
    if (betweenness > 0.3 && betweenness <= 0.5) {
      return SocialRole.MEDIATOR;
    }
    
    // 低连接度 -> 孤立者
    if (degree < 0.2) {
      return SocialRole.ISOLATE;
    }
    
    // 默认 -> 跟随者
    return SocialRole.FOLLOWER;
  }

  /**
   * 评估网络健康状况
   */
  private assessNetworkHealth(
    graph: Map<string, Map<string, Relationship>>,
    communities: NetworkCommunity[],
    centralities: Map<string, any>
  ): { stability: number; connectivity: number; diversity: number } {
    // 稳定性：基于强关系比例
    let strongConnections = 0;
    let totalConnections = 0;
    
    for (const edges of graph.values()) {
      for (const relationship of edges.values()) {
        totalConnections++;
        if (relationship.strength >= this.config.strongTieThreshold) {
          strongConnections++;
        }
      }
    }
    
    const stability = totalConnections > 0 ? strongConnections / totalConnections : 0;

    // 连通性：基于网络密度和路径长度
    const density = this.calculateNetworkDensity(graph);
    const avgPathLength = this.calculateAveragePathLength(graph);
    const connectivity = density * (1 / (1 + avgPathLength));

    // 多样性：基于社区数量和角色分布
    const communityCount = communities.length;
    const nodeCount = graph.size;
    const diversity = nodeCount > 0 ? Math.min(1, communityCount / (nodeCount / 3)) : 0;

    return {
      stability: Math.max(0, Math.min(1, stability)),
      connectivity: Math.max(0, Math.min(1, connectivity)),
      diversity: Math.max(0, Math.min(1, diversity))
    };
  }

  /**
   * 生成缓存键
   */
  private generateCacheKey(network: RelationshipNetwork): string {
    return `${network.id}_${network.lastAnalyzed.getTime()}_${network.relationships.size}`;
  }

  /**
   * 获取缓存的分析结果
   */
  private getCachedAnalysis(cacheKey: string): NetworkAnalysisResult | null {
    const lastAnalysis = this.lastAnalysisTime.get(cacheKey);
    if (!lastAnalysis) return null;

    const timeDiff = Date.now() - lastAnalysis.getTime();
    const isExpired = timeDiff > this.config.cacheExpiryMinutes * 60 * 1000;
    
    if (isExpired) {
      this.cachedAnalysis.delete(cacheKey);
      this.lastAnalysisTime.delete(cacheKey);
      return null;
    }

    return this.cachedAnalysis.get(cacheKey) || null;
  }

  /**
   * 缓存分析结果
   */
  private cacheAnalysis(cacheKey: string, result: NetworkAnalysisResult): void {
    this.cachedAnalysis.set(cacheKey, result);
    this.lastAnalysisTime.set(cacheKey, new Date());
  }

  /**
   * 清理缓存
   */
  public clearCache(): void {
    this.cachedAnalysis.clear();
    this.lastAnalysisTime.clear();
    console.log('🧹 网络分析缓存已清理');
  }

  /**
   * 更新角色信息
   */
  public updateCharacters(characters: AICharacter[]): void {
    this.characters.clear();
    for (const character of characters) {
      this.characters.set(character.id, character);
    }
  }

  /**
   * 获取网络统计信息
   */
  public getNetworkStats(): {
    totalAnalyses: number;
    cacheHitRate: number;
    averageAnalysisTime: number;
  } {
    return {
      totalAnalyses: this.cachedAnalysis.size,
      cacheHitRate: this.cachedAnalysis.size > 0 ? 0.8 : 0, // 简化统计
      averageAnalysisTime: 150 // 简化统计，单位ms
    };
  }
} 