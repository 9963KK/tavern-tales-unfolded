import { Message } from '../types/message';
import { AICharacter } from '../types/character';
import { contextManager, processContextForAI, ContextProcessingResult } from './contextManager';
import { modelDefaults } from '../data/modelDefaults';

// 增强AI响应配置
export interface EnhancedAIResponseConfig {
  // 上下文管理配置
  enableContextPruning: boolean;
  maxContextTokens: number;
  enablePersonalization: boolean;
  
  // 调试配置
  debugMode: boolean;
  logContextInfo: boolean;
  
  // 回退配置
  fallbackToOriginal: boolean;
  fallbackThreshold: number;
  
  // 性能配置
  enableCaching: boolean;
  timeout: number;
}

// 增强AI响应结果
export interface EnhancedAIResponseResult {
  success: boolean;
  response: string | null;
  
  // 上下文处理信息
  contextInfo?: {
    originalMessageCount: number;
    processedMessageCount: number;
    tokenReduction: number;
    processingTime: number;
    strategy: string;
    usedPersonalization: boolean;
  };
  
  // Token使用信息
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  
  // 性能信息
  performanceInfo?: {
    totalTime: number;
    contextProcessingTime: number;
    aiResponseTime: number;
    cacheHit: boolean;
  };
  
  // 错误信息
  error?: string;
  fallbackUsed?: boolean;
}

// 默认配置
const defaultConfig: EnhancedAIResponseConfig = {
  enableContextPruning: true,
  maxContextTokens: 4000,
  enablePersonalization: true,
  debugMode: false,
  logContextInfo: true,
  fallbackToOriginal: true,
  fallbackThreshold: 0.5,
  enableCaching: true,
  timeout: 30000
};

/**
 * 增强版AI响应函数 - 集成动态上下文裁剪系统
 */
export async function fetchEnhancedAIResponse(
  character: AICharacter,
  messages: Message[],
  updateTokenUsageFn?: (characterId: string, characterName: string, inputTokens: number, outputTokens: number, type: string) => void,
  estimateTokensFn?: (text: string) => number,
  config: Partial<EnhancedAIResponseConfig> = {}
): Promise<EnhancedAIResponseResult> {
  const startTime = Date.now();
  const finalConfig = { ...defaultConfig, ...config };
  
  try {
    console.log(`🚀 开始增强AI响应 - ${character.name}`);
    
    // 第一步：上下文处理
    let processedMessages = messages;
    let contextResult: ContextProcessingResult | null = null;
    
    if (finalConfig.enableContextPruning && messages.length > 0) {
      const contextStartTime = Date.now();
      
      try {
        contextResult = await processContextForAI(
          messages,
          character,
          undefined, // 当前话题可以从消息中推断
          {
            maxTokens: finalConfig.maxContextTokens,
            enablePersonalization: finalConfig.enablePersonalization,
            debugMode: finalConfig.debugMode
          }
        );
        
        if (contextResult.success) {
          processedMessages = contextResult.prunedMessages;
          
          if (finalConfig.logContextInfo) {
            console.log(`🧠 上下文裁剪完成 - ${character.name}:`, {
              原始消息数: contextResult.originalMessageCount,
              处理后消息数: contextResult.finalMessageCount,
              Token减少: `${contextResult.tokenReduction.toFixed(1)}%`,
              策略: contextResult.strategy,
              处理时间: `${contextResult.processingTime}ms`
            });
          }
        } else {
          console.warn(`⚠️ 上下文处理失败 - ${character.name}:`, contextResult.error);
          if (finalConfig.fallbackToOriginal) {
            processedMessages = messages;
          }
        }
      } catch (error) {
        console.error(`❌ 上下文处理异常 - ${character.name}:`, error);
        if (finalConfig.fallbackToOriginal) {
          processedMessages = messages;
        } else {
          throw error;
        }
      }
    }
    
    // 第二步：生成AI响应
    const aiResponseStartTime = Date.now();
    const aiResult = await generateAIResponse(character, processedMessages, finalConfig);
    const aiResponseTime = Date.now() - aiResponseStartTime;
    
    if (!aiResult.success) {
      throw new Error(aiResult.error || 'AI响应生成失败');
    }
    
    // 第三步：记录Token使用
    if (aiResult.tokenUsage && updateTokenUsageFn) {
      updateTokenUsageFn(
        character.id,
        character.name,
        aiResult.tokenUsage.promptTokens,
        aiResult.tokenUsage.completionTokens,
        'enhanced-character'
      );
    }
    
    const totalTime = Date.now() - startTime;
    
    // 构建结果
    const result: EnhancedAIResponseResult = {
      success: true,
      response: aiResult.response,
      contextInfo: contextResult ? {
        originalMessageCount: contextResult.originalMessageCount,
        processedMessageCount: contextResult.finalMessageCount,
        tokenReduction: contextResult.tokenReduction,
        processingTime: contextResult.processingTime,
        strategy: contextResult.strategy,
        usedPersonalization: contextResult.metadata.usedPersonalization
      } : undefined,
      tokenUsage: aiResult.tokenUsage,
      performanceInfo: {
        totalTime,
        contextProcessingTime: contextResult?.processingTime || 0,
        aiResponseTime,
        cacheHit: false // TODO: 实现缓存检测
      }
    };
    
    if (finalConfig.debugMode) {
      console.log(`✅ 增强AI响应完成 - ${character.name}:`, {
        总耗时: `${totalTime}ms`,
        上下文处理: `${result.performanceInfo?.contextProcessingTime}ms`,
        AI响应: `${aiResponseTime}ms`,
        使用个性化: result.contextInfo?.usedPersonalization,
        Token减少: result.contextInfo ? `${result.contextInfo.tokenReduction.toFixed(1)}%` : '未启用'
      });
    }
    
    return result;
    
  } catch (error) {
    console.error(`❌ 增强AI响应失败 - ${character.name}:`, error);
    
    // 回退到原始实现
    if (finalConfig.fallbackToOriginal) {
      console.log(`🔄 回退到原始AI响应 - ${character.name}`);
      
      try {
        const fallbackResult = await generateOriginalAIResponse(character, messages, estimateTokensFn, updateTokenUsageFn);
        
        return {
          success: true,
          response: fallbackResult.response,
          performanceInfo: {
            totalTime: Date.now() - startTime,
            contextProcessingTime: 0,
            aiResponseTime: fallbackResult.responseTime,
            cacheHit: false
          },
          tokenUsage: fallbackResult.tokenUsage,
          fallbackUsed: true,
          error: `增强响应失败，使用回退: ${error}`
        };
      } catch (fallbackError) {
        return {
          success: false,
          response: null,
          error: `增强响应和回退都失败: ${error}, ${fallbackError}`,
          performanceInfo: {
            totalTime: Date.now() - startTime,
            contextProcessingTime: 0,
            aiResponseTime: 0,
            cacheHit: false
          }
        };
      }
    } else {
      return {
        success: false,
        response: null,
        error: error instanceof Error ? error.message : String(error),
        performanceInfo: {
          totalTime: Date.now() - startTime,
          contextProcessingTime: 0,
          aiResponseTime: 0,
          cacheHit: false
        }
      };
    }
  }
}

