import { Message, AICharacter } from '@/types/tavern';

/**
 * 对话提示词增强器
 * 专门处理对话连贯性和剧情推进的提示词生成
 */
export class ConversationPromptEnhancer {
  
  /**
   * 生成连贯性增强提示词
   */
  generateCoherencePrompt(messages: Message[], character: AICharacter): string {
    const recentMessages = this.getRecentContext(messages, 3);
    const lastMessage = messages[messages.length - 1];
    
    let prompt = `\n=== 对话连贯性要求 ===\n`;
    
    // 添加上下文信息
    if (recentMessages.length > 0) {
      prompt += `最近的对话内容：\n`;
      recentMessages.forEach((msg, index) => {
        const speaker = msg.isPlayer ? '玩家' : msg.sender;
        prompt += `${index + 1}. ${speaker}: ${msg.text}\n`;
      });
      prompt += `\n`;
    }
    
    // 连贯性指导
    if (lastMessage) {
      const lastSpeaker = lastMessage.isPlayer ? '玩家' : lastMessage.sender;
      prompt += `重要：你必须直接回应${lastSpeaker}刚才说的话："${lastMessage.text}"\n`;
    }
    
    prompt += `对话要求：\n`;
    prompt += `• 仔细理解上述对话的话题和氛围\n`;
    prompt += `• 你的回复要与前面的内容形成自然连接\n`;
    prompt += `• 不要重复已经说过的信息\n`;
    prompt += `• 如果合适，主动推进话题或提出新想法\n`;
    prompt += `=== 对话连贯性要求结束 ===\n\n`;
    
    return prompt;
  }
  
  /**
   * 生成剧情推进提示词
   */
  generateStoryProgressPrompt(character: AICharacter): string {
    let prompt = `=== 剧情推进指导 ===\n`;
    
    // 基础剧情推进要求
    prompt += `你需要通过对话推动故事发展：\n`;
    prompt += `• 主动提出具体建议："我们去..."、"不如..."、"我建议..."\n`;
    prompt += `• 提供新的信息、线索或观点\n`;
    prompt += `• 通过行为描述增强场景感\n`;
    prompt += `• 每次发言都要包含至少一个新的发展点\n\n`;
    
    // 根据角色类型调整策略
    const role = character.socialRole;
    if (role === 'host') {
      prompt += `作为主人，你要：\n`;
      prompt += `• 关心客人的需求和想法\n`;
      prompt += `• 主动介绍有趣的地方或事物\n`;
      prompt += `• 营造温馨的酒馆氛围\n\n`;
    } else if (role === 'entertainer') {
      prompt += `作为娱乐者，你要：\n`;
      prompt += `• 用故事、歌曲或表演活跃气氛\n`;
      prompt += `• 引导话题走向有趣的方向\n`;
      prompt += `• 用生动的表达吸引大家注意\n\n`;
    } else if (role === 'observer') {
      prompt += `作为观察者，你要：\n`;
      prompt += `• 提供独特的见解和观察\n`;
      prompt += `• 在关键时刻给出重要信息\n`;
      prompt += `• 用简洁但深刻的话推动思考\n\n`;
    } else {
      prompt += `作为顾客，你要：\n`;
      prompt += `• 分享自己的经历和想法\n`;
      prompt += `• 对他人的话题表现出兴趣\n`;
      prompt += `• 提出问题或建议\n\n`;
    }
    
    prompt += `=== 剧情推进指导结束 ===\n\n`;
    
    return prompt;
  }
  
  /**
   * 生成格式要求提示词
   */
  generateFormatPrompt(): string {
    return `=== 回复格式要求 ===
请按以下格式回复：
1. 对话内容（1-2句话，直接自然）
2. 行为描述（用*动作*或（表情/心理）格式）

示例：
"我觉得这个想法很有趣。" *眼睛亮了起来，身体微微前倾*
"真的吗？" （显得有些惊讶，停下了手中的动作）

避免：
• 长篇大论（超过50字）
• 重复别人刚说过的话
• 纯粹的感叹而没有实质内容
=== 回复格式要求结束 ===

`;
  }
  
  /**
   * 检查对话流的连贯性
   */
  checkConversationFlow(messages: Message[]): string {
    if (messages.length < 2) return '';
    
    const lastTwo = messages.slice(-2);
    const [secondLast, last] = lastTwo;
    
    // 检查是否有突然的话题跳转
    if (secondLast && last) {
      const lastText = last.text.toLowerCase();
      const secondLastText = secondLast.text.toLowerCase();
      
      // 简单的关键词匹配检查
      const hasConnectionWords = [
        '而且', '另外', '不过', '但是', '所以', '因此', '那么', '那', '这',
        '关于', '对于', '刚才', '刚刚', '你说', '我觉得', '我想', '说到'
      ].some(word => lastText.includes(word));
      
      if (!hasConnectionWords && Math.random() > 0.7) {
        return `\n注意：确保你的回复与刚才的话题有自然的连接，可以用"关于你刚才说的..."、"说到这个..."等方式建立联系。\n`;
      }
    }
    
    return '';
  }
  
  /**
   * 生成完整的增强提示词（包含对话流检查）
   */
  generateFullEnhancedPrompt(messages: Message[], character: AICharacter): string {
    const coherencePrompt = this.generateCoherencePrompt(messages, character);
    const storyPrompt = this.generateStoryProgressPrompt(character);
    const formatPrompt = this.generateFormatPrompt();
    const flowCheck = this.checkConversationFlow(messages);
    
    return coherencePrompt + storyPrompt + formatPrompt + flowCheck;
  }
  
  /**
   * 获取最近的对话上下文
   */
  private getRecentContext(messages: Message[], count: number): Message[] {
    if (messages.length === 0) return [];
    
    // 获取最近的几条消息，但确保包含不同说话者的内容
    const recent = messages.slice(-count);
    return recent;
  }
  
  /**
   * 检查是否需要特别强调某个话题
   */
  checkTopicContinuity(messages: Message[], character: AICharacter): string {
    if (messages.length < 2) return '';
    
    const lastMessage = messages[messages.length - 1];
    const interests = character.interests || [];
    
    // 检查最后一条消息是否提到了角色感兴趣的话题
    const mentionedInterests = interests.filter(interest => 
      lastMessage.text.includes(interest)
    );
    
    if (mentionedInterests.length > 0) {
      return `\n特别注意：刚才的话题涉及到你感兴趣的"${mentionedInterests.join('、')}"，你应该表现出更多的兴趣和参与感。\n`;
    }
    
    return '';
  }
}

// 导出单例实例
export const conversationEnhancer = new ConversationPromptEnhancer(); 