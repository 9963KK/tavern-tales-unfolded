import { EmotionalMemory, EmotionalState } from './emotion';

export interface ModelConfig {
  baseUrl?: string;
  apiKey?: string;
  modelName?: string;
  prompt?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

export interface AICharacter {
  id: string;
  name: string;
  avatarColor: string; // Tailwind color class, e.g., 'bg-red-500'
  placeholderIcon?: string; // URL or path to an icon if we use images later
  greeting: string;
  responses: string[]; // A list of possible responses
  modelConfig?: ModelConfig; // New field for model configuration
  
  // 个人记忆系统字段
  emotionalMemory?: EmotionalMemory; // 情感记忆
  lastSpeakTime?: Date; // 最后发言时间（用于发言冷却机制）
  
  // 自然发言机制v2.0属性
  personality?: {
    extroversion: number;     // 外向性 [0, 1]
    curiosity: number;        // 好奇心 [0, 1] 
    talkativeness: number;    // 健谈程度 [0, 1]
    reactivity: number;       // 反应敏锐度 [0, 1]
  };
  interests?: string[];       // 兴趣爱好列表
  speakingStyle?: 'proactive' | 'reactive' | 'observant'; // 发言风格
  socialRole?: 'host' | 'entertainer' | 'observer' | 'advisor'; // 社交角色
  emotionalState?: number;    // 基础情绪状态 [-1, 1]
}

export interface Message {
  id: string;
  sender: string; // 'Player' or AICharacter.name
  text: string;
  isPlayer: boolean;
  timestamp: Date;
  avatarColor?: string; // For AI messages
  
  // 情感分析相关字段
  emotionAnalysisResult?: any; // 将在后续步骤中定义具体类型
}

