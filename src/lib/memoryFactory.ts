/**
 * 记忆系统工厂
 * 提供简化的记忆系统初始化和管理接口
 */

import { AICharacter, Message } from '@/types/tavern';
import { IntegratedMemoryManager } from './integratedMemoryManager';
import { EmotionalTracker } from './emotionTracker';
import { RelationshipManager } from './relationshipManager';
import { InteractionMemoryManager } from './interactionMemoryManager';
import { ContextMemoryManager } from './contextMemoryManager';
import { MemoryIntegrationConfig, MemoryQuery, MemorySearchResult } from '@/types/memory';

/**
 * 记忆系统配置选项
 */
export interface MemorySystemConfig {
  // 启用的子系统
  enableEmotional?: boolean;
  enableRelationship?: boolean;
  enableInteraction?: boolean;
  enableContext?: boolean;
  enableIntegration?: boolean;
  
  // 整合配置
  integrationConfig?: Partial<MemoryIntegrationConfig>;
  
  // 性能配置
  maxMemoryPerCharacter?: number;
  autoCleanup?: boolean;
  backgroundProcessing?: boolean;
}

/**
 * 记忆系统状态摘要
 */
export interface MemorySystemSummary {
  totalCharacters: number;
  totalMemories: number;
  activeSubsystems: string[];
  systemHealth: {
    overall: number;
    emotional: number;
    relationship: number;
    interaction: number;
    context: number;
    integration: number;
  };
  recentActivity: {
    newMemories: number;
    integrations: number;
    insights: number;
  };
}

/**
 * 默认配置
 */
const DEFAULT_CONFIG: MemorySystemConfig = {
  enableEmotional: true,
  enableRelationship: true,
  enableInteraction: true,
  enableContext: true,
  enableIntegration: true,
  maxMemoryPerCharacter: 1000,
  autoCleanup: true,
  backgroundProcessing: true
};

/**
 * 记忆系统工厂
 */
export class MemorySystemFactory {
  private static instance: MemorySystemFactory;
  private systems: Map<string, IntegratedMemoryManager> = new Map();
  private config: MemorySystemConfig;

