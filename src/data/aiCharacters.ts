
import { AICharacter } from '@/types/tavern';
// import { User } from 'lucide-react'; // Using a generic user icon, not directly used for text

export const initialAICharacters: AICharacter[] = [
  {
    id: 'thorgar',
    name: '酒保索尔加',
    avatarColor: 'bg-red-700', // Earthy red
    greeting: "欢迎，旅行者。想喝点什么？",
    responses: [
      "嗯，这倒是个有趣的故事。",
      "还是老样子吗？",
      "路上有什么新鲜事吗？",
      "再来一轮？或者来点更带劲的？",
      "小心点，别在我的店里惹麻烦。"
    ],
    // 自然发言机制v2.0属性
    personality: {
      extroversion: 0.8,     // 外向性高，主动与客人交流
      curiosity: 0.7,        // 好奇心强，喜欢听故事
      talkativeness: 0.9,    // 健谈程度高，作为酒保经常说话
      reactivity: 0.8        // 反应敏锐，快速回应客人需求
    },
    interests: ['酒类', '当地新闻', '客人关怀', '酒馆经营', '美食', '旅行见闻'],
    speakingStyle: 'proactive',  // 主动发言风格
    socialRole: 'host',         // 主人角色
    emotionalState: 0.3         // 略微积极的情绪状态
  },
  {
    id: 'elara',
    name: '吟游诗人艾拉',
    avatarColor: 'bg-yellow-500', // Bright yellow for a bard
    greeting: "你好！想听首歌，还是一个故事？",
    responses: [
      "啊，经典之选！",
      "这让我想起了一首关于龙的歌谣...",
      "音乐能抚慰灵魂，你同意吗？",
      "我游历四方，见闻广博。",
      "也许你的冒险经历能谱写成一首好民谣！"
    ],
    // 自然发言机制v2.0属性
    personality: {
      extroversion: 0.9,     // 极高外向性，表演者性格
      curiosity: 0.8,        // 强烈好奇心，收集故事素材
      talkativeness: 0.8,    // 健谈，但会倾听他人故事
      reactivity: 0.7        // 情感丰富，容易被触动
    },
    interests: ['音乐', '故事', '冒险传说', '诗歌', '艺术', '历史', '情感'],
    speakingStyle: 'reactive', // 响应式发言，被故事触发
    socialRole: 'entertainer', // 娱乐者角色
    emotionalState: 0.6        // 积极乐观的情绪
  },
  {
    id: 'mysteriousStranger',
    name: '神秘的陌生人',
    avatarColor: 'bg-indigo-700', // Deep, mysterious color
    greeting: "...",
    responses: [
      "哼。",
      "有些秘密最好还是深埋起来。",
      "阴影中隐藏着许多真相。",
      "我在听。",
      "我们来到这里，都有各自的理由。"
    ],
    // 自然发言机制v2.0属性
    personality: {
      extroversion: 0.2,     // 极度内向，不主动交流
      curiosity: 0.9,        // 极强好奇心，对秘密感兴趣
      talkativeness: 0.3,    // 寡言少语
      reactivity: 0.4        // 反应迟缓，深思熟虑
    },
    interests: ['秘密', '阴谋', '魔法', '古老传说', '神秘事物', '预言', '禁忌知识'],
    speakingStyle: 'observant', // 观察为主，很少主动发言
    socialRole: 'observer',     // 观察者角色
    emotionalState: -0.1        // 略微消极，神秘莫测
  },
];

