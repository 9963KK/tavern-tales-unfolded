// 多响应执行器 - 支持同时显示界面
import { AICharacter, Message } from '@/types/tavern';
import { MultiResponsePlan, MultiResponseConfig } from './multiResponseEvaluator';
import { fetchAIResponse } from '@/data/modelDefaults';

export interface MultiResponseResult {
  responses: { 
    characterId: string; 
    response: string; 
    timestamp: Date;
    tokenUsage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
  }[];
  totalDuration: number;
  success: boolean;
  errors: string[];
}

/**
 * 执行多角色同时响应
 * @param plan 多响应计划
 * @param characters 角色列表
 * @param messages 对话历史
 * @param playerMessage 玩家消息
 * @param config 配置
 * @param onProgress 进度回调
 * @returns 响应结果
 */
export async function executeMultiAIResponse(
  plan: MultiResponsePlan,
  characters: AICharacter[],
  messages: Message[],
  playerMessage: string,
  config: MultiResponseConfig,
  onProgress?: (completed: number, total: number, currentCharacter?: string) => void
): Promise<MultiResponseResult> {
  
  console.log('🎭 开始执行多角色响应...');
  console.log(`📋 响应者: ${plan.selectedResponders.map(r => r.characterName).join(', ')}`);
  
  const startTime = Date.now();
  const responses: MultiResponseResult['responses'] = [];
  const errors: string[] = [];

  // 如果使用同时显示模式，并行获取所有响应
  if (config.simultaneousDisplay && plan.selectedResponders.length > 1) {
    console.log('🎬 使用同时显示模式，并行获取响应...');
    
    const responsePromises = plan.selectedResponders.map(async (responder, index) => {
      try {
        const character = characters.find(c => c.id === responder.characterId);
        if (!character) {
          throw new Error(`找不到角色: ${responder.characterId}`);
        }

        onProgress?.(index, plan.selectedResponders.length, character.name);

        const { response, tokenUsage } = await fetchAIResponse(
          character,
          [...messages, {
            id: 'temp_player_msg',
            sender: '玩家',
            text: playerMessage,
            isPlayer: true,
            timestamp: new Date()
          }]
        );

        return {
          characterId: responder.characterId,
          response,
          timestamp: new Date(),
          tokenUsage
        };
      } catch (error) {
        console.error(`角色 ${responder.characterName} 响应失败:`, error);
        errors.push(`${responder.characterName}: ${error}`);
        return null;
      }
    });

    // 等待所有响应完成
    const results = await Promise.allSettled(responsePromises);
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        responses.push(result.value);
      }
      onProgress?.(index + 1, plan.selectedResponders.length);
    });
    
  } else {
    // 传统串行模式
    console.log('📝 使用传统串行模式，依次获取响应...');
    
    for (let i = 0; i < plan.selectedResponders.length; i++) {
      const responder = plan.selectedResponders[i];
      
      try {
        const character = characters.find(c => c.id === responder.characterId);
        if (!character) {
          throw new Error(`找不到角色: ${responder.characterId}`);
        }

        onProgress?.(i, plan.selectedResponders.length, character.name);

        const { response, tokenUsage } = await fetchAIResponse(
          character,
          [...messages, {
            id: 'temp_player_msg',
            sender: '玩家',
            text: playerMessage,
            isPlayer: true,
            timestamp: new Date()
          }]
        );

        responses.push({
          characterId: responder.characterId,
          response,
          timestamp: new Date(),
          tokenUsage
        });

        // 串行模式需要间隔
        if (i < plan.selectedResponders.length - 1) {
          await new Promise(resolve => setTimeout(resolve, config.responseInterval));
        }

      } catch (error) {
        console.error(`角色 ${responder.characterName} 响应失败:`, error);
        errors.push(`${responder.characterName}: ${error}`);
      }
    }
  }

  const totalDuration = Date.now() - startTime;
  const success = responses.length > 0;

  console.log(`✅ 多角色响应完成: ${responses.length}/${plan.selectedResponders.length} 成功`);
  console.log(`⏱️ 总耗时: ${totalDuration}ms`);

  return {
    responses,
    totalDuration,
    success,
    errors
  };
}

/**
 * 检查是否应该触发多响应
 */
export function shouldTriggerMultiResponse(
  plan: MultiResponsePlan,
  config: MultiResponseConfig
): boolean {
  return (
    config.enableMultiResponse &&
    plan.shouldEnableMultiResponse &&
    plan.selectedResponders.length > 1
  );
}

/**
 * 格式化多响应结果为聊天消息
 */
export function formatMultiResponseAsMessages(
  result: MultiResponseResult,
  characters: AICharacter[]
): Message[] {
  return result.responses.map((responseData, index) => {
    const character = characters.find(c => c.id === responseData.characterId);
    
    return {
      id: `multi_response_${responseData.characterId}_${responseData.timestamp.getTime()}`,
      sender: character?.name || '未知角色',
      text: responseData.response,
      isPlayer: false,
      timestamp: responseData.timestamp,
      isMultiResponse: true,
      multiResponseIndex: index,
      multiResponseTotal: result.responses.length
    };
  });
} 