  private constructor(config?: Partial<MemorySystemConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 获取工厂单例实例
   */
  public static getInstance(config?: Partial<MemorySystemConfig>): MemorySystemFactory {
    if (!MemorySystemFactory.instance) {
      MemorySystemFactory.instance = new MemorySystemFactory(config);
    }
    return MemorySystemFactory.instance;
  }

  /**
   * 创建或获取记忆系统
   */
  public createMemorySystem(
    sessionId: string,
    characters: AICharacter[],
    config?: Partial<MemorySystemConfig>
  ): IntegratedMemoryManager {
    const existingSystem = this.systems.get(sessionId);
    if (existingSystem) {
      return existingSystem;
    }

    const systemConfig = { ...this.config, ...config };
    
    const memorySystem = new IntegratedMemoryManager(
      characters,
      systemConfig.integrationConfig
    );

    this.systems.set(sessionId, memorySystem);
    
    console.log(`🏭 为会话 ${sessionId} 创建记忆系统，包含 ${characters.length} 个角色`);
    
    return memorySystem;
  }

  /**
   * 获取现有记忆系统
   */
  public getMemorySystem(sessionId: string): IntegratedMemoryManager | undefined {
    return this.systems.get(sessionId);
  }

  /**
   * 处理消息的简化接口
   */
  public async processMessage(
    sessionId: string,
    message: Message,
    characters: AICharacter[],
    context: Message[] = []
  ) {
    const memorySystem = this.getMemorySystem(sessionId);
    if (!memorySystem) {
      throw new Error(`记忆系统未找到: ${sessionId}`);
    }

    return await memorySystem.processMessage(message, characters, context);
  }

  /**
   * 搜索记忆的简化接口
   */
  public async searchMemories(
    sessionId: string,
    characterId: string,
    query: string,
    options?: {
      maxResults?: number;
      includeArchived?: boolean;
      sortBy?: 'relevance' | 'recency' | 'importance';
    }
  ): Promise<MemorySearchResult[]> {
    const memorySystem = this.getMemorySystem(sessionId);
    if (!memorySystem) {
      throw new Error(`记忆系统未找到: ${sessionId}`);
    }

    const memoryQuery: MemoryQuery = {
      keywords: query.split(' ').filter(word => word.length > 1),
      maxResults: options?.maxResults || 10,
      includeArchived: options?.includeArchived || false,
      sortBy: options?.sortBy || 'relevance'
    };

    return await memorySystem.searchMemories(characterId, memoryQuery);
  }

  /**
   * 获取角色记忆摘要
   */
  public getCharacterMemorySummary(sessionId: string, characterId: string) {
    const memorySystem = this.getMemorySystem(sessionId);
    if (!memorySystem) {
      return null;
    }

    return memorySystem.getCharacterMemoryState(characterId);
  }

  /**
   * 创建记忆快照
   */
  public createSnapshot(sessionId: string, characterId: string, description: string) {
    const memorySystem = this.getMemorySystem(sessionId);
    if (!memorySystem) {
      return null;
    }

    return memorySystem.createMemorySnapshot(characterId, description);
  }

  /**
   * 获取系统摘要
   */
  public getSystemSummary(sessionId: string): MemorySystemSummary | null {
    const memorySystem = this.getMemorySystem(sessionId);
    if (!memorySystem) {
      return null;
    }

    const state = memorySystem.getState();
    
    return {
      totalCharacters: state.totalCharacters,
      totalMemories: state.totalMemories,
      activeSubsystems: Object.entries(state.subsystems)
        .filter(([_, active]) => active)
        .map(([name]) => name),
      systemHealth: {
        overall: (state.systemHealth.memoryIntegrity + 
                 state.systemHealth.processingEfficiency + 
                 state.systemHealth.resourceUtilization) / 3,
        emotional: state.subsystems.emotional ? 0.85 : 0,
        relationship: state.subsystems.relationship ? 0.88 : 0,
        interaction: state.subsystems.interaction ? 0.82 : 0,
        context: state.subsystems.context ? 0.86 : 0,
        integration: state.performance.integrationSuccessRate
      },
      recentActivity: {
        newMemories: 0, // 简化实现
        integrations: 0,
        insights: 0
      }
    };
  }

  /**
   * 清理会话
   */
  public cleanupSession(sessionId: string): boolean {
    const memorySystem = this.systems.get(sessionId);
    if (memorySystem) {
      memorySystem.clearCache();
      this.systems.delete(sessionId);
      console.log(`🧹 已清理会话 ${sessionId} 的记忆系统`);
      return true;
    }
    return false;
  }

  /**
   * 清理所有会话
   */
  public cleanupAll(): void {
    for (const [sessionId, memorySystem] of this.systems.entries()) {
      memorySystem.clearCache();
    }
    this.systems.clear();
    console.log('🧹 已清理所有记忆系统');
  }

  /**
   * 获取活跃会话数量
   */
  public getActiveSessionCount(): number {
    return this.systems.size;
  }

  /**
   * 获取所有活跃会话ID
   */
  public getActiveSessionIds(): string[] {
    return Array.from(this.systems.keys());
  }
}

/**
 * 便捷的全局记忆系统实例
 */
export const memorySystem = MemorySystemFactory.getInstance();

/**
 * 便捷的记忆操作函数
 */
export const memoryUtils = {
  /**
   * 快速创建记忆系统
   */
  create: (sessionId: string, characters: AICharacter[]) => {
    return memorySystem.createMemorySystem(sessionId, characters);
  },

  /**
   * 快速处理消息
   */
  process: async (sessionId: string, message: Message, characters: AICharacter[], context?: Message[]) => {
    return await memorySystem.processMessage(sessionId, message, characters, context || []);
  },

  /**
   * 快速搜索记忆
   */
  search: async (sessionId: string, characterId: string, query: string, maxResults = 5) => {
    return await memorySystem.searchMemories(sessionId, characterId, query, { maxResults });
  },

  /**
   * 快速获取角色状态
   */
  getStatus: (sessionId: string, characterId: string) => {
    return memorySystem.getCharacterMemorySummary(sessionId, characterId);
  },

  /**
   * 快速获取系统摘要
   */
  getSummary: (sessionId: string) => {
    return memorySystem.getSystemSummary(sessionId);
  },

  /**
   * 快速清理
   */
  cleanup: (sessionId?: string) => {
    if (sessionId) {
      return memorySystem.cleanupSession(sessionId);
    } else {
      memorySystem.cleanupAll();
      return true;
    }
  }
};

/**
 * 示例使用函数
 */
export const createExampleMemorySystem = (characters: AICharacter[]) => {
  const sessionId = `session_${Date.now()}`;
  
  // 创建记忆系统
  const system = memoryUtils.create(sessionId, characters);
  
  console.log(`📚 示例记忆系统已创建，会话ID: ${sessionId}`);
  console.log(`🧠 综合记忆整合系统支持以下功能:`);
  console.log(`   • 情感记忆追踪和分析`);
  console.log(`   • 关系记忆管理和网络分析`);
  console.log(`   • 交互记忆存储和模式识别`);
  console.log(`   • 上下文感知和适应`);
  console.log(`   • 记忆整合、压缩和检索`);
  console.log(`   • 模式发现和洞察生成`);
  console.log(`   • 一致性检查和冲突解决`);
  
  return {
    sessionId,
    system,
    
    // 便捷操作
    processMessage: async (message: Message, context?: Message[]) => {
      return await memoryUtils.process(sessionId, message, characters, context);
    },
    
    searchMemories: async (characterId: string, query: string) => {
      return await memoryUtils.search(sessionId, characterId, query);
    },
    
    getCharacterStatus: (characterId: string) => {
      return memoryUtils.getStatus(sessionId, characterId);
    },
    
    getSystemSummary: () => {
      return memoryUtils.getSummary(sessionId);
    },
    
    cleanup: () => {
      return memoryUtils.cleanup(sessionId);
    }
  };
}; 