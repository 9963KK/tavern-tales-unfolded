import { Message, AICharacter } from '@/types/tavern';
import { 
  MessageImportance, 
  ImportanceScore, 
  ImportanceConfig 
} from '@/types/memory';

/**
 * 默认重要性评估配置
 */
const DEFAULT_IMPORTANCE_CONFIG: ImportanceConfig = {
  weights: {
    plot: 0.25,        // 情节权重
    character: 0.20,   // 角色权重
    interaction: 0.30, // 互动权重 (RPG游戏中玩家互动很重要)
    continuity: 0.15,  // 连贯性权重
    emotion: 0.10      // 情感权重
  },
  playerMentionBonus: 2.0,      // 玩家提及加成
  aiMentionBonus: 1.5,          // AI被提及加成
  emotionalKeywordsBonus: 1.0,  // 情感关键词加成
  timeDecayFactor: 0.95         // 时间衰减因子（每小时）
};

/**
 * 情感关键词库
 */
const EMOTIONAL_KEYWORDS = {
  positive: [
    '高兴', '快乐', '喜悦', '兴奋', '激动', '满意', '开心', '愉快',
    '欢喜', '愉悦', '舒心', '惊喜', '感谢', '感激', '赞美', '称赞'
  ],
  negative: [
    '愤怒', '生气', '恼火', '烦恼', '沮丧', '失望', '悲伤', '难过',
    '痛苦', '恐惧', '害怕', '担心', '焦虑', '紧张', '绝望', '孤独'
  ],
  intense: [
    '震惊', '惊讶', '震撼', '惊恐', '狂怒', '暴怒', '狂欢', '狂喜',
    '绝望', '崩溃', '疯狂', '极度', '强烈', '激烈', '剧烈'
  ]
};

/**
 * 情节关键词库
 */
const PLOT_KEYWORDS = {
  action: [
    '战斗', '攻击', '防御', '逃跑', '追逐', '潜行', '搜索', '探索',
    '施法', '咒语', '法术', '技能', '武器', '装备', '道具'
  ],
  quest: [
    '任务', '委托', '请求', '寻找', '收集', '拯救', '护送', '调查',
    '线索', '秘密', '宝藏', '遗迹', '地下城', '冒险', '旅程'
  ],
  social: [
    '结盟', '背叛', '友谊', '敌对', '谈判', '交易', '合作', '竞争',
    '信任', '怀疑', '秘密', '揭露', '欺骗', '真相'
  ],
  conflict: [
    '冲突', '争吵', '分歧', '对立', '矛盾', '争斗', '竞争', '敌意',
    '威胁', '挑战', '危险', '紧急', '危机', '困境'
  ]
};

/**
 * 消息重要性评估器
 */
export class ImportanceEvaluator {
  private config: ImportanceConfig;
  private characters: AICharacter[];

  constructor(characters: AICharacter[], config?: Partial<ImportanceConfig>) {
    this.characters = characters;
    this.config = {
      ...DEFAULT_IMPORTANCE_CONFIG,
      ...config
    };
  }

  /**
   * 评估单条消息的重要性
   */
  evaluateMessage(
    message: Message, 
    context: Message[] = [], 
    timeWeight: number = 1.0
  ): ImportanceScore {
    const factors = {
      plot: this.evaluatePlotImportance(message, context),
      character: this.evaluateCharacterImportance(message, context),
      interaction: this.evaluateInteractionImportance(message, context),
      continuity: this.evaluateContinuityImportance(message, context),
      emotion: this.evaluateEmotionalImportance(message, context)
    };

    // 计算加权总分
    let overall = 0;
    Object.entries(factors).forEach(([key, value]) => {
      overall += value * this.config.weights[key as keyof typeof this.config.weights];
    });

    // 应用时间权重
    overall *= timeWeight;

    // 应用特殊加成
    overall += this.calculateBonuses(message);

    // 限制在0-10范围内
    overall = Math.max(0, Math.min(10, overall));

    // 确定重要性等级
    const importance = this.determineImportanceLevel(overall);

    // 提取评分理由和关键词
    const reasons = this.generateReasons(message, factors);
    const keywords = this.extractKeywords(message);

    return {
      overall,
      importance,
      factors,
      reasons,
      keywords
    };
  }

