// 系统评估工具
import { AICharacter, Message } from '@/types/tavern';

export interface EvaluationResult {
  naturalness: {
    conversationFlow: number;
    responseRelevance: number;
    characterConsistency: number;
    timingAppropriateness: number;
  };
  fairness: {
    giniCoefficient: number;
    speakingDistribution: Record<string, number>;
    consecutiveSpeakingRate: number;
  };
  efficiency: {
    averageResponseTime: number;
    tokenUsagePerMessage: number;
    apiSuccessRate: number;
    fallbackRate: number;
  };
  intelligence: {
    mentionResponseRate: number;
    topicRelevanceScore: number;
    silenceAppropriatenesss: number;
  };
}

export class SystemEvaluator {
  private messages: Message[] = [];
  private characters: AICharacter[] = [];
  private speakingHistory: string[] = [];
  private responseTimings: number[] = [];
  private mentionTests: { mentioned: string; responded: boolean }[] = [];

  constructor(characters: AICharacter[]) {
    this.characters = characters;
  }

  // 记录对话数据
  recordMessage(message: Message, responseTime?: number) {
    this.messages.push(message);
    if (!message.isPlayer && responseTime) {
      this.responseTimings.push(responseTime);
      this.speakingHistory.push(message.sender);
    }
  }

  // 记录@提及测试
  recordMentionTest(mentionedCharacter: string, actualResponder: string) {
    this.mentionTests.push({
      mentioned: mentionedCharacter,
      responded: mentionedCharacter === actualResponder
    });
  }

  // 计算基尼系数（发言分布均匀度）
  private calculateGiniCoefficient(): number {
    const speakingCounts = this.characters.map(char => 
      this.speakingHistory.filter(speaker => speaker === char.name).length
    );
    
    if (speakingCounts.length === 0) return 0;
    
    const total = speakingCounts.reduce((sum, count) => sum + count, 0);
    if (total === 0) return 0;
    
    speakingCounts.sort((a, b) => a - b);
    
    let sum = 0;
    for (let i = 0; i < speakingCounts.length; i++) {
      sum += (2 * (i + 1) - speakingCounts.length - 1) * speakingCounts[i];
    }
    
    return sum / (speakingCounts.length * total);
  }

  // 计算连续发言率
  private calculateConsecutiveSpeakingRate(): number {
    if (this.speakingHistory.length < 2) return 0;
    
    let consecutiveCount = 0;
    for (let i = 1; i < this.speakingHistory.length; i++) {
      if (this.speakingHistory[i] === this.speakingHistory[i - 1]) {
        consecutiveCount++;
      }
    }
    
    return consecutiveCount / (this.speakingHistory.length - 1);
  }

  // 计算@提及响应率
  private calculateMentionResponseRate(): number {
    if (this.mentionTests.length === 0) return 1;
    
    const successfulResponses = this.mentionTests.filter(test => test.responded).length;
    return successfulResponses / this.mentionTests.length;
  }

  // 生成评估报告
  generateEvaluationReport(): EvaluationResult {
    const speakingDistribution: Record<string, number> = {};
    this.characters.forEach(char => {
      speakingDistribution[char.name] = this.speakingHistory.filter(
        speaker => speaker === char.name
      ).length;
    });

    return {
      naturalness: {
        conversationFlow: 0, // 需要人工评分或更复杂的NLP分析
        responseRelevance: 0, // 需要语义分析
        characterConsistency: 0, // 需要角色行为模式分析
        timingAppropriateness: 0 // 需要对话节奏分析
      },
      fairness: {
        giniCoefficient: this.calculateGiniCoefficient(),
        speakingDistribution,
        consecutiveSpeakingRate: this.calculateConsecutiveSpeakingRate()
      },
      efficiency: {
        averageResponseTime: this.responseTimings.length > 0 
          ? this.responseTimings.reduce((sum, time) => sum + time, 0) / this.responseTimings.length 
          : 0,
        tokenUsagePerMessage: 0, // 需要从Token统计数据计算
        apiSuccessRate: 0, // 需要记录API调用成功率
        fallbackRate: 0 // 需要记录回退到预设回复的频率
      },
      intelligence: {
        mentionResponseRate: this.calculateMentionResponseRate(),
        topicRelevanceScore: 0, // 需要主题分析结果
        silenceAppropriatenesss: 0 // 需要分析沉默时机
      }
    };
  }

  // 生成测试报告
  generateTestReport(): string {
    const result = this.generateEvaluationReport();
    
    return `
=== 多角色AI系统评估报告 ===

📊 公平性指标：
• 发言分布基尼系数: ${result.fairness.giniCoefficient.toFixed(3)} ${
  result.fairness.giniCoefficient < 0.3 ? '✅ 优秀' : 
  result.fairness.giniCoefficient < 0.5 ? '⚠️ 良好' : '❌ 需改进'
}
• 连续发言率: ${(result.fairness.consecutiveSpeakingRate * 100).toFixed(1)}% ${
  result.fairness.consecutiveSpeakingRate < 0.05 ? '✅' : '❌'
}

🎯 智能性指标：
• @提及响应率: ${(result.intelligence.mentionResponseRate * 100).toFixed(1)}% ${
  result.intelligence.mentionResponseRate > 0.8 ? '✅' : '❌'
}

⚡ 效率指标：
• 平均响应时间: ${result.efficiency.averageResponseTime.toFixed(0)}ms

📈 发言分布：
${Object.entries(result.fairness.speakingDistribution)
  .map(([name, count]) => `• ${name}: ${count}次`)
  .join('\n')}

建议：
${this.generateRecommendations(result)}
    `;
  }

  private generateRecommendations(result: EvaluationResult): string {
    const recommendations: string[] = [];
    
    if (result.fairness.giniCoefficient > 0.5) {
      recommendations.push('• 调整角色发言权重，提高分布均匀度');
    }
    
    if (result.fairness.consecutiveSpeakingRate > 0.05) {
      recommendations.push('• 增强冷却机制，减少连续发言');
    }
    
    if (result.intelligence.mentionResponseRate < 0.8) {
      recommendations.push('• 优化@提及检测和响应逻辑');
    }
    
    if (result.efficiency.averageResponseTime > 3000) {
      recommendations.push('• 优化API调用或增加缓存机制');
    }
    
    return recommendations.length > 0 ? recommendations.join('\n') : '• 系统表现良好，继续保持';
  }
}

// 预设测试场景
export const testScenarios = [
  {
    name: "日常聊天测试",
    description: "测试一般性话题的处理能力",
    inputs: [
      "今天天气真不错啊",
      "你们都是做什么的？",
      "有什么好玩的故事吗？"
    ]
  },
  {
    name: "@提及测试",
    description: "测试定向对话功能",
    inputs: [
      "@艾莉娅 你觉得这个想法怎么样？",
      "@格林 你有什么建议吗？",
      "@艾莉娅 @格林 你们两个讨论一下"
    ]
  },
  {
    name: "争议话题测试",
    description: "测试多角色响应机制",
    inputs: [
      "魔法和剑术哪个更厉害？",
      "冒险者的生活是否值得？",
      "这个王国的政策有什么问题？"
    ]
  },
  {
    name: "沉默测试",
    description: "测试系统的沉默机制",
    inputs: [
      "嗯...",
      "呃...",
      "（长时间沉默）"
    ]
  }
];

export default SystemEvaluator; 