import { 
  EmotionType, 
  EmotionalState, 
  EmotionAnalysisResult, 
  EmotionConfig, 
  DEFAULT_EMOTION_CONFIG,
  createDefaultEmotionalState 
} from '@/types/emotion';
import { AICharacter } from '@/types/tavern';

/**
 * 情感分析引擎
 * 负责分析文本情感、更新角色情感状态、处理情感传染等
 */
export class EmotionEngine {
  private config: EmotionConfig;
  
  // 情感关键词库（中文）
  private readonly EMOTION_KEYWORDS = {
    [EmotionType.HAPPY]: [
      '开心', '高兴', '快乐', '喜悦', '兴奋', '愉快', '欢乐', '满意', '舒心', '惊喜',
      '哈哈', '嘿嘿', '嘻嘻', '太好了', '真棒', '不错', '很好', '棒极了'
    ],
    [EmotionType.EXCITED]: [
      '兴奋', '激动', '热情', '狂欢', '疯狂', '燃烧', '沸腾', '震撼', '惊艳', '超棒',
      '哇', '天啊', '太棒了', 'amazing', 'incredible', 'fantastic'
    ],
    [EmotionType.SAD]: [
      '难过', '悲伤', '沮丧', '失望', '痛苦', '伤心', '忧郁', '郁闷', '低落', '哭',
      '呜呜', '555', '心痛', '难受', '不开心', '糟糕', '倒霉'
    ],
    [EmotionType.ANGRY]: [
      '愤怒', '生气', '恼火', '烦躁', '愤慨', '气愤', '暴怒', '恼怒', '火大', '讨厌',
      '可恶', '该死', '混蛋', '烦死了', '气死了', '受不了'
    ],
    [EmotionType.STRESSED]: [
      '紧张', '焦虑', '担心', '害怕', '恐惧', '不安', '忧虑', '慌张', '紧迫', '压力',
      '怎么办', '完了', '糟了', '麻烦', '危险'
    ],
    [EmotionType.CALM]: [
      '平静', '安静', '宁静', '祥和', '安详', '淡定', '从容', '稳定', '安心', '放心',
      '没事', '还好', '正常', '稳住'
    ],
    [EmotionType.RELAXED]: [
      '放松', '舒适', '惬意', '悠闲', '轻松', '自在', '舒服', '安逸', '休息', '慢慢来',
      '不急', '慢慢', '随意'
    ],
    [EmotionType.BORED]: [
      '无聊', '乏味', '枯燥', '没意思', '单调', '厌倦', '疲倦', '困', '没劲', '懒',
      '算了', '随便', '无所谓', '不想'
    ]
  };

  // 情感强度修饰词
  private readonly INTENSITY_MODIFIERS = {
    high: ['非常', '特别', '极其', '超级', '相当', '十分', '很', '太', '超', '巨'],
    medium: ['比较', '还', '挺', '蛮', '稍微'],
    low: ['有点', '一点', '略微', '稍', '些许']
  };

  // 标点符号情感强度
  private readonly PUNCTUATION_INTENSITY = {
    '!': 0.3,
    '！': 0.3,
    '?': 0.1,
    '？': 0.1,
    '...': -0.1,
    '。。。': -0.1,
    '~~~': 0.2,
    '~': 0.1
  };

  constructor(config: Partial<EmotionConfig> = {}) {
    this.config = { ...DEFAULT_EMOTION_CONFIG, ...config };
  }

  /**
   * 分析文本的情感内容
   */
  analyzeMessageEmotion(text: string): EmotionAnalysisResult {
    const cleanText = text.toLowerCase().trim();
    
    // 1. 关键词匹配分析
    const keywordResults = this.analyzeKeywords(cleanText);
    
    // 2. 强度修饰词分析
    const intensityMultiplier = this.analyzeIntensity(cleanText);
    
    // 3. 标点符号分析
    const punctuationBoost = this.analyzePunctuation(text);
    
    // 4. 计算最终结果
    let bestMatch = keywordResults[0] || {
      emotion: EmotionType.NEUTRAL,
      score: 0,
      keywords: []
    };

    const finalIntensity = Math.min(1, Math.max(0, 
      (bestMatch.score * intensityMultiplier + punctuationBoost) * 0.8
    ));

    const emotionState = createDefaultEmotionalState(bestMatch.emotion);
    
    return {
      detectedEmotion: bestMatch.emotion,
      confidence: bestMatch.score,
      keywords: bestMatch.keywords,
      intensity: finalIntensity,
      valence: emotionState.valence,
      arousal: emotionState.arousal
    };
  }

  /**
   * 根据角色个性调整情感反应
   */
  adjustEmotionForPersonality(
    baseEmotion: EmotionalState, 
    character: AICharacter
  ): EmotionalState {
    if (!character.personality) return baseEmotion;

    const adjusted = { ...baseEmotion };
    const personality = character.personality;

    // 外向性影响情感表达强度
    if (personality.extroversion > 0.7) {
      adjusted.intensity *= 1.2; // 外向角色情感表达更强烈
    } else if (personality.extroversion < 0.3) {
      adjusted.intensity *= 0.8; // 内向角色情感表达更内敛
    }

    // 反应敏感度影响情感变化速度
    const reactivityFactor = personality.reactivity || 0.5;
    adjusted.intensity *= (0.5 + reactivityFactor);

    // 健谈程度影响情感持续时间
    if (personality.talkativeness > 0.7) {
      // 健谈的角色情感变化更快
      adjusted.intensity *= 1.1;
    }

    // 社交角色调整
    if (character.socialRole) {
      switch (character.socialRole) {
        case 'host':
          // 主人角色对积极情感有加成
          if (adjusted.valence > 0) adjusted.valence *= 1.1;
          break;
        case 'entertainer':
          // 娱乐者情感表达更夸张
          adjusted.intensity *= 1.3;
          break;
        case 'observer':
          // 观察者情感表达更内敛
          adjusted.intensity *= 0.7;
          break;
        case 'advisor':
          // 顾问角色更倾向于平静
          if (adjusted.type !== EmotionType.CALM) {
            adjusted.intensity *= 0.9;
          }
          break;
      }
    }

    // 确保数值在合理范围内
    adjusted.intensity = Math.min(1, Math.max(0, adjusted.intensity));
    adjusted.valence = Math.min(1, Math.max(-1, adjusted.valence));
    adjusted.arousal = Math.min(1, Math.max(-1, adjusted.arousal));

    return adjusted;
  }

  /**
   * 应用情感传染机制
   */
  applyEmotionalContagion(
    characterEmotion: EmotionalState,
    contextEmotions: EmotionalState[]
  ): EmotionalState {
    if (contextEmotions.length === 0) return characterEmotion;

    // 计算环境情感的平均值
    const avgValence = contextEmotions.reduce((sum, e) => sum + e.valence, 0) / contextEmotions.length;
    const avgArousal = contextEmotions.reduce((sum, e) => sum + e.arousal, 0) / contextEmotions.length;
    const avgIntensity = contextEmotions.reduce((sum, e) => sum + e.intensity, 0) / contextEmotions.length;

    const contagionStrength = this.config.contagionStrength;
    
    return {
      ...characterEmotion,
      valence: characterEmotion.valence + (avgValence - characterEmotion.valence) * contagionStrength,
      arousal: characterEmotion.arousal + (avgArousal - characterEmotion.arousal) * contagionStrength,
      intensity: Math.min(1, characterEmotion.intensity + avgIntensity * contagionStrength * 0.1),
      triggers: [...characterEmotion.triggers, '情感传染']
    };
  }

  /**
   * 应用情感自然衰减
   */
  applyEmotionalDecay(
    currentEmotion: EmotionalState,
    timeElapsed: number, // 毫秒
    baselineEmotion: EmotionType = EmotionType.NEUTRAL
  ): EmotionalState {
    const hoursElapsed = timeElapsed / (1000 * 60 * 60);
    const decayFactor = Math.exp(-this.config.decayRate * hoursElapsed);
    
    const baseline = createDefaultEmotionalState(baselineEmotion);
    const returnRate = this.config.baselineReturnRate * hoursElapsed;

    return {
      ...currentEmotion,
      intensity: currentEmotion.intensity * decayFactor,
      valence: currentEmotion.valence + (baseline.valence - currentEmotion.valence) * returnRate,
      arousal: currentEmotion.arousal + (baseline.arousal - currentEmotion.arousal) * returnRate,
      timestamp: new Date()
    };
  }

  /**
   * 分析文本并更新角色情感状态
   */
  updateCharacterEmotion(
    character: AICharacter,
    text: string,
    emotionAnalysis: EmotionAnalysisResult,
    trigger: string
  ): AICharacter {
    // 创建新的情感状态
    const newEmotion: EmotionalState = {
      type: emotionAnalysis.detectedEmotion,
      intensity: emotionAnalysis.intensity,
      valence: emotionAnalysis.valence,
      arousal: emotionAnalysis.arousal,
      timestamp: new Date(),
      description: this.getEmotionDescription(emotionAnalysis.detectedEmotion),
      triggers: [trigger, ...emotionAnalysis.keywords.slice(0, 2)]
    };

    // 应用个性化调整
    const adjustedEmotion = this.adjustEmotionForPersonality(newEmotion, character);

    // 应用情感传染（如果有其他角色的情感状态）
    // 这里可以传入其他角色的情感状态进行传染计算
    
    // 应用情感衰减（基于时间）
    const currentTime = Date.now();
    const lastEmotionTime = character.currentEmotionalState?.timestamp?.getTime() || currentTime;
    const timeElapsed = currentTime - lastEmotionTime;
    
    let finalEmotion = adjustedEmotion;
    if (timeElapsed > 0) {
      finalEmotion = this.applyEmotionalDecay(
        adjustedEmotion,
        timeElapsed,
        character.baselineEmotion
      );
    }

    // 更新角色状态
    const updatedCharacter = { ...character };
    
    // 保存历史记录
    if (!updatedCharacter.emotionalHistory) {
      updatedCharacter.emotionalHistory = [];
    }
    
    if (updatedCharacter.currentEmotionalState) {
      updatedCharacter.emotionalHistory.push(updatedCharacter.currentEmotionalState);
      
      // 限制历史记录长度
      if (updatedCharacter.emotionalHistory.length > 10) {
        updatedCharacter.emotionalHistory = updatedCharacter.emotionalHistory.slice(-10);
      }
    }

    // 更新当前状态
    updatedCharacter.currentEmotionalState = finalEmotion;

    return updatedCharacter;
  }

  /**
   * 直接更新角色的情感状态（用于兼容旧接口）
   */
  updateCharacterEmotionDirect(
    character: AICharacter,
    newEmotion: EmotionalState,
    trigger: string
  ): void {
    // 保存历史记录
    if (!character.emotionalHistory) {
      character.emotionalHistory = [];
    }
    
    if (character.currentEmotionalState) {
      character.emotionalHistory.push(character.currentEmotionalState);
      
      // 限制历史记录长度
      if (character.emotionalHistory.length > 10) {
        character.emotionalHistory = character.emotionalHistory.slice(-10);
      }
    }

    // 更新当前状态
    character.currentEmotionalState = {
      ...newEmotion,
      triggers: [...newEmotion.triggers, trigger],
      timestamp: new Date()
    };
  }

  // 私有辅助方法

  private analyzeKeywords(text: string): Array<{emotion: EmotionType, score: number, keywords: string[]}> {
    const results: Array<{emotion: EmotionType, score: number, keywords: string[]}> = [];

    for (const [emotion, keywords] of Object.entries(this.EMOTION_KEYWORDS)) {
      const foundKeywords: string[] = [];
      let score = 0;

      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          foundKeywords.push(keyword);
          score += 1;
        }
      }

      if (foundKeywords.length > 0) {
        results.push({
          emotion: emotion as EmotionType,
          score: score / keywords.length, // 归一化分数
          keywords: foundKeywords
        });
      }
    }

    return results.sort((a, b) => b.score - a.score);
  }

  private analyzeIntensity(text: string): number {
    let multiplier = 1.0;

    // 检查强度修饰词
    for (const [level, modifiers] of Object.entries(this.INTENSITY_MODIFIERS)) {
      for (const modifier of modifiers) {
        if (text.includes(modifier)) {
          switch (level) {
            case 'high': multiplier *= 1.5; break;
            case 'medium': multiplier *= 1.2; break;
            case 'low': multiplier *= 0.8; break;
          }
        }
      }
    }

    return Math.min(2.0, multiplier); // 限制最大倍数
  }

  private analyzePunctuation(text: string): number {
    let boost = 0;

    for (const [punct, value] of Object.entries(this.PUNCTUATION_INTENSITY)) {
      const count = (text.match(new RegExp(punct.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
      boost += count * value;
    }

    return Math.min(0.5, Math.max(-0.2, boost)); // 限制范围
  }

  /**
   * 获取情感描述
   */
  private getEmotionDescription(emotionType: EmotionType): string {
    const descriptions = {
      [EmotionType.HAPPY]: '开心愉快',
      [EmotionType.EXCITED]: '兴奋激动',
      [EmotionType.SAD]: '悲伤难过',
      [EmotionType.ANGRY]: '愤怒生气',
      [EmotionType.STRESSED]: '紧张焦虑',
      [EmotionType.CALM]: '平静安详',
      [EmotionType.RELAXED]: '放松舒适',
      [EmotionType.BORED]: '无聊乏味',
      [EmotionType.NEUTRAL]: '平静中性'
    };
    return descriptions[emotionType] || '未知情感';
  }

  /**
   * 分析文本情感的便捷方法
   */
  analyzeText(text: string): EmotionAnalysisResult {
    return this.analyzeMessageEmotion(text);
  }
} 