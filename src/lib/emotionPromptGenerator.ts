import { EmotionType, EmotionalState } from '@/types/emotion';
import { AICharacter } from '@/types/tavern';

/**
 * 情感风格提示词生成器
 * 根据角色的情感状态生成相应的对话风格指导
 */
export class EmotionPromptGenerator {
  
  // 情感风格模板
  private readonly EMOTION_STYLE_PROMPTS = {
    [EmotionType.HAPPY]: {
      style: "用更加愉快、积极的语调回应",
      behaviors: [
        "语言更加轻松活泼",
        "可能会使用一些积极的语气词",
        "表现出对话题的兴趣和热情",
        "回应更加主动和友善"
      ],
      avoid: ["过于严肃的表达", "消极的词汇"]
    },
    
    [EmotionType.EXCITED]: {
      style: "用更加热情、活跃的语调回应",
      behaviors: [
        "语言充满活力和激情",
        "可能会使用感叹号和强调词",
        "表现出强烈的兴趣和参与感",
        "回应更加积极主动"
      ],
      avoid: ["平淡的表达", "过于冷静的语调"]
    },
    
    [EmotionType.SAD]: {
      style: "用更加低沉、简短的语调回应",
      behaviors: [
        "语言更加简洁",
        "可能会表现出一些忧郁或沉思",
        "回应相对被动",
        "语气较为平缓"
      ],
      avoid: ["过于兴奋的表达", "强烈的情感波动"]
    },
    
    [EmotionType.ANGRY]: {
      style: "用更加直接、强硬的语调回应",
      behaviors: [
        "语言更加直接和坚定",
        "可能会表现出一些不耐烦",
        "回应更加简洁有力",
        "避免过多的客套话"
      ],
      avoid: ["过于温和的表达", "过多的解释"]
    },
    
    [EmotionType.STRESSED]: {
      style: "用更加紧张、急促的语调回应",
      behaviors: [
        "语言可能略显急促",
        "表现出一些担忧或不安",
        "回应可能包含一些犹豫",
        "更关注问题和困难"
      ],
      avoid: ["过于轻松的态度", "过分自信的表达"]
    },
    
    [EmotionType.CALM]: {
      style: "用平静、稳定的语调回应",
      behaviors: [
        "语言平和而稳定",
        "表现出内心的宁静",
        "回应深思熟虑",
        "语气温和而理性"
      ],
      avoid: ["过于激动的表达", "急躁的语调"]
    },
    
    [EmotionType.RELAXED]: {
      style: "用轻松、悠闲的语调回应",
      behaviors: [
        "语言更加随意和自然",
        "表现出放松的状态",
        "回应不急不躁",
        "可能会使用一些轻松的表达"
      ],
      avoid: ["紧张的语调", "过于正式的表达"]
    },
    
    [EmotionType.BORED]: {
      style: "用略显无聊、简短的语调回应",
      behaviors: [
        "语言相对简洁",
        "可能表现出一些漫不经心",
        "回应较为被动",
        "缺乏强烈的情感色彩"
      ],
      avoid: ["过于热情的表达", "长篇大论"]
    },
    
    [EmotionType.NEUTRAL]: {
      style: "保持正常、平衡的语调",
      behaviors: [
        "语言自然平衡",
        "既不过于兴奋也不过于消沉",
        "回应适中",
        "保持角色的基本特征"
      ],
      avoid: ["极端的情感表达"]
    }
  };

  // 强度修饰词
  private readonly INTENSITY_MODIFIERS = {
    low: "轻微地",
    medium: "明显地", 
    high: "强烈地",
    extreme: "极其"
  };

  /**
   * 生成基于情感状态的提示词
   */
  generateEmotionPrompt(character: AICharacter): string {
    if (!character.currentEmotionalState) {
      return "";
    }

    const emotion = character.currentEmotionalState;
    const styleConfig = this.EMOTION_STYLE_PROMPTS[emotion.type];
    
    if (!styleConfig) {
      return "";
    }

    // 根据强度确定修饰词
    const intensityLevel = this.getIntensityLevel(emotion.intensity);
    const intensityModifier = this.INTENSITY_MODIFIERS[intensityLevel];

    // 构建情感状态描述
    const emotionDescription = `当前你${intensityModifier}感到${emotion.description}`;
    
    // 构建风格指导
    const styleGuidance = `请${styleConfig.style}。`;
    
    // 构建行为指导
    const behaviorGuidance = styleConfig.behaviors.length > 0 
      ? `具体表现为：${styleConfig.behaviors.join('；')}。`
      : "";
    
    // 构建避免指导
    const avoidGuidance = styleConfig.avoid.length > 0
      ? `请避免：${styleConfig.avoid.join('；')}。`
      : "";

    // 添加个性化调整
    const personalityAdjustment = this.generatePersonalityAdjustment(character, emotion);

    return [
      `【情感状态】${emotionDescription}`,
      `【风格指导】${styleGuidance}`,
      behaviorGuidance && `【行为表现】${behaviorGuidance}`,
      avoidGuidance && `【注意避免】${avoidGuidance}`,
      personalityAdjustment && `【个性调整】${personalityAdjustment}`
    ].filter(Boolean).join('\n');
  }

  /**
   * 生成情感触发因素的上下文
   */
  generateEmotionContext(character: AICharacter): string {
    if (!character.currentEmotionalState || character.currentEmotionalState.triggers.length === 0) {
      return "";
    }

    const triggers = character.currentEmotionalState.triggers;
    const recentTriggers = triggers.slice(-3); // 最近3个触发因素

    return `【情感触发】最近让你产生这种情感的原因：${recentTriggers.join('、')}`;
  }

  /**
   * 生成情感历史上下文
   */
  generateEmotionHistory(character: AICharacter): string {
    if (!character.emotionalHistory || character.emotionalHistory.length === 0) {
      return "";
    }

    const recentHistory = character.emotionalHistory.slice(-2); // 最近2个情感状态
    const historyDesc = recentHistory.map(state => 
      `${state.description}(${this.getIntensityLevel(state.intensity)})`
    ).join(' → ');

    return `【情感变化】你的情感经历了：${historyDesc} → ${character.currentEmotionalState?.description}`;
  }

  /**
   * 生成完整的情感增强提示词
   */
  generateFullEmotionPrompt(character: AICharacter): string {
    const emotionPrompt = this.generateEmotionPrompt(character);
    const emotionContext = this.generateEmotionContext(character);
    const emotionHistory = this.generateEmotionHistory(character);

    const parts = [emotionPrompt, emotionContext, emotionHistory].filter(Boolean);
    
    if (parts.length === 0) {
      return "";
    }

    return `\n\n=== 情感状态指导 ===\n${parts.join('\n')}\n=== 情感状态指导结束 ===\n`;
  }

  // 私有辅助方法

  private getIntensityLevel(intensity: number): 'low' | 'medium' | 'high' | 'extreme' {
    if (intensity < 0.3) return 'low';
    if (intensity < 0.6) return 'medium';
    if (intensity < 0.9) return 'high';
    return 'extreme';
  }

  private generatePersonalityAdjustment(character: AICharacter, emotion: EmotionalState): string {
    if (!character.personality) return "";

    const adjustments: string[] = [];
    const personality = character.personality;

    // 外向性调整
    if (personality.extroversion > 0.7) {
      adjustments.push("作为外向的角色，你的情感表达会更加外显和直接");
    } else if (personality.extroversion < 0.3) {
      adjustments.push("作为内向的角色，你的情感表达会更加内敛和含蓄");
    }

    // 反应敏感度调整
    if (personality.reactivity > 0.7) {
      adjustments.push("你对情感变化很敏感，容易受到对话氛围影响");
    }

    // 健谈程度调整
    if (personality.talkativeness > 0.7 && emotion.intensity > 0.5) {
      adjustments.push("在这种情感状态下，你可能会比平时更愿意表达");
    } else if (personality.talkativeness < 0.3 && emotion.intensity > 0.5) {
      adjustments.push("即使有强烈情感，你仍然倾向于简洁的表达");
    }

    // 社交角色调整
    if (character.socialRole) {
      switch (character.socialRole) {
        case 'host':
          adjustments.push("作为主人，即使在当前情感状态下也要保持对客人的关照");
          break;
        case 'entertainer':
          adjustments.push("作为娱乐者，你的情感表达会更加戏剧化和吸引人");
          break;
        case 'observer':
          adjustments.push("作为观察者，你会更多地从旁观角度表达情感");
          break;
        case 'advisor':
          adjustments.push("作为顾问，即使有情感波动也要保持一定的理性");
          break;
      }
    }

    return adjustments.length > 0 ? adjustments.join('；') : "";
  }
}

// 导出单例实例
export const emotionPromptGenerator = new EmotionPromptGenerator(); 