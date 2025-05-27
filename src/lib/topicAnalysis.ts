// 主题相关性分析服务
import { Message, AICharacter } from '@/types/tavern';

export interface TopicRelevanceResult {
  characterId: string;
  relevanceScore: number; // 0-1之间
  reasoningBrief: string; // 简短推理说明
}

export interface TopicAnalysisConfig {
  baseUrl: string;
  apiKey: string;
  modelName: string;
}

/**
 * 分析最近对话的主题内容
 * @param messages 最近的对话消息（通常是最后5-8条）
 * @returns 主题总结字符串
 */
export function extractRecentTopics(messages: Message[]): string {
  if (messages.length === 0) return '暂无对话内容';
  
  // 取最近5条消息进行主题分析
  const recentMessages = messages.slice(-5);
  const topicContext = recentMessages
    .map(msg => `${msg.sender}: ${msg.text}`)
    .join('\n');
    
  return topicContext;
}

/**
 * 使用AI模型分析主题相关性
 * @param topicContext 对话主题上下文
 * @param character 要分析的角色
 * @param config API配置
 * @returns 相关性分数和推理
 */
export async function analyzeTopicRelevance(
  topicContext: string,
  character: AICharacter,
  config: TopicAnalysisConfig
): Promise<TopicRelevanceResult> {
  try {
    const interests = character.interests || [];
    const personality = character.personality || {
      extroversion: 0.5,
      curiosity: 0.5,
      talkativeness: 0.5,
      reactivity: 0.5
    };

    // 构建分析提示词
    const analysisPrompt = `你是一个角色行为分析专家。请分析以下角色对当前对话主题的兴趣程度。

角色信息：
- 姓名：${character.name}
- 兴趣领域：${interests.length > 0 ? interests.join(', ') : '未指定'}
- 好奇心程度：${personality.curiosity} (0-1)
- 反应敏感度：${personality.reactivity} (0-1)

当前对话主题：
${topicContext}

请分析这个角色对当前话题的兴趣程度，返回以下格式的JSON响应：
{
  "relevanceScore": 0.75,
  "reasoningBrief": "简短说明为什么这个分数合适"
}

评分标准：
- 0.0-0.2: 完全不感兴趣，话题与角色背景无关
- 0.3-0.4: 稍有兴趣，但不是主要关注点  
- 0.5-0.6: 中等兴趣，会适度参与
- 0.7-0.8: 很感兴趣，积极参与讨论
- 0.9-1.0: 极度感兴趣，这是角色的核心领域

只返回JSON，不要其他内容。`;

    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.modelName,
        messages: [
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        temperature: 0.1, // 保持分析的一致性
        max_tokens: 150,   // 限制token消耗
        response_format: { type: "json_object" } // 确保返回JSON格式
      }),
    });

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status}`);
    }

    const data = await response.json();
    const resultText = data.choices[0]?.message?.content;
    
    if (!resultText) {
      throw new Error('API返回内容为空');
    }

    // 使用安全的JSON解析
    const { safeParseValidatedJSON } = await import('@/utils/jsonUtils');
    const result = safeParseValidatedJSON(
      resultText, 
      ['relevanceScore'], 
      { relevanceScore: 0.3, reasoningBrief: '解析失败，使用默认分数' }
    );
    
    // 验证结果格式
    if (typeof result.relevanceScore !== 'number' || 
        result.relevanceScore < 0 || 
        result.relevanceScore > 1) {
      throw new Error('返回的相关性分数格式不正确');
    }

    return {
      characterId: character.id,
      relevanceScore: Math.min(Math.max(result.relevanceScore, 0), 1), // 确保在0-1范围内
      reasoningBrief: result.reasoningBrief || '未提供推理说明'
    };

  } catch (error) {
    console.warn(`⚠️ 主题相关性分析失败 (${character.name}):`, error);
    
    // 回退到简单的关键词匹配分析
    return fallbackTopicAnalysis(topicContext, character);
  }
}

/**
 * 回退的主题分析方法（当API调用失败时使用）
 * @param topicContext 对话主题上下文
 * @param character 角色
 * @returns 基于关键词匹配的相关性结果
 */
function fallbackTopicAnalysis(
  topicContext: string, 
  character: AICharacter
): TopicRelevanceResult {
  const interests = character.interests || [];
  const personality = character.personality || {
    extroversion: 0.5,
    curiosity: 0.5,
    talkativeness: 0.5,
    reactivity: 0.5
  };

  let relevanceScore = 0.1; // 基础分数
  let matchedKeywords: string[] = [];

  // 简单的关键词匹配
  const topicLower = topicContext.toLowerCase();
  
  for (const interest of interests) {
    if (topicLower.includes(interest.toLowerCase())) {
      relevanceScore += 0.3;
      matchedKeywords.push(interest);
    }
  }

  // 基于好奇心的调整
  relevanceScore += personality.curiosity * 0.2;

  // 限制分数范围
  relevanceScore = Math.min(Math.max(relevanceScore, 0), 1);

  const reasoningBrief = matchedKeywords.length > 0 
    ? `匹配兴趣关键词: ${matchedKeywords.join(', ')}`
    : `基于好奇心程度(${personality.curiosity.toFixed(1)})的基础兴趣`;

  return {
    characterId: character.id,
    relevanceScore,
    reasoningBrief
  };
}

/**
 * 批量分析多个角色的主题相关性
 * @param messages 最近的对话消息
 * @param characters 要分析的角色列表
 * @param config API配置
 * @returns 所有角色的相关性分析结果
 */
export async function batchAnalyzeTopicRelevance(
  messages: Message[],
  characters: AICharacter[],
  config: TopicAnalysisConfig
): Promise<TopicRelevanceResult[]> {
  const topicContext = extractRecentTopics(messages);
  
  // 并发分析所有角色，但限制并发数量以控制API调用
  const results: TopicRelevanceResult[] = [];
  
  // 分批处理，每批最多3个角色同时分析
  const batchSize = 3;
  for (let i = 0; i < characters.length; i += batchSize) {
    const batch = characters.slice(i, i + batchSize);
    const batchPromises = batch.map(character => 
      analyzeTopicRelevance(topicContext, character, config)
    );
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }

  return results;
} 