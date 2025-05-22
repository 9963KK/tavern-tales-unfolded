
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
  },
];

