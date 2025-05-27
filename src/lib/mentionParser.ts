import { AICharacter } from '@/types/tavern';

// @提及解析结果接口
export interface MentionParseResult {
  originalText: string;
  mentionedCharacters: string[];
  cleanText: string; // 移除@提及后的纯文本
  hasMentions: boolean;
}

/**
 * 解析消息中的@提及
 * 支持格式："@角色名 消息内容" 或 "消息内容 @角色名"
 */
export function parseMentions(text: string, availableCharacters: AICharacter[]): MentionParseResult {
  // 创建角色名的映射，支持精确匹配和模糊匹配
  const characterMap = new Map<string, string>();
  availableCharacters.forEach(char => {
    // 精确匹配
    characterMap.set(char.name, char.name);
    // 去除称呼的简化匹配（如"酒保索尔加" -> "索尔加"）
    const simplifiedName = char.name.replace(/^(酒保|吟游诗人|神秘的)/, '');
    if (simplifiedName !== char.name) {
      characterMap.set(simplifiedName, char.name);
    }
  });

  // 使用正则表达式匹配@提及模式
  // 支持：@角色名、@"角色名"、@《角色名》等格式
  const mentionRegex = /@([^@\s,，。！？；：\n]+)/g;
  const mentions: string[] = [];
  let cleanText = text;

  let match;
  while ((match = mentionRegex.exec(text)) !== null) {
    const mentionedName = match[1].trim();
    
    // 尝试匹配角色名
    const fullCharacterName = findMatchingCharacter(mentionedName, characterMap);
    if (fullCharacterName && !mentions.includes(fullCharacterName)) {
      mentions.push(fullCharacterName);
    }
  }

  // 移除@提及，清理文本
  cleanText = text.replace(mentionRegex, '').trim();
  // 清理多余的空格
  cleanText = cleanText.replace(/\s+/g, ' ').trim();

  return {
    originalText: text,
    mentionedCharacters: mentions,
    cleanText: cleanText || text, // 如果清理后为空，保留原文
    hasMentions: mentions.length > 0
  };
}

/**
 * 查找匹配的角色名（支持模糊匹配）
 */
function findMatchingCharacter(mentionedName: string, characterMap: Map<string, string>): string | null {
  // 精确匹配优先
  if (characterMap.has(mentionedName)) {
    return characterMap.get(mentionedName)!;
  }

  // 模糊匹配：查找包含关键词的角色
  for (const [key, fullName] of characterMap.entries()) {
    if (key.includes(mentionedName) || mentionedName.includes(key)) {
      return fullName;
    }
  }

  return null;
}

/**
 * 生成@提及的提示文本
 */
export function generateMentionHints(availableCharacters: AICharacter[]): string[] {
  return availableCharacters.map(char => `@${char.name}`);
}

/**
 * 验证@提及是否有效
 */
export function validateMention(mentionedName: string, availableCharacters: AICharacter[]): boolean {
  return availableCharacters.some(char => 
    char.name === mentionedName || 
    char.name.includes(mentionedName) ||
    mentionedName.includes(char.name.replace(/^(酒保|吟游诗人|神秘的)/, ''))
  );
} 