/**
 * 生成AI响应
 */
async function generateAIResponse(
  character: AICharacter,
  messages: Message[],
  config: EnhancedAIResponseConfig
): Promise<{
  success: boolean;
  response: string | null;
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  error?: string;
}> {
  const modelConfig = {
    baseUrl: character.modelConfig?.baseUrl || modelDefaults.baseUrl,
    apiKey: character.modelConfig?.apiKey || modelDefaults.apiKey,
    modelName: character.modelConfig?.modelName || modelDefaults.modelName,
    prompt: character.modelConfig?.prompt || '',
    temperature: character.modelConfig?.temperature ?? 0.7,
    maxTokens: character.modelConfig?.maxTokens ?? 2048,
    topP: character.modelConfig?.topP ?? 1.0,
    frequencyPenalty: character.modelConfig?.frequencyPenalty ?? 0.0,
    presencePenalty: character.modelConfig?.presencePenalty ?? 0.0,
  };
  
  if (!modelConfig.baseUrl || !modelConfig.apiKey || !modelConfig.modelName) {
    throw new Error('模型配置不完整');
  }
  
  // 构建请求消息
  const requestMessages = [
    ...(modelConfig.prompt ? [{ role: 'system', content: modelConfig.prompt }] : []),
    ...messages.map(m => ({
      role: m.isPlayer ? 'user' : 'assistant',
      content: m.text || m.content || ''
    }))
  ];
  
  const requestBody = {
    model: modelConfig.modelName,
    messages: requestMessages,
    temperature: modelConfig.temperature,
    max_tokens: modelConfig.maxTokens,
    top_p: modelConfig.topP,
    frequency_penalty: modelConfig.frequencyPenalty,
    presence_penalty: modelConfig.presencePenalty,
  };
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout);
    
    const response = await fetch(modelConfig.baseUrl + '/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${modelConfig.apiKey}`,
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    const responseContent = data.choices?.[0]?.message?.content;
    
    if (!responseContent) {
      throw new Error('API返回内容为空');
    }
    
    return {
      success: true,
      response: responseContent,
      tokenUsage: data.usage ? {
        promptTokens: data.usage.prompt_tokens || 0,
        completionTokens: data.usage.completion_tokens || 0,
        totalTokens: data.usage.total_tokens || 0
      } : undefined
    };
    
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`请求超时 (${config.timeout}ms)`);
    }
    throw error;
  }
}

/**
 * 原始AI响应实现（回退用）
 */
async function generateOriginalAIResponse(
  character: AICharacter,
  messages: Message[],
  estimateTokensFn?: (text: string) => number,
  updateTokenUsageFn?: (characterId: string, characterName: string, inputTokens: number, outputTokens: number, type: string) => void
): Promise<{
  response: string | null;
  responseTime: number;
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}> {
  const startTime = Date.now();
  
  const config = {
    baseUrl: character.modelConfig?.baseUrl || modelDefaults.baseUrl,
    apiKey: character.modelConfig?.apiKey || modelDefaults.apiKey,
    modelName: character.modelConfig?.modelName || modelDefaults.modelName,
    prompt: character.modelConfig?.prompt || '',
    temperature: character.modelConfig?.temperature ?? 0.7,
    maxTokens: character.modelConfig?.maxTokens ?? 2048,
    topP: character.modelConfig?.topP ?? 1.0,
    frequencyPenalty: character.modelConfig?.frequencyPenalty ?? 0.0,
    presencePenalty: character.modelConfig?.presencePenalty ?? 0.0,
  };
  
  if (!config.baseUrl || !config.apiKey || !config.modelName) {
    throw new Error('模型配置不完整');
  }
  
  const requestMessages = [
    ...(config.prompt ? [{ role: 'system', content: config.prompt }] : []),
    ...messages.map(m => ({ 
      role: m.isPlayer ? 'user' : 'assistant', 
      content: m.text || m.content || '' 
    }))
  ];
  
  const requestBody = {
    model: config.modelName,
    messages: requestMessages,
    temperature: config.temperature,
    max_tokens: config.maxTokens,
    top_p: config.topP,
    frequency_penalty: config.frequencyPenalty,
    presence_penalty: config.presencePenalty,
  };

  const res = await fetch(config.baseUrl + '/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });
  
  if (!res.ok) {
    throw new Error(`API请求失败: ${res.status}`);
  }
  
  const data = await res.json();
  const responseContent = data.choices?.[0]?.message?.content || null;
  
  const responseTime = Date.now() - startTime;
  
  // 记录Token使用
  let tokenUsage;
  if (responseContent && updateTokenUsageFn && estimateTokensFn) {
    let inputTokens = data.usage?.prompt_tokens;
    let outputTokens = data.usage?.completion_tokens;
    
    if (!inputTokens || !outputTokens) {
      const inputText = requestMessages.map(m => m.content).join(' ');
      inputTokens = estimateTokensFn(inputText);
      outputTokens = estimateTokensFn(responseContent);
    }
    
    updateTokenUsageFn(character.id, character.name, inputTokens, outputTokens, 'fallback-character');
    
    tokenUsage = {
      promptTokens: inputTokens,
      completionTokens: outputTokens,
      totalTokens: inputTokens + outputTokens
    };
  }
  
  return {
    response: responseContent,
    responseTime,
    tokenUsage
  };
}

/**
 * 初始化增强AI响应系统
 */
export function initializeEnhancedAIResponse(config?: Partial<EnhancedAIResponseConfig>): void {
  if (config) {
    Object.assign(defaultConfig, config);
  }
  
  console.log('🚀 增强AI响应系统已初始化');
  console.log('⚙️ 配置:', {
    启用上下文裁剪: defaultConfig.enableContextPruning,
    最大上下文Token: defaultConfig.maxContextTokens,
    启用个性化: defaultConfig.enablePersonalization,
    调试模式: defaultConfig.debugMode
  });
}

/**
 * 更新增强AI响应配置
 */
export function updateEnhancedAIResponseConfig(config: Partial<EnhancedAIResponseConfig>): void {
  Object.assign(defaultConfig, config);
  console.log('🔧 增强AI响应配置已更新');
}

/**
 * 获取增强AI响应统计信息
 */
export function getEnhancedAIResponseStats() {
  return {
    contextManager: contextManager.getPerformanceStats(),
    processingHistory: contextManager.getProcessingHistory(20)
  };
}

/**
 * 清理增强AI响应缓存
 */
export function clearEnhancedAIResponseCache(): void {
  contextManager.clearCache();
  console.log('🧹 增强AI响应缓存已清理');
}

// 导出便捷函数
export { contextManager, processContextForAI }; 