  /**
   * 批量评估消息重要性
   */
  evaluateMessages(messages: Message[]): ImportanceScore[] {
    const results: ImportanceScore[] = [];
    const currentTime = Date.now();

    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      const context = messages.slice(0, i); // 前面的消息作为上下文
      
      // 计算时间衰减权重
      const messageTime = new Date(message.timestamp).getTime();
      const hoursDiff = (currentTime - messageTime) / (1000 * 60 * 60);
      const timeWeight = Math.pow(this.config.timeDecayFactor, hoursDiff);

      const score = this.evaluateMessage(message, context, timeWeight);
      results.push(score);
    }

    return results;
  }

  /**
   * 评估情节重要性
   */
  private evaluatePlotImportance(message: Message, context: Message[]): number {
    const text = message.text.toLowerCase();
    let score = 0;

    // 检查情节关键词
    Object.values(PLOT_KEYWORDS).forEach(keywords => {
      keywords.forEach(keyword => {
        if (text.includes(keyword)) {
          score += 1;
        }
      });
    });

    // 检查是否是情节转折点
    if (this.isPlotTurningPoint(message, context)) {
      score += 3;
    }

    // 检查是否包含决策性内容
    const decisionWords = ['决定', '选择', '决心', '打算', '计划', '准备'];
    decisionWords.forEach(word => {
      if (text.includes(word)) {
        score += 1.5;
      }
    });

    return Math.min(score, 10);
  }

  /**
   * 评估角色发展重要性
   */
  private evaluateCharacterImportance(message: Message, context: Message[]): number {
    const text = message.text.toLowerCase();
    let score = 0;

    // 检查是否展现角色个性
    const personalityWords = [
      '我认为', '我觉得', '我的看法', '我相信', '我希望', '我担心',
      '过去', '曾经', '回忆', '经历', '故事', '秘密'
    ];
    personalityWords.forEach(word => {
      if (text.includes(word)) {
        score += 1;
      }
    });

    // 检查角色关系变化
    if (this.detectRelationshipChange(message, context)) {
      score += 2;
    }

    // 检查角色成长迹象
    const growthWords = ['学会', '明白', '理解', '领悟', '改变', '成长'];
    growthWords.forEach(word => {
      if (text.includes(word)) {
        score += 1.5;
      }
    });

    return Math.min(score, 10);
  }

  /**
   * 评估互动重要性
   */
  private evaluateInteractionImportance(message: Message, context: Message[]): number {
    let score = 0;

    // 玩家消息自动获得高分
    if (message.isPlayer) {
      score += 4;
    }

    // 检查@提及
    if (message.mentionedCharacters && message.mentionedCharacters.length > 0) {
      score += 3;
    }

    // 检查是否是回应玩家
    if (!message.isPlayer && this.isResponseToPlayer(message, context)) {
      score += 2;
    }

    // 检查是否是多角色互动
    if (this.isMultiCharacterInteraction(message, context)) {
      score += 1.5;
    }

    return Math.min(score, 10);
  }

  /**
   * 评估对话连贯性重要性
   */
  private evaluateContinuityImportance(message: Message, context: Message[]): number {
    let score = 0;

    // 检查话题连贯性
    if (context.length > 0) {
      const topicContinuity = this.calculateTopicContinuity(message, context);
      score += topicContinuity * 3;
    }

    // 检查问答配对
    if (this.isQuestionAnswerPair(message, context)) {
      score += 2;
    }

    // 检查话题引入
    if (this.isTopicIntroduction(message, context)) {
      score += 1.5;
    }

    return Math.min(score, 10);
  }

  /**
   * 评估情感重要性
   */
  private evaluateEmotionalImportance(message: Message, context: Message[]): number {
    const text = message.text.toLowerCase();
    let score = 0;

    // 检查情感关键词
    Object.entries(EMOTIONAL_KEYWORDS).forEach(([type, keywords]) => {
      keywords.forEach(keyword => {
        if (text.includes(keyword)) {
          score += type === 'intense' ? 2 : 1;
        }
      });
    });

    // 检查感叹号和问号（情感强度指示器）
    const exclamationCount = (message.text.match(/!/g) || []).length;
    const questionCount = (message.text.match(/\?/g) || []).length;
    score += Math.min(exclamationCount * 0.5, 2);
    score += Math.min(questionCount * 0.3, 1);

    return Math.min(score, 10);
  }

  /**
   * 计算特殊加成
   */
  private calculateBonuses(message: Message): number {
    let bonus = 0;

    // 玩家提及加成
    if (message.isPlayer) {
      bonus += this.config.playerMentionBonus;
    }

    // AI被提及加成
    if (message.mentionedCharacters && message.mentionedCharacters.length > 0) {
      bonus += this.config.aiMentionBonus;
    }

    // 情感关键词加成
    const text = message.text.toLowerCase();
    const hasEmotionalKeywords = Object.values(EMOTIONAL_KEYWORDS)
      .flat()
      .some(keyword => text.includes(keyword));
    
    if (hasEmotionalKeywords) {
      bonus += this.config.emotionalKeywordsBonus;
    }

    return bonus;
  }

  /**
   * 确定重要性等级
   */
  private determineImportanceLevel(score: number): MessageImportance {
    if (score >= 8) return MessageImportance.CRITICAL;
    if (score >= 6) return MessageImportance.HIGH;
    if (score >= 4) return MessageImportance.MEDIUM;
    if (score >= 2) return MessageImportance.LOW;
    return MessageImportance.MINIMAL;
  }

  /**
   * 生成评分理由
   */
  private generateReasons(message: Message, factors: any): string[] {
    const reasons: string[] = [];

    if (factors.plot > 5) reasons.push('包含重要情节内容');
    if (factors.character > 5) reasons.push('体现角色发展');
    if (factors.interaction > 5) reasons.push('重要的玩家互动');
    if (factors.continuity > 5) reasons.push('维持对话连贯性');
    if (factors.emotion > 5) reasons.push('情感表达强烈');

    if (message.isPlayer) reasons.push('玩家发言');
    if (message.mentionedCharacters?.length) reasons.push('包含@提及');

    return reasons;
  }

  /**
   * 提取关键词
   */
  private extractKeywords(message: Message): string[] {
    const text = message.text.toLowerCase();
    const keywords: string[] = [];

    // 提取情节关键词
    Object.values(PLOT_KEYWORDS).flat().forEach(keyword => {
      if (text.includes(keyword)) {
        keywords.push(keyword);
      }
    });

    // 提取情感关键词
    Object.values(EMOTIONAL_KEYWORDS).flat().forEach(keyword => {
      if (text.includes(keyword)) {
        keywords.push(keyword);
      }
    });

    return [...new Set(keywords)]; // 去重
  }

  /**
   * 辅助方法：检查是否是情节转折点
   */
  private isPlotTurningPoint(message: Message, context: Message[]): boolean {
    const turningPointWords = ['突然', '忽然', '意外', '惊讶', '但是', '然而', '不过'];
    return turningPointWords.some(word => message.text.includes(word));
  }

  /**
   * 辅助方法：检测关系变化
   */
  private detectRelationshipChange(message: Message, context: Message[]): boolean {
    const relationshipWords = ['朋友', '敌人', '盟友', '伙伴', '信任', '怀疑'];
    return relationshipWords.some(word => message.text.includes(word));
  }

  /**
   * 辅助方法：检查是否是回应玩家
   */
  private isResponseToPlayer(message: Message, context: Message[]): boolean {
    if (context.length === 0) return false;
    const lastMessage = context[context.length - 1];
    return lastMessage.isPlayer;
  }

  /**
   * 辅助方法：检查是否是多角色互动
   */
  private isMultiCharacterInteraction(message: Message, context: Message[]): boolean {
    if (context.length < 2) return false;
    const recent = context.slice(-3);
    const speakers = new Set(recent.map(msg => msg.sender));
    return speakers.size >= 2;
  }

  /**
   * 辅助方法：计算话题连贯性
   */
  private calculateTopicContinuity(message: Message, context: Message[]): number {
    if (context.length === 0) return 0;
    
    const recentMessages = context.slice(-3);
    const allText = recentMessages.map(msg => msg.text).join(' ').toLowerCase();
    const currentText = message.text.toLowerCase();
    
    // 简单的关键词重叠计算
    const allWords = allText.split(/\s+/);
    const currentWords = currentText.split(/\s+/);
    const overlap = currentWords.filter(word => allWords.includes(word)).length;
    
    return Math.min(overlap / Math.max(currentWords.length, 1), 1);
  }

  /**
   * 辅助方法：检查问答配对
   */
  private isQuestionAnswerPair(message: Message, context: Message[]): boolean {
    if (context.length === 0) return false;
    const lastMessage = context[context.length - 1];
    return lastMessage.text.includes('?') || lastMessage.text.includes('？');
  }

  /**
   * 辅助方法：检查话题引入
   */
  private isTopicIntroduction(message: Message, context: Message[]): boolean {
    const introWords = ['说到', '关于', '谈到', '提到', '顺便', '对了'];
    return introWords.some(word => message.text.includes(word));
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<ImportanceConfig>): void {
    this.config = {
      ...this.config,
      ...newConfig
    };
  }

  /**
   * 获取当前配置
   */
  getConfig(): ImportanceConfig {
    return { ...this.config };
  }
} 