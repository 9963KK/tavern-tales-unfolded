import { Message } from '../types/message';
import { AICharacter } from '../types/character';
import { contextManager, processContextForAI } from '../lib/contextManager';
import { fetchEnhancedAIResponse } from '../lib/enhancedAIResponse';

/**
 * 动态上下文裁剪系统测试套件
 */
export class ContextSystemTest {
  private testMessages: Message[] = [];
  private testCharacters: AICharacter[] = [];

  constructor() {
    this.initializeTestData();
  }

  /**
   * 初始化测试数据
   */
  private initializeTestData() {
    // 创建测试角色
    this.testCharacters = [
      {
        id: 'test-char-1',
        name: '艾莉娅',
        description: '一位聪明的法师，专精于元素魔法',
        personality: '好奇、理性、喜欢研究',
        avatarColor: '#3B82F6',
        modelConfig: {
          baseUrl: 'https://api.openai.com/v1',
          apiKey: 'test-key',
          modelName: 'gpt-3.5-turbo',
          prompt: '你是艾莉娅，一位聪明的法师。',
          temperature: 0.7,
          maxTokens: 2048
        }
      },
      {
        id: 'test-char-2',
        name: '雷克斯',
        description: '一位勇敢的战士，擅长近战',
        personality: '勇敢、直率、保护他人',
        avatarColor: '#EF4444',
        modelConfig: {
          baseUrl: 'https://api.openai.com/v1',
          apiKey: 'test-key',
          modelName: 'gpt-3.5-turbo',
          prompt: '你是雷克斯，一位勇敢的战士。',
          temperature: 0.8,
          maxTokens: 2048
        }
      }
    ];

    // 创建测试消息（模拟长对话）
    this.testMessages = [
      {
        id: '1',
        sender: '玩家',
        text: '大家好，我们来到了这个神秘的森林。',
        isPlayer: true,
        timestamp: new Date(Date.now() - 3600000), // 1小时前
        avatarColor: '#10B981'
      },
      {
        id: '2',
        sender: '艾莉娅',
        text: '这里的魔法能量很浓郁，我能感受到古老的力量在流动。',
        isPlayer: false,
        timestamp: new Date(Date.now() - 3500000),
        avatarColor: '#3B82F6'
      },
      {
        id: '3',
        sender: '雷克斯',
        text: '保持警惕，我听到了奇怪的声音。',
        isPlayer: false,
        timestamp: new Date(Date.now() - 3400000),
        avatarColor: '#EF4444'
      },
      // 添加更多消息以测试裁剪功能
      ...this.generateLongConversation()
    ];
  }

  /**
   * 生成长对话用于测试
   */
  private generateLongConversation(): Message[] {
    const messages: Message[] = [];
    const topics = [
      '探索森林深处',
      '发现古老遗迹',
      '遭遇神秘生物',
      '解开古老谜题',
      '寻找宝藏',
      '面对危险挑战'
    ];

    for (let i = 0; i < 50; i++) {
      const topic = topics[i % topics.length];
      const isPlayer = i % 3 === 0;
      const character = isPlayer ? '玩家' : this.testCharacters[i % 2].name;
      
      messages.push({
        id: `test-${i + 4}`,
        sender: character,
        text: `关于${topic}的讨论 - 这是第${i + 1}条测试消息，包含了一些详细的描述和对话内容。`,
        isPlayer,
        timestamp: new Date(Date.now() - (3300000 - i * 60000)), // 每分钟一条消息
        avatarColor: isPlayer ? '#10B981' : this.testCharacters[i % 2].avatarColor
      });
    }

    return messages;
  }

  /**
   * 测试基础上下文裁剪功能
   */
  async testBasicContextPruning(): Promise<void> {
    console.log('🧪 开始测试基础上下文裁剪功能');
    
    try {
      const result = await processContextForAI(
        this.testMessages,
        this.testCharacters[0],
        '探索森林',
        {
          maxTokens: 2000,
          enablePersonalization: false,
          debugMode: true
        }
      );

      console.log('✅ 基础裁剪测试结果:', {
        成功: result.success,
        原始消息数: result.originalMessageCount,
        裁剪后消息数: result.finalMessageCount,
        Token减少: `${result.tokenReduction.toFixed(1)}%`,
        策略: result.strategy,
        处理时间: `${result.processingTime}ms`
      });

      if (result.success && result.finalMessageCount < result.originalMessageCount) {
        console.log('✅ 基础上下文裁剪测试通过');
      } else {
        console.warn('⚠️ 基础上下文裁剪测试异常');
      }
    } catch (error) {
      console.error('❌ 基础上下文裁剪测试失败:', error);
    }
  }

  /**
   * 测试个性化裁剪功能
   */
  async testPersonalizedPruning(): Promise<void> {
    console.log('🧪 开始测试个性化裁剪功能');
    
    try {
      const result = await processContextForAI(
        this.testMessages,
        this.testCharacters[0], // 艾莉娅（法师）
        '魔法研究',
        {
          maxTokens: 2000,
          enablePersonalization: true,
          debugMode: true
        }
      );

      console.log('✅ 个性化裁剪测试结果:', {
        成功: result.success,
        原始消息数: result.originalMessageCount,
        裁剪后消息数: result.finalMessageCount,
        Token减少: `${result.tokenReduction.toFixed(1)}%`,
        策略: result.strategy,
        使用个性化: result.metadata.usedPersonalization,
        话题关键词: result.metadata.topicKeywords.slice(0, 5),
        处理时间: `${result.processingTime}ms`
      });

      if (result.success && result.metadata.usedPersonalization) {
        console.log('✅ 个性化裁剪测试通过');
      } else {
        console.warn('⚠️ 个性化裁剪测试异常');
      }
    } catch (error) {
      console.error('❌ 个性化裁剪测试失败:', error);
    }
  }

  /**
   * 测试性能表现
   */
  async testPerformance(): Promise<void> {
    console.log('🧪 开始测试性能表现');
    
    const iterations = 10;
    const times: number[] = [];

    try {
      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        
        await processContextForAI(
          this.testMessages,
          this.testCharacters[i % 2],
          `测试话题${i}`,
          {
            maxTokens: 3000,
            enablePersonalization: true,
            debugMode: false
          }
        );
        
        const endTime = Date.now();
        times.push(endTime - startTime);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const minTime = Math.min(...times);
      const maxTime = Math.max(...times);

      console.log('✅ 性能测试结果:', {
        测试次数: iterations,
        平均时间: `${avgTime.toFixed(1)}ms`,
        最快时间: `${minTime}ms`,
        最慢时间: `${maxTime}ms`,
        性能稳定性: maxTime - minTime < 1000 ? '良好' : '需优化'
      });

      if (avgTime < 2000) {
        console.log('✅ 性能测试通过');
      } else {
        console.warn('⚠️ 性能测试需要优化');
      }
    } catch (error) {
      console.error('❌ 性能测试失败:', error);
    }
  }

  /**
   * 测试缓存机制
   */
  async testCaching(): Promise<void> {
    console.log('🧪 开始测试缓存机制');
    
    try {
      // 第一次处理（应该没有缓存）
      const startTime1 = Date.now();
      const result1 = await processContextForAI(
        this.testMessages,
        this.testCharacters[0],
        '缓存测试话题',
        {
          maxTokens: 2000,
          enablePersonalization: true,
          debugMode: false
        }
      );
      const time1 = Date.now() - startTime1;

      // 第二次处理相同内容（应该使用缓存）
      const startTime2 = Date.now();
      const result2 = await processContextForAI(
        this.testMessages,
        this.testCharacters[0],
        '缓存测试话题',
        {
          maxTokens: 2000,
          enablePersonalization: true,
          debugMode: false
        }
      );
      const time2 = Date.now() - startTime2;

      console.log('✅ 缓存测试结果:', {
        第一次处理时间: `${time1}ms`,
        第二次处理时间: `${time2}ms`,
        性能提升: time1 > time2 ? `${((time1 - time2) / time1 * 100).toFixed(1)}%` : '无提升',
        缓存效果: time2 < time1 * 0.5 ? '显著' : time2 < time1 * 0.8 ? '一般' : '无效'
      });

      if (time2 < time1 * 0.8) {
        console.log('✅ 缓存机制测试通过');
      } else {
        console.warn('⚠️ 缓存机制需要优化');
      }
    } catch (error) {
      console.error('❌ 缓存机制测试失败:', error);
    }
  }

  /**
   * 测试错误处理
   */
  async testErrorHandling(): Promise<void> {
    console.log('🧪 开始测试错误处理');
    
    try {
      // 测试空消息列表
      const result1 = await processContextForAI(
        [],
        this.testCharacters[0],
        '错误测试',
        { maxTokens: 2000 }
      );

      console.log('空消息列表测试:', result1.success ? '通过' : '失败');

      // 测试无效配置
      const result2 = await processContextForAI(
        this.testMessages,
        this.testCharacters[0],
        '错误测试',
        { maxTokens: -1 } // 无效的maxTokens
      );

      console.log('无效配置测试:', result2.success ? '异常' : '正确处理');

      console.log('✅ 错误处理测试完成');
    } catch (error) {
      console.log('✅ 错误处理测试通过（正确抛出异常）');
    }
  }

  /**
   * 运行完整测试套件
   */
  async runFullTestSuite(): Promise<void> {
    console.log('🚀 开始运行动态上下文裁剪系统完整测试套件');
    console.log('=' .repeat(60));

    await this.testBasicContextPruning();
    console.log('-'.repeat(40));

    await this.testPersonalizedPruning();
    console.log('-'.repeat(40));

    await this.testPerformance();
    console.log('-'.repeat(40));

    await this.testCaching();
    console.log('-'.repeat(40));

    await this.testErrorHandling();
    console.log('-'.repeat(40));

    // 显示系统统计信息
    const stats = contextManager.getPerformanceStats();
    console.log('📊 系统统计信息:', {
      总处理次数: stats.totalProcessed,
      平均处理时间: `${stats.averageProcessingTime.toFixed(1)}ms`,
      缓存命中率: `${(stats.cacheHitRate * 100).toFixed(1)}%`,
      错误率: `${(stats.errorRate * 100).toFixed(1)}%`,
      Token节省率: `${(stats.tokenSavingsRate * 100).toFixed(1)}%`
    });

    console.log('=' .repeat(60));
    console.log('✅ 动态上下文裁剪系统测试套件执行完成');
  }

  /**
   * 获取测试数据（供外部使用）
   */
  getTestData() {
    return {
      messages: this.testMessages,
      characters: this.testCharacters
    };
  }
}

/**
 * 快速测试函数（供控制台调用）
 */
export async function quickContextTest(): Promise<void> {
  const tester = new ContextSystemTest();
  await tester.runFullTestSuite();
}

/**
 * 性能基准测试
 */
export async function performanceBenchmark(): Promise<void> {
  console.log('🏃‍♂️ 开始性能基准测试');
  
  const tester = new ContextSystemTest();
  const { messages, characters } = tester.getTestData();
  
  const testCases = [
    { maxTokens: 1000, name: '小上下文' },
    { maxTokens: 3000, name: '中等上下文' },
    { maxTokens: 6000, name: '大上下文' }
  ];

  for (const testCase of testCases) {
    console.log(`\n测试 ${testCase.name} (${testCase.maxTokens} tokens):`);
    
    const times: number[] = [];
    for (let i = 0; i < 5; i++) {
      const startTime = Date.now();
      await processContextForAI(
        messages,
        characters[0],
        `基准测试${i}`,
        {
          maxTokens: testCase.maxTokens,
          enablePersonalization: true,
          debugMode: false
        }
      );
      times.push(Date.now() - startTime);
    }
    
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    console.log(`平均处理时间: ${avgTime.toFixed(1)}ms`);
  }
  
  console.log('🏁 性能基准测试完成');
}

// 导出测试实例（供开发时使用）
export const contextSystemTester = new ContextSystemTest(); 