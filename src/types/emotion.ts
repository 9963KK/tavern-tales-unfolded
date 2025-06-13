// 基础情感类型（基于Russell情感环形模型）
export enum EmotionType {
  EXCITED = 'excited',      // 兴奋（高唤醒+积极）
  HAPPY = 'happy',          // 快乐（中唤醒+积极）
  CALM = 'calm',            // 平静（低唤醒+积极）
  RELAXED = 'relaxed',      // 放松（低唤醒+积极）
  BORED = 'bored',          // 无聊（低唤醒+消极）
  SAD = 'sad',              // 悲伤（低唤醒+消极）
  ANGRY = 'angry',          // 愤怒（高唤醒+消极）
  STRESSED = 'stressed',    // 紧张（高唤醒+消极）
  NEUTRAL = 'neutral'       // 中性
}

// 情感状态接口
export interface EmotionalState {
  type: EmotionType;
  intensity: number;        // 强度 [0, 1]
  valence: number;          // 效价 [-1, 1] (消极到积极)
  arousal: number;          // 唤醒度 [-1, 1] (平静到兴奋)
  timestamp: Date;
  description: string;      // 人类可读的描述
  triggers: string[];       // 触发因素
}

// 情感变化事件
export interface EmotionChangeEvent {
  characterId: string;
  previousState: EmotionalState;
  newState: EmotionalState;
  trigger: string;
  timestamp: Date;
}

// 情感关键词映射
export interface EmotionKeywords {
  [key: string]: string[];
}

// 情感分析结果
export interface EmotionAnalysisResult {
  detectedEmotion: EmotionType;
  confidence: number;       // 置信度 [0, 1]
  keywords: string[];       // 检测到的关键词
  intensity: number;        // 计算出的强度
  valence: number;          // 计算出的效价
  arousal: number;          // 计算出的唤醒度
}

// 情感配置选项
export interface EmotionConfig {
  decayRate: number;        // 情感衰减速率
  contagionStrength: number; // 情感传染强度
  personalityInfluence: number; // 个性影响强度
  baselineReturnRate: number; // 基线回归速率
}

// 默认情感配置
export const DEFAULT_EMOTION_CONFIG: EmotionConfig = {
  decayRate: 0.1,
  contagionStrength: 0.3,
  personalityInfluence: 0.5,
  baselineReturnRate: 0.05
};

// 创建默认情感状态的工具函数
export function createDefaultEmotionalState(type: EmotionType = EmotionType.NEUTRAL): EmotionalState {
  const emotionMap = {
    [EmotionType.EXCITED]: { valence: 0.8, arousal: 0.8, description: '兴奋激动' },
    [EmotionType.HAPPY]: { valence: 0.6, arousal: 0.2, description: '开心愉快' },
    [EmotionType.CALM]: { valence: 0.3, arousal: -0.5, description: '平静安详' },
    [EmotionType.RELAXED]: { valence: 0.4, arousal: -0.7, description: '放松舒适' },
    [EmotionType.BORED]: { valence: -0.3, arousal: -0.6, description: '无聊乏味' },
    [EmotionType.SAD]: { valence: -0.6, arousal: -0.4, description: '悲伤难过' },
    [EmotionType.ANGRY]: { valence: -0.7, arousal: 0.7, description: '愤怒生气' },
    [EmotionType.STRESSED]: { valence: -0.5, arousal: 0.6, description: '紧张焦虑' },
    [EmotionType.NEUTRAL]: { valence: 0, arousal: 0, description: '平静中性' }
  };

  const config = emotionMap[type];
  
  return {
    type,
    intensity: 0.5,
    valence: config.valence,
    arousal: config.arousal,
    timestamp: new Date(),
    description: config.description,
    triggers: []
  };
} 