import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import SceneHeader from '@/components/tavern/SceneHeader';
import ChatWindow from '@/components/tavern/ChatWindow';
import AvatarBar from '@/components/tavern/AvatarBar';
import InputArea from '@/components/tavern/InputArea';
import CharacterConfigDialog from '@/components/tavern/CharacterConfigDialog';
import { Message, AICharacter, ModelConfig } from '@/types/tavern';
import { initialAICharacters } from '@/data/aiCharacters';
import { v4 as uuidv4 } from 'uuid';
import { Play, Pause, Download, Upload, Settings, MessageSquare, Users, Clock, ChevronDown, ChevronUp, X, RefreshCw, FileText, Zap, Brain, Activity } from 'lucide-react';
import { modelDefaults, sceneAnalysisDefaults } from '@/data/modelDefaults';
import { Button } from '@/components/ui/button';
import SceneAnalysisConfigDialog from '@/components/tavern/SceneAnalysisConfigDialog';
import ModelConfigPanel from '@/components/tavern/ModelConfigPanel';
import CharacterPromptDialog from '@/components/tavern/CharacterPromptDialog';
import HistoryPanel from '@/components/tavern/HistoryPanel';
import SceneEditDialog from '@/components/tavern/SceneEditDialog';

import ContextManagerPanel from '@/components/tavern/ContextManagerPanel';
import { batchAnalyzeTopicRelevance, TopicAnalysisConfig } from '@/lib/topicAnalysis';
import { batchCalculateSpeakingDesire, selectSpeakerByDesire, SpeakingDesireResult } from '@/lib/speakingDesire';
import { 
  evaluateMultipleAIResponses, 
  MultiResponseConfig, 
  defaultMultiResponseConfig,
  shouldExecuteMultiResponse,
  getCharacterResponseOrder
} from '@/lib/multiResponseEvaluator';
import { multiResponseDebugger } from '@/utils/debugMultiResponse';
// 集成动态上下文裁剪系统
import { 
  fetchEnhancedAIResponse,
  initializeEnhancedAIResponse,
  updateEnhancedAIResponseConfig,
  getEnhancedAIResponseStats,
  clearEnhancedAIResponseCache
} from '@/lib/enhancedAIResponse';
import MultiResponseConfigPanel from '@/components/tavern/MultiResponseConfigPanel';
import MessageItem from '@/components/tavern/MessageItem';
import VirtualizedMessageList from '@/components/tavern/VirtualizedMessageList';
import MultiResponseDisplay from '@/components/tavern/MultiResponseDisplay';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { importTavernCard } from '@/utils/tavernCardImporter';
import { useMessageSummarySystem } from '@/hooks/useMessageSummarySystem';
import { useAutoConversationDebugger } from '@/hooks/useAutoConversationDebugger';
import { useMultiResponseDisplay } from '@/hooks/useMultiResponseDisplay';
import { estimateTokens } from '@/utils/tokenCounter';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// Token使用统计接口
interface TokenUsage {
  characterId: string;
  characterName: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  apiCalls: number;
  category: 'character' | 'system' | 'player' | 'analysis'; // 新增分类
}

// 历史会话接口
interface HistorySession {
  id: string;
  name: string;
  timestamp: Date;
  messages: Message[];
  characters: AICharacter[];
  tokenUsage: TokenUsage[];
}

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [aiCharacters, setAiCharacters] = useState<AICharacter[]>(initialAICharacters);
  const [activeSpeakerId, setActiveSpeakerId] = useState<string | null>(null);
  const [thinkingCharacterId, setThinkingCharacterId] = useState<string | null>(null);
  const [currentTurnAIIndex, setCurrentTurnAIIndex] = useState<number>(0);
  const [autoConversationTimer, setAutoConversationTimer] = useState<NodeJS.Timeout | null>(null);
  const [isAutoConversationActive, setIsAutoConversationActive] = useState<boolean>(true);
  const [speakerHistory, setSpeakerHistory] = useState<string[]>([]);
  const [lastPlayerMessageTime, setLastPlayerMessageTime] = useState<number | undefined>(undefined);
  
  // 防止重复初始化的标志
  const hasInitialized = useRef<boolean>(false);
  
  // 强制清理所有定时器状态 - 修复版本，正确处理定时器清理
  const forceCleanupTimers = useCallback(() => {
    console.log('🧹 强制清理所有定时器状态');
    // 使用当前状态来清理定时器
    setAutoConversationTimer(currentTimer => {
      if (currentTimer) {
        console.log('🧹 清理现有定时器');
        clearTimeout(currentTimer);
      }
      return null;
    });
    setThinkingCharacterId(currentThinking => {
      if (currentThinking) {
        console.log('🧹 清理思考状态');
      }
      return null;
    });
  }, []); // 保持空依赖数组

  const [isPromptDialogOpen, setIsPromptDialogOpen] = useState<boolean>(false);
  const [configuringCharacter, setConfiguringCharacter] = useState<AICharacter | null>(null);
  const [isGeneratingCharacters, setIsGeneratingCharacters] = useState<boolean>(false);

  // 场景分析模型配置状态
  const [sceneAnalysisConfig, setSceneAnalysisConfig] = useState({
    baseUrl: sceneAnalysisDefaults.baseUrl,
    apiKey: sceneAnalysisDefaults.apiKey,
    modelName: sceneAnalysisDefaults.modelName,
  });
  const [isSceneConfigDialogOpen, setIsSceneConfigDialogOpen] = useState<boolean>(false);

  // 多AI响应配置状态
  const [multiResponseConfig, setMultiResponseConfig] = useState<MultiResponseConfig>(defaultMultiResponseConfig);
  
  // 使用新的多响应展示Hook替换原有的简单状态
  const {
    enhancedState: multiResponseState,
    startMultiResponse,
    pauseMultiResponse,
    resumeMultiResponse,
    cancelMultiResponse,
    skipCurrentResponse,
    markResponseCompleted,
    markResponseError,
    updateCurrentResponderIndex,
    progressPercentage,
    timeRemaining,
    isActive: isMultiResponseActive
  } = useMultiResponseDisplay({
    estimatedResponseTime: 15000, // 15秒预估响应时间
    enableTimeEstimation: true,
    autoCleanupAfter: 3000 // 3秒后自动清理
  });

  // 向后兼容：为现有代码提供activeMultiResponse接口
  const activeMultiResponse = useMemo(() => {
    if (!multiResponseState.inProgress || !multiResponseState.plan) {
      return null;
    }
    return {
      plan: multiResponseState.plan,
      currentResponderIndex: multiResponseState.currentResponderIndex,
      inProgress: multiResponseState.inProgress
    };
  }, [multiResponseState]);

  // Token统计和历史会话状态
  const [currentTokenUsage, setCurrentTokenUsage] = useState<TokenUsage[]>([]);
  const [historySessions, setHistorySessions] = useState<HistorySession[]>([]);
  const [isHistoryPanelCollapsed, setIsHistoryPanelCollapsed] = useState<boolean>(false);

  // 场景描述状态
  const [sceneDescription, setSceneDescription] = useState<string>(
    '你发现自己身处于光线昏暗的"游荡翼龙"酒馆。空气中弥漫着陈年麦酒和木柴烟熏的气味。低语交谈声和酒杯碰撞声充满了整个房间。'
  );
  const [isSceneEditDialogOpen, setIsSceneEditDialogOpen] = useState<boolean>(false);

  // 消息摘要系统状态
  const [isMemoryPanelCollapsed, setIsMemoryPanelCollapsed] = useState<boolean>(true);
  const [summarySystemEnabled, setSummarySystemEnabled] = useState<boolean>(true);
  
  // 上下文管理系统状态
  const [isContextManagerOpen, setIsContextManagerOpen] = useState<boolean>(false);
  
  // 初始化增强AI响应系统
  useEffect(() => {
    if (!hasInitialized.current && aiCharacters.length > 0) {
      try {
        initializeEnhancedAIResponse({
          enableContextPruning: true,
          maxContextTokens: 4000,
          enablePersonalization: true,
          debugMode: false,
          logContextInfo: true
        });
        console.log('🧠 增强AI响应系统已初始化');
        hasInitialized.current = true;
      } catch (error) {
        console.error('❌ 增强AI响应系统初始化失败:', error);
      }
    }
  }, [aiCharacters]);

  // 当角色列表发生变化时更新增强AI响应系统
  useEffect(() => {
    if (hasInitialized.current && aiCharacters.length > 0) {
      try {
        // 检查角色是否真的发生了变化（比较ID）
        const currentCharacterIds = aiCharacters.map(char => char.id).sort();
        const lastCharacterIds = (aiCharacters.length > 0) ? 
          aiCharacters.map(char => char.id).sort() : [];
        
        if (JSON.stringify(currentCharacterIds) !== JSON.stringify(lastCharacterIds)) {
          console.log('🔄 角色列表已变化，重新初始化增强AI响应系统');
          initializeEnhancedAIResponse({
            enableContextPruning: true,
            maxContextTokens: 4000,
            enablePersonalization: true,
            debugMode: false,
            logContextInfo: true
          });
          console.log('✅ 增强AI响应系统已更新角色配置');
        }
      } catch (error) {
        console.error('❌ 增强AI响应系统角色更新失败:', error);
      }
    }
  }, [aiCharacters]);

  // 更新Token使用统计
  const updateTokenUsage = useCallback((characterId: string, characterName: string, inputTokens: number, outputTokens: number, category: 'character' | 'system' | 'player' | 'analysis' = 'character') => {
    setCurrentTokenUsage(prev => {
      const existingIndex = prev.findIndex(usage => usage.characterId === characterId && usage.category === category);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          inputTokens: updated[existingIndex].inputTokens + inputTokens,
          outputTokens: updated[existingIndex].outputTokens + outputTokens,
          totalTokens: updated[existingIndex].totalTokens + inputTokens + outputTokens,
          apiCalls: updated[existingIndex].apiCalls + 1,
        };
        return updated;
      } else {
        return [...prev, {
          characterId,
          characterName,
          inputTokens,
          outputTokens,
          totalTokens: inputTokens + outputTokens,
          apiCalls: 1,
          category,
        }];
      }
    });
  }, []);

  // 简单的Token估算函数（基于文本长度估算）
  const estimateTokens = useCallback((text: string) => {
    // 粗略估算：中文字符约1.5个token，英文单词约1个token
    const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
    const englishWords = text.split(/\s+/).filter(word => /[a-zA-Z]/.test(word)).length;
    return Math.ceil(chineseChars * 1.5 + englishWords);
  }, []);

  const addMessage = useCallback((text: string, sender: string, isPlayer: boolean, avatarColor?: string) => {
    const newMessage: Message = {
      id: uuidv4(),
      sender,
      text,
      isPlayer,
      timestamp: new Date(),
      avatarColor,
    };
    setMessages((prevMessages) => [...prevMessages, newMessage]);
  }, []);

  // 更新角色最后发言时间
  const updateCharacterLastSpeakTime = useCallback((characterId: string) => {
    setAiCharacters(prevChars =>
      prevChars.map(char =>
        char.id === characterId 
          ? { ...char, lastSpeakTime: Date.now() }
          : char
      )
    );
  }, []);

  // 计算角色发言冷却权重
  const calculateCooldownWeight = useCallback((character: AICharacter): number => {
    if (!character.lastSpeakTime) {
      return 1.0; // 从未发言过，权重最高
    }
    
    const now = Date.now();
    const timeSinceLastSpeak = now - character.lastSpeakTime;
    const cooldownPeriod = 45000; // 45秒冷却期（增加冷却时间）
    
    // 基于时间计算权重，越久没发言权重越高
    const timeWeight = Math.min(timeSinceLastSpeak / cooldownPeriod, 1.0);
    
    // 更严格的时间惩罚
    if (timeSinceLastSpeak < 10000) { // 10秒内几乎不可能再次选中
      return 0.02;
    }
    
    if (timeSinceLastSpeak < 20000) { // 20秒内大幅降低权重
      return 0.1;
    }
    
    if (timeSinceLastSpeak < 45000) { // 45秒内逐渐恢复权重
      return 0.2 + timeWeight * 0.6; // 权重范围：0.2-0.8
    }
    
    // 如果很久没发言过(超过2分钟)，提高权重
    if (timeSinceLastSpeak > 120000) {
      return 1.5;
    }
    
    return 0.8 + timeWeight * 0.4; // 45秒后权重范围：0.8-1.2
  }, []);

  // 智能发言者选择（整合冷却机制、历史惩罚、主题相关性和发言欲望）
  const selectNextSpeakerIndex = useCallback(async (mentionedCharacters?: string[]) => {
    if (aiCharacters.length === 0) return 0;
    if (aiCharacters.length === 1) return 0;

    console.log('🧠 开始智能发言者选择v2.0...');
    
    // 如果有@提及，优先处理
    if (mentionedCharacters && mentionedCharacters.length > 0) {
      console.log('🎯 检测到@提及，优先处理:', mentionedCharacters);
      
      const mentionedCharacterIndices = mentionedCharacters
        .map(name => aiCharacters.findIndex(char => char.name === name))
        .filter(index => index !== -1);
      
      if (mentionedCharacterIndices.length > 0) {
        // 如果只有一个被@的角色，直接选择
        if (mentionedCharacterIndices.length === 1) {
          const selectedIndex = mentionedCharacterIndices[0];
          console.log(`🎯 直接选择被@的角色: ${aiCharacters[selectedIndex].name}`);
          return selectedIndex;
        } else {
          // 多个被@角色，从中选择发言欲望最高的
          const mentionedDesireResults = batchCalculateSpeakingDesire(
            mentionedCharacterIndices.map(i => aiCharacters[i])
          );
          
          const bestMentioned = mentionedDesireResults
            .map((result, index) => ({ ...result, originalIndex: mentionedCharacterIndices[index] }))
            .sort((a, b) => b.desireScore - a.desireScore)[0];
          
          console.log(`🎯 从被@角色中选择最有发言欲望的: ${aiCharacters[bestMentioned.originalIndex].name}`);
          return bestMentioned.originalIndex;
        }
      }
    }

    // 步骤1：分析主题相关性（如果有足够的对话内容）
    let topicRelevanceResults = [];
    if (messages.length >= 3) { // 至少需要3条消息才进行主题分析
      try {
        const topicConfig: TopicAnalysisConfig = {
          baseUrl: sceneAnalysisConfig.baseUrl,
          apiKey: sceneAnalysisConfig.apiKey,
          modelName: sceneAnalysisConfig.modelName
        };
        
        console.log('📊 开始主题相关性分析...');
        topicRelevanceResults = await batchAnalyzeTopicRelevance(messages, aiCharacters, topicConfig);
        console.log('📊 主题相关性分析完成:', topicRelevanceResults);
        
        // 统计主题分析的Token使用
        const analysisInputTokens = estimateTokens(messages.slice(-5).map(m => m.text).join(' '));
        const analysisOutputTokens = estimateTokens(topicRelevanceResults.map(r => r.reasoningBrief).join(' '));
        updateTokenUsage('topic_analysis', '主题分析', analysisInputTokens, analysisOutputTokens, 'analysis');
      } catch (error) {
        console.warn('⚠️ 主题相关性分析失败，使用回退机制:', error);
        // 继续使用默认值
      }
    }

    // 步骤2：计算发言欲望分数
    const speakingDesireResults = batchCalculateSpeakingDesire(aiCharacters, topicRelevanceResults);
    console.log('💭 发言欲望分析完成:', speakingDesireResults);

    // 步骤3：使用新的智能选择算法
    try {
      const { smartSelectSpeaker } = await import('@/lib/smartSpeakerSelection');
      const selectedIndex = await smartSelectSpeaker(
        aiCharacters,
        messages,
        speakerHistory,
        speakingDesireResults,
        lastPlayerMessageTime
      );

      if (selectedIndex === -1) {
        console.log('🤐 智能算法决定保持沉默');
        return -1; // 表示沉默
      }

      return selectedIndex;
    } catch (error) {
      console.warn('⚠️ 智能选择算法失败，使用回退机制:', error);
      
      // 回退到原有逻辑
      let selectedIndex = selectSpeakerByDesire(aiCharacters, speakingDesireResults, 0.2);
      
      if (selectedIndex === -1) {
        console.log('🤐 所有角色发言欲望都很低，回退到传统冷却机制');
        selectedIndex = selectFallbackSpeaker();
      }

      selectedIndex = applyHistoryAndCooldownCheck(selectedIndex, speakingDesireResults);
      logDetailedSelectionInfo(selectedIndex, speakingDesireResults, topicRelevanceResults);
      
      return selectedIndex;
    }
  }, [aiCharacters, speakerHistory, messages, sceneAnalysisConfig, calculateCooldownWeight, lastPlayerMessageTime]);

  // 回退的传统发言者选择方法
  const selectFallbackSpeaker = useCallback(() => {
    const characterScores = aiCharacters.map((character, index) => {
      const cooldownWeight = calculateCooldownWeight(character);
      const recentHistory = speakerHistory.slice(-3);
      let historyPenalty = 1.0;
      
      if (recentHistory.length > 0 && recentHistory[recentHistory.length - 1] === character.id) {
        historyPenalty = 0.05;
      } else if (recentHistory.slice(-2).includes(character.id)) {
        historyPenalty = 0.1;
      } else if (recentHistory.includes(character.id)) {
        historyPenalty = 0.3;
      }
      
      const randomFactor = 0.9 + Math.random() * 0.2;
      const finalScore = cooldownWeight * historyPenalty * randomFactor;
      
      return { index, score: finalScore };
    });

    const sortedScores = characterScores.sort((a, b) => b.score - a.score);
    return sortedScores[0].index;
  }, [aiCharacters, speakerHistory, calculateCooldownWeight]);

  // 应用历史惩罚和冷却机制检查
  const applyHistoryAndCooldownCheck = useCallback((selectedIndex: number, desireResults: SpeakingDesireResult[]) => {
    const selectedCharacter = aiCharacters[selectedIndex];
    const lastSpeaker = speakerHistory.length > 0 ? speakerHistory[speakerHistory.length - 1] : null;
    
    // 紧急阻止连续发言
    if (selectedCharacter.id === lastSpeaker) {
      console.warn('⚠️ 紧急阻止连续发言！寻找替代角色...');
      
      // 找到第二高发言欲望的角色
      const sortedDesire = desireResults
        .map((result, index) => ({ ...result, index }))
        .filter(result => result.characterId !== lastSpeaker) // 排除刚发言的角色
        .sort((a, b) => b.desireScore - a.desireScore);
      
      if (sortedDesire.length > 0) {
        const newSelectedIndex = sortedDesire[0].index;
        console.log(`🔄 改选角色: ${aiCharacters[newSelectedIndex].name} (欲望分数: ${sortedDesire[0].desireScore.toFixed(3)})`);
        return newSelectedIndex;
      }
    }

    // 检查冷却时间过短
    if (selectedCharacter.lastSpeakTime) {
      const timeSinceLastSpeak = Date.now() - selectedCharacter.lastSpeakTime;
      if (timeSinceLastSpeak < 10000) { // 10秒内强制选择其他角色
        console.warn(`⏰ ${selectedCharacter.name} 冷却时间不足(${Math.floor(timeSinceLastSpeak/1000)}秒)，寻找替代角色...`);
        
        const availableCharacters = aiCharacters
          .map((char, index) => ({ char, index }))
          .filter(({ char }) => {
            const timeSince = char.lastSpeakTime ? Date.now() - char.lastSpeakTime : Infinity;
            return timeSince > 10000 || timeSince === Infinity;
          });

    if (availableCharacters.length > 0) {
          // 选择可用角色中发言欲望最高的
          const bestAvailable = availableCharacters
            .map(({ char, index }) => {
              const desire = desireResults.find(r => r.characterId === char.id);
              return { index, desireScore: desire?.desireScore || 0.1 };
            })
            .sort((a, b) => b.desireScore - a.desireScore)[0];
          
          console.log(`🔄 冷却检查后改选: ${aiCharacters[bestAvailable.index].name}`);
          return bestAvailable.index;
        }
      }
    }

    return selectedIndex;
  }, [aiCharacters, speakerHistory]);

  // 输出详细的选择信息
  const logDetailedSelectionInfo = useCallback((selectedIndex: number, desireResults: SpeakingDesireResult[], topicResults: any[]) => {
    const selectedCharacter = aiCharacters[selectedIndex];
    const selectedDesire = desireResults[selectedIndex];
    
    console.log('🎭 智能发言者选择结果:', {
      当前时间: new Date().toLocaleTimeString(),
      选中角色: selectedCharacter.name,
      选中原因: selectedDesire?.reasoning || '传统冷却机制',
      发言欲望分数: selectedDesire?.desireScore.toFixed(3) || '未计算',
      发言欲望详情: selectedDesire?.breakdown || '无',
      主题相关性: topicResults.find(r => r.characterId === selectedCharacter.id)?.reasoningBrief || '未分析',
      
      所有角色排名: desireResults
        .map((result, index) => ({
          角色: aiCharacters[index].name,
          发言欲望: result.desireScore.toFixed(3),
          推理: result.reasoning,
          距上次发言: aiCharacters[index].lastSpeakTime 
            ? `${Math.floor((Date.now() - aiCharacters[index].lastSpeakTime) / 1000)}秒前`
            : '从未发言'
        }))
        .sort((a, b) => parseFloat(b.发言欲望) - parseFloat(a.发言欲望)),
      
      历史记录: speakerHistory.slice(-5),
      角色总数: aiCharacters.length
    });
  }, [aiCharacters, speakerHistory]);

  const startAutoConversation = useCallback(() => {
    console.log('🎯 startAutoConversation 被调用，开始状态检查...');
    console.log('📊 当前状态详情:', {
      isAutoConversationActive,
      thinkingCharacterId,
      aiCharactersLength: aiCharacters.length,
      hasExistingTimer: !!autoConversationTimer
    });

    if (!isAutoConversationActive) {
      console.log('❌ 自动对话未激活，停止执行');
      return;
    }

    if (thinkingCharacterId) {
      console.log('❌ 有角色正在思考中，停止执行:', thinkingCharacterId);
      return;
    }

    if (aiCharacters.length === 0) {
      console.log('❌ 没有AI角色，停止执行');
      return;
    }

    // 先清理现有定时器，防止重复设置
    if (autoConversationTimer) {
      console.log('🧹 清理现有自动对话定时器');
      clearTimeout(autoConversationTimer);
      setAutoConversationTimer(null);
    }

    console.log('⏰ 设置新的自动对话定时器');
    const timer = setTimeout(async () => {
      console.log('⏰ 自动对话定时器触发，开始执行...');
      
      // 再次检查状态
      if (!isAutoConversationActive || thinkingCharacterId) { 
        console.log('❌ 定时器执行时状态已变化，清理并退出:', {
          isActive: isAutoConversationActive,
          thinkingId: thinkingCharacterId
        });
        if(autoConversationTimer) clearTimeout(autoConversationTimer); 
        setAutoConversationTimer(null);
        if(thinkingCharacterId) setThinkingCharacterId(null); 
        return;
      }
      
      // 异步选择下一个发言者
      const nextAIIndex = await selectNextSpeakerIndex();
      
      // 处理沉默情况
      if (nextAIIndex === -1) {
        console.log('🤐 AI选择保持沉默，短暂延迟后重试');
        if(autoConversationTimer) clearTimeout(autoConversationTimer);
        setAutoConversationTimer(null);
        // 缩短沉默后的重试时间
        setTimeout(() => {
          if (isAutoConversationActive && !thinkingCharacterId) {
            console.log('🔄 沉默期结束，重新尝试自动对话');
            startAutoConversation();
          }
        }, 5000 + Math.random() * 3000); // 5-8秒后重试（缩短时间）
        return;
      }
      
      const nextAI = aiCharacters[nextAIIndex];
      
      if (!nextAI) { 
        console.log('❌ 选中的AI角色不存在:', nextAIIndex);
        if(autoConversationTimer) clearTimeout(autoConversationTimer);
        setAutoConversationTimer(null);
        return;
      }

      console.log(`🎭 ${nextAI.name} 开始思考...`);
      setThinkingCharacterId(nextAI.id);

      setTimeout(async () => {
        if (!isAutoConversationActive) { 
          console.log('❌ 角色发言时自动对话已停止');
          setThinkingCharacterId(null);
          return;
        }
        let aiResponseText = null;
        // 尝试用大模型API回复
        aiResponseText = await fetchAIResponse(nextAI, messages, updateTokenUsage, estimateTokens);
        if (!aiResponseText) {
          // 回退本地responses
          aiResponseText = nextAI.responses[Math.floor(Math.random() * nextAI.responses.length)];
        }
        console.log(`✅ ${nextAI.name} (ID: ${nextAI.id}, Index: ${nextAIIndex}) 发言完成. Config:`, nextAI.modelConfig);
        addMessage(aiResponseText, nextAI.name, false, nextAI.avatarColor);
        updateCharacterLastSpeakTime(nextAI.id); // 更新最后发言时间
        setActiveSpeakerId(nextAI.id);
        setThinkingCharacterId(null);
        
        setCurrentTurnAIIndex(nextAIIndex); 

        setSpeakerHistory(prev => {
          const newHistory = [...prev, nextAI.id];
          // 保持最近20次发言记录，不去重，维持时间顺序
          return newHistory.slice(-20);
        });

        console.log('🔄 AI发言完成，准备下一轮自动对话');
        startAutoConversation(); 
      }, 1500 + Math.random() * 1000); 
    }, 4000 + Math.random() * 6000); 

    setAutoConversationTimer(timer);
    console.log('✅ 自动对话定时器设置完成');
  }, [
    aiCharacters,
    isAutoConversationActive,
    thinkingCharacterId,
    addMessage,
    selectNextSpeakerIndex,
    updateCharacterLastSpeakTime,
    // 移除 autoConversationTimer 依赖项，避免循环依赖
  ]);

  useEffect(() => {
    if (aiCharacters.length > 0 && messages.length === 0 && !hasInitialized.current) {
      const firstAI = aiCharacters[0];
      hasInitialized.current = true; // 标记已初始化
      
      console.log('🎬 初始化第一个角色:', firstAI.name);
      setThinkingCharacterId(firstAI.id);
      setTimeout(() => {
        addMessage(firstAI.greeting, firstAI.name, false, firstAI.avatarColor);
        updateCharacterLastSpeakTime(firstAI.id); // 更新最后发言时间
        setActiveSpeakerId(firstAI.id);
        setThinkingCharacterId(null);
        setSpeakerHistory([firstAI.id]); 
        setCurrentTurnAIIndex(0);         
        if (isAutoConversationActive) {
          // startAutoConversation(); // This will be picked up by the effect below
        }
      }, 1500);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps 
  }, [aiCharacters.length, messages.length]); // 移除函数依赖项，只保留必要的状态

  useEffect(() => {
    console.log('🔍 自动对话启动检查 - useEffect 触发');
    console.log('📊 当前状态详情:', {
      isAutoConversationActive,
      messagesLength: messages.length,
      hasTimer: !!autoConversationTimer,
      thinkingCharacterId,
      charactersCount: aiCharacters.length,
      timerValue: autoConversationTimer
    });

    // 修复：使用更可靠的条件检查和状态管理
    if (isAutoConversationActive && messages.length > 0 && !autoConversationTimer && !thinkingCharacterId) {
        console.log("🚀 Effect: 启动自动对话 - 状态检查通过");
        console.log("📊 启动条件满足:", {
          自动对话激活: isAutoConversationActive ? '✅' : '❌',
          有消息历史: messages.length > 0 ? '✅' : '❌',
          没有定时器: !autoConversationTimer ? '✅' : '❌',
          没有思考角色: !thinkingCharacterId ? '✅' : '❌',
          有可用角色: aiCharacters.length > 0 ? '✅' : '❌'
        });
        
        // 使用更可靠的延迟启动方式
        const startupTimer = setTimeout(() => {
          console.log('⏰ 延迟启动检查开始...');
          // 再次检查状态确保仍然满足启动条件
          setAutoConversationTimer(currentTimer => {
            setThinkingCharacterId(currentThinking => {
              setIsAutoConversationActive(currentActive => {
                console.log('🔍 延迟检查状态:', {
                  定时器状态: currentTimer ? '有定时器' : '无定时器',
                  思考状态: currentThinking ? '有角色思考' : '无角色思考',
                  激活状态: currentActive ? '已激活' : '未激活'
                });

                if (currentActive && !currentTimer && !currentThinking) {
                  console.log('🎬 延迟检查通过，启动自动对话');
        startAutoConversation();
                } else {
                  console.log('⚠️ 延迟检查未通过，取消启动', {
                    isActive: currentActive,
                    hasTimer: !!currentTimer,
                    isThinking: !!currentThinking
                  });
                }
                return currentActive;
              });
              return currentThinking;
            });
            return currentTimer;
          });
        }, 100);
        
        // 清理启动定时器
        return () => {
          clearTimeout(startupTimer);
        };
        
    } else if (!isAutoConversationActive) {
        console.log("⏸️ 暂停自动对话，清理状态");
        if (autoConversationTimer) {
            console.log('🧹 清理定时器状态');
            clearTimeout(autoConversationTimer);
            setAutoConversationTimer(null);
        }
        if (thinkingCharacterId) {
            console.log('🧹 清理思考状态');
            setThinkingCharacterId(null);
        }
    } else {
        // 输出为什么没有启动的原因
        if (isAutoConversationActive) {
          console.log("⚠️ 自动对话未启动，条件不满足:");
          console.log("📋 详细诊断:", {
            '消息数量': messages.length,
            '消息数量满足': messages.length > 0 ? '✅ 是' : '❌ 否',
            '定时器状态': autoConversationTimer ? '❌ 已存在' : '✅ 无',
            '思考角色': thinkingCharacterId || '✅ 无',
            '角色总数': aiCharacters.length,
            '自动对话': isAutoConversationActive ? '✅ 激活' : '❌ 未激活'
          });
          
          // 如果有残留定时器，强制清理
      if (autoConversationTimer) {
            console.log('🚨 检测到残留定时器，强制清理');
            forceCleanupTimers();
          }
        }
    }

    return () => {
      // cleanup function
    };
  }, [autoConversationTimer, isAutoConversationActive, messages.length, thinkingCharacterId, startAutoConversation, aiCharacters.length, forceCleanupTimers]);

  // 执行多AI响应 - 传统模式（原有逻辑）
  const executeMultiResponseTraditional = useCallback(async (responsePlan: any, playerMessage: string) => {
    console.log('🎭 执行多AI响应 - 传统模式');
    const startTime = Date.now();
    
    const selectedResponders = responsePlan.selectedResponders;
    
    // 启动多响应展示
    startMultiResponse(responsePlan);

    for (let i = 0; i < selectedResponders.length; i++) {
      const responder = selectedResponders[i];
      const character = aiCharacters.find(c => c.id === responder.characterId);
      
      if (!character) continue;

      console.log(`🎭 第${i + 1}/${selectedResponders.length}位响应者: ${character.name} (评分: ${responder.responseScore.toFixed(3)})`);
      
      setThinkingCharacterId(character.id);
      updateCurrentResponderIndex(i);

      // 记录响应开始时间
      const responseStartTime = Date.now();

      // 生成AI响应
      let aiResponseText = null;
      try {
        aiResponseText = await fetchAIResponse(character, messages, updateTokenUsage, estimateTokens);
      } catch (error) {
        console.error(`${character.name} AI响应失败:`, error);
        // 标记响应错误
        markResponseError(character.id, `AI响应失败: ${error}`);
      }
      
      if (!aiResponseText) {
        aiResponseText = character.responses[Math.floor(Math.random() * character.responses.length)];
      }

      // 计算响应时间
      const responseDuration = Date.now() - responseStartTime;

      if (aiResponseText) {
        // 添加响应消息
        addMessage(aiResponseText, character.name, false, character.avatarColor);
        updateCharacterLastSpeakTime(character.id);
        setActiveSpeakerId(character.id);
        
        // 标记响应完成
        markResponseCompleted(character.id, aiResponseText, responseDuration);
        
        console.log(`✅ ${character.name} 已响应: "${aiResponseText}" (耗时: ${responseDuration}ms)`);
      }
      
      setThinkingCharacterId(null); 

      // 更新发言历史
      setSpeakerHistory(prev => {
        const newHistory = [...prev, character.id];
        return newHistory.slice(-20);
      });

      // 如果不是最后一个响应者，等待间隔时间
      if (i < selectedResponders.length - 1) {
        await new Promise(resolve => setTimeout(resolve, multiResponseConfig.responseInterval));
      }
    }

    console.log('✅ 传统多AI响应完成');

    // 记录调试信息
    const executionTime = Date.now() - startTime;
    multiResponseDebugger.logExecution(
      'traditional',
      playerMessage,
      selectedResponders.map(r => r.characterName || '未知角色'),
      executionTime
    );

    // 传统模式响应完成后，重启自动对话
    setTimeout(() => {
      console.log('🔄 传统多AI响应完成，重启自动对话');
      setIsAutoConversationActive(true);
    }, 2000 + Math.random() * 1000);
  }, [
    aiCharacters, 
    messages, 
    updateTokenUsage, 
    estimateTokens, 
    addMessage, 
    updateCharacterLastSpeakTime, 
    multiResponseConfig.responseInterval,
    startMultiResponse,
    updateCurrentResponderIndex,
    markResponseCompleted,
    markResponseError
  ]);

  // 执行多AI响应（简化为只有传统模式）
  const executeMultiAIResponse = useCallback(async (responsePlan: any, playerMessage: string) => {
    console.log('🎭 开始执行多AI响应计划');
    
    // 直接使用传统模式，移除复杂的模式选择
    await executeMultiResponseTraditional(responsePlan, playerMessage);
  }, [executeMultiResponseTraditional]);

  // 执行单一AI响应（原有逻辑）
  const executeSingleAIResponse = useCallback(async (playerMessage: string, mentionedCharacters?: string[]) => {
    console.log('🎯 执行单一AI响应模式');
    
    const respondingAIIndex = await selectNextSpeakerIndex(mentionedCharacters);
    const respondingAI = aiCharacters[respondingAIIndex];

    if (!respondingAI) {
      // 如果没有AI响应，立即重启自动对话
      console.log('⚠️ 没有AI选择响应，重启自动对话');
      setTimeout(() => {
        setIsAutoConversationActive(true);
      }, 1000);
      return;
    }

    setThinkingCharacterId(respondingAI.id);

    setTimeout(async () => {
      let aiResponseText = null;
      aiResponseText = await fetchAIResponse(respondingAI, messages, updateTokenUsage, estimateTokens);
      if (!aiResponseText) {
        aiResponseText = respondingAI.responses[Math.floor(Math.random() * respondingAI.responses.length)];
      }
      console.log(`${respondingAI.name} (ID: ${respondingAI.id}, Index: ${respondingAIIndex}) is responding to player. Config:`, respondingAI.modelConfig);
      addMessage(aiResponseText, respondingAI.name, false, respondingAI.avatarColor);
      updateCharacterLastSpeakTime(respondingAI.id);
      setActiveSpeakerId(respondingAI.id);
      setThinkingCharacterId(null);
      
      setCurrentTurnAIIndex(respondingAIIndex); 

      setSpeakerHistory(prev => { 
        const newHistory = [...prev, respondingAI.id];
        return newHistory.slice(-20);
      });

      // AI响应完成后，短暂延迟重启自动对话
      console.log('✅ AI响应完成，准备重启自动对话');
      setTimeout(() => {
        console.log('🔄 重启自动对话');
        setIsAutoConversationActive(true); 
      }, 2000 + Math.random() * 1000); // 缩短延迟时间到2-3秒
    }, 1500 + Math.random() * 1000);
  }, [selectNextSpeakerIndex, aiCharacters, messages, updateTokenUsage, estimateTokens, addMessage, updateCharacterLastSpeakTime]);

  const handlePlayerMessage = useCallback(async (text: string, mentionResult?: import('@/lib/mentionParser').MentionParseResult) => {
    let wasAutoConversationActiveBeforePlayer = isAutoConversationActive; // Store current state

    if (autoConversationTimer) {
      clearTimeout(autoConversationTimer);
      setAutoConversationTimer(null);
    }
    setIsAutoConversationActive(false); // Pause auto-conversation temporarily
    if (thinkingCharacterId) { 
      setThinkingCharacterId(null); 
    }

    // 创建消息，包含@提及信息
    const newMessage = {
      id: crypto.randomUUID(),
      sender: '玩家',
      text,
      isPlayer: true,
      timestamp: new Date(),
      mentionedCharacters: mentionResult?.mentionedCharacters || []
    };
    setMessages((prevMessages) => [...prevMessages, newMessage]);
    setActiveSpeakerId(null); 

    // 记录玩家消息时间
    setLastPlayerMessageTime(Date.now());
    
    // 如果有@提及，记录日志
    if (mentionResult?.hasMentions) {
      console.log('🎯 玩家@提及了角色:', mentionResult.mentionedCharacters);
    }
    
    // 统计玩家消息的Token使用（输入）
    const playerInputTokens = estimateTokens(text);
    updateTokenUsage('player', '玩家', playerInputTokens, 0, 'player'); 

    // 判断是否启用多AI响应
    if (multiResponseConfig.enableMultiResponse && aiCharacters.length > 1) {
      console.log('🎭 启用多AI响应模式');
      
      try {
        // 评估多AI响应计划
        const topicConfig: TopicAnalysisConfig = {
          baseUrl: sceneAnalysisConfig.baseUrl,
          apiKey: sceneAnalysisConfig.apiKey,
          modelName: sceneAnalysisConfig.modelName
        };

        const responsePlan = await evaluateMultipleAIResponses(
          aiCharacters,
          messages,
          text,
          mentionResult?.mentionedCharacters,
          multiResponseConfig,
          topicConfig
        );

        if (shouldExecuteMultiResponse(responsePlan)) {
          // 执行多AI响应
          await executeMultiAIResponse(responsePlan, text);
        } else {
          // 回退到单一响应模式
          await executeSingleAIResponse(text, mentionResult?.mentionedCharacters);
        }
      } catch (error) {
        console.error('多AI响应评估失败，回退到单一响应:', error);
        await executeSingleAIResponse(text, mentionResult?.mentionedCharacters);
      }
    } else {
      // 单一响应模式
      await executeSingleAIResponse(text, mentionResult?.mentionedCharacters);
    }
    
    // 注意：自动对话重启逻辑已移至各个响应函数中，避免重复
  }, [
    autoConversationTimer,
    aiCharacters,
    thinkingCharacterId,
    isAutoConversationActive,
    multiResponseConfig,
    sceneAnalysisConfig,
    messages,
    estimateTokens,
    updateTokenUsage,
    executeMultiAIResponse,
    executeSingleAIResponse
  ]);

  const toggleAutoConversation = () => {
    setIsAutoConversationActive(prevIsActive => {
      const newIsActive = !prevIsActive;
      if (!newIsActive) { // Means we are pausing
        console.log('⏸️ 暂停自动对话，强制清理状态');
        forceCleanupTimers();
      } else {
        console.log('▶️ 恢复自动对话');
        // 恢复时也清理一次，确保状态干净
        forceCleanupTimers();
      }
      // If newIsActive is true (resuming), the useEffect will handle starting the conversation.
      return newIsActive;
    });
  };

  const handleOpenPromptDialog = (characterId: string) => {
    const charToConfig = aiCharacters.find(char => char.id === characterId);
    if (charToConfig) {
      setConfiguringCharacter(charToConfig);
      setIsPromptDialogOpen(true);
    }
  };

  const handleClosePromptDialog = () => {
    setIsPromptDialogOpen(false);
    setConfiguringCharacter(null);
  };

  const handleSavePrompt = (characterId: string, prompt: string) => {
    setAiCharacters(prevChars =>
      prevChars.map(char =>
        char.id === characterId 
          ? { 
              ...char, 
              modelConfig: { 
                ...char.modelConfig,
                baseUrl: char.modelConfig?.baseUrl || modelDefaults.baseUrl,
                apiKey: char.modelConfig?.apiKey || modelDefaults.apiKey,
                modelName: char.modelConfig?.modelName || modelDefaults.modelName,
                prompt 
              } 
            } 
          : char
      )
    );
    handleClosePromptDialog();
    console.log(`角色设定已保存 ${characterId}:`, prompt);
  };

  const handleUpdateCharacterConfig = (characterId: string, config: ModelConfig) => {
    setAiCharacters(prevChars =>
      prevChars.map(char =>
        char.id === characterId ? { ...char, modelConfig: config } : char
      )
    );
    console.log(`模型配置已更新 ${characterId}:`, config);
  };

  // 修改：根据场景自动生成角色（使用配置的模型参数）
  async function generateCharactersFromScene(sceneDescription: string) {
    try {
      const res = await fetch(sceneAnalysisConfig.baseUrl + '/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sceneAnalysisConfig.apiKey}`,
        },
        body: JSON.stringify({
          model: sceneAnalysisConfig.modelName,
          messages: [
            { role: 'system', content: sceneAnalysisDefaults.systemPrompt },
            { role: 'user', content: `场景描述：${sceneDescription}` }
          ],
        }),
      });
      if (!res.ok) throw new Error('场景分析API请求失败');
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error('API返回内容为空');
      
      // 使用安全的JSON解析
      const { safeParseValidatedJSON } = await import('@/utils/jsonUtils');
      const parsedData = safeParseValidatedJSON(
        content, 
        ['characters'], 
        { characters: [] }
      );
      return parsedData.characters || [];
    } catch (e) {
      console.error('自动生成角色失败', e);
      return [];
    }
  }

  const handleGenerateCharacters = async () => {
    setIsGeneratingCharacters(true);
    try {
      const generatedCharacters = await generateCharactersFromScene(sceneDescription);
      
      // 统计角色生成的Token使用
      const generationInputTokens = estimateTokens(sceneDescription);
      const generationOutputTokens = estimateTokens(JSON.stringify(generatedCharacters));
      updateTokenUsage('character_generation', '角色生成', generationInputTokens, generationOutputTokens, 'system');
      
      if (generatedCharacters.length > 0) {
        const newCharacters = generatedCharacters.map((char: any, index: number) => ({
          id: `generated_${Date.now()}_${index}`,
          name: char.name,
          avatarColor: char.avatarColor || 'bg-gray-500',
          greeting: char.greeting,
          responses: [
            "让我想想...",
            "这很有趣。",
            "继续说。",
            "嗯，我明白了。",
            "还有什么其他的吗？"
          ],
          modelConfig: {
            baseUrl: modelDefaults.baseUrl,
            apiKey: modelDefaults.apiKey,
            modelName: modelDefaults.modelName,
            prompt: char.prompt
          },
          // 新的自然发言机制属性
          personality: char.personality || {
            extroversion: 0.5,
            curiosity: 0.5,
            talkativeness: 0.5,
            reactivity: 0.5
          },
          interests: char.interests || ['一般话题'],
          speakingStyle: char.speakingStyle || 'reactive',
          socialRole: char.socialRole || 'customer',
          emotionalState: char.emotionalState || 0.0
        }));
        
        // 先重置所有会话状态，然后设置新角色
        handleResetCurrentSession();
        
        // 设置新生成的角色
        setAiCharacters(newCharacters);
        console.log('✅ 成功生成角色并重置会话：', newCharacters);
        
        // 重置初始化标志，强制重新初始化摘要系统
        hasInitialized.current = false;
        
        // 延迟重新初始化摘要系统
        setTimeout(() => {
          try {
            if (newCharacters.length > 0) {
              initializeSummarySystem(newCharacters);
              console.log('✅ 摘要系统已重新初始化');
              hasInitialized.current = true;
            }
          } catch (error) {
            console.error('❌ 摘要系统重新初始化失败:', error);
          }
        }, 100);
        
        // 添加系统消息提示角色已更换
        setTimeout(() => {
          addMessage(
            `🎭 新的冒险者来到了酒馆，让我们开始全新的故事吧！`,
            '系统',
            false,
            'bg-blue-500'
          );
        }, 500);
      } else {
        console.warn('⚠️ 未生成任何角色');
      }
    } catch (error) {
      console.error('❌ 生成角色时出错：', error);
    } finally {
      setIsGeneratingCharacters(false);
    }
  };

  const handleOpenSceneConfigDialog = () => {
    setIsSceneConfigDialogOpen(true);
  };

  const handleCloseSceneConfigDialog = () => {
    setIsSceneConfigDialogOpen(false);
  };

  const handleSaveSceneConfig = (config: { baseUrl: string; apiKey: string; modelName: string }) => {
    setSceneAnalysisConfig(config);
    handleCloseSceneConfigDialog();
    console.log('场景分析模型配置已保存：', config);
  };

  // 历史会话管理功能
  const handleToggleHistoryPanel = () => {
    setIsHistoryPanelCollapsed(!isHistoryPanelCollapsed);
  };

  const handleSaveCurrentSession = () => {
    if (messages.length === 0) return;
    
    const sessionName = `会话 ${new Date().toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })}`;
    
    const newSession: HistorySession = {
      id: uuidv4(),
      name: sessionName,
      timestamp: new Date(),
      messages: [...messages],
      characters: [...aiCharacters],
      tokenUsage: [...currentTokenUsage],
    };
    
    setHistorySessions(prev => [newSession, ...prev]);
    console.log('当前会话已保存：', sessionName);
  };

  const handleLoadSession = (session: HistorySession) => {
    setMessages(session.messages);
    setAiCharacters(session.characters);
    setCurrentTokenUsage(session.tokenUsage);
    setActiveSpeakerId(null);
    setThinkingCharacterId(null);
    setSpeakerHistory([]);
    setCurrentTurnAIIndex(0);
    setIsAutoConversationActive(false);
    
    // 重置初始化标志（加载的会话已有内容，不需要重新初始化）
    hasInitialized.current = session.messages.length > 0;
    
    // 清除定时器
    if (autoConversationTimer) {
      clearTimeout(autoConversationTimer);
      setAutoConversationTimer(null);
    }
    
    console.log('已加载历史会话：', session.name);
  };

  const handleDeleteSession = (sessionId: string) => {
    setHistorySessions(prev => prev.filter(session => session.id !== sessionId));
    console.log('历史会话已删除：', sessionId);
  };

  // 重置当前会话（先自动保存当前会话）
  const handleResetCurrentSession = () => {
    // 如果当前有对话内容，先自动保存
    if (messages.length > 0) {
      const sessionName = `自动保存 ${new Date().toLocaleString('zh-CN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })}`;
      
      const autoSavedSession: HistorySession = {
        id: uuidv4(),
        name: sessionName,
        timestamp: new Date(),
        messages: [...messages],
        characters: [...aiCharacters],
        tokenUsage: [...currentTokenUsage],
      };
      
      setHistorySessions(prev => [autoSavedSession, ...prev]);
      console.log('会话已自动保存：', sessionName);
    }
    
    // 重置所有状态
    setMessages([]);
    setCurrentTokenUsage([]);
    setActiveSpeakerId(null);
    setThinkingCharacterId(null);
    setSpeakerHistory([]);
    setCurrentTurnAIIndex(0);
    
    // 重置初始化标志
    hasInitialized.current = false;
    
    // 清除定时器
    if (autoConversationTimer) {
      clearTimeout(autoConversationTimer);
      setAutoConversationTimer(null);
    }
  };

  // 场景编辑功能
  const handleOpenSceneEditDialog = () => {
    setIsSceneEditDialogOpen(true);
  };

  const handleCloseSceneEditDialog = () => {
    setIsSceneEditDialogOpen(false);
  };

  const handleSaveSceneDescription = (newDescription: string) => {
    setSceneDescription(newDescription);
    handleCloseSceneEditDialog();
    console.log('场景描述已更新：', newDescription);
  };

  // 记忆控制面板处理函数
  const handleToggleMemoryPanel = () => {
    setIsMemoryPanelCollapsed(!isMemoryPanelCollapsed);
  };

  // 上下文管理器处理函数
  const handleToggleContextManager = () => {
    setIsContextManagerOpen(!isContextManagerOpen);
  };

  // 对话框状态管理
  const [isMultiResponseConfigOpen, setIsMultiResponseConfigOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen flex bg-tavern-bg text-tavern-text">
      {/* 左侧历史统计面板 - 固定高度避免影响中间布局 */}
      <div className="h-screen flex-shrink-0">
        <HistoryPanel
          isCollapsed={isHistoryPanelCollapsed}
          onToggleCollapse={handleToggleHistoryPanel}
          currentTokenUsage={currentTokenUsage}
          currentMessages={messages}
          currentCharacters={aiCharacters}
          historySessions={historySessions}
          onLoadSession={handleLoadSession}
          onDeleteSession={handleDeleteSession}
          onSaveCurrentSession={handleSaveCurrentSession}
        />
      </div>

      {/* 主要游戏区域 */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl lg:max-w-3xl bg-tavern-panel-bg rounded-lg shadow-xl flex flex-col h-[90vh]">
          <SceneHeader 
            description={sceneDescription} 
            onEditScene={handleOpenSceneEditDialog}
          />
          <div className="p-2 bg-tavern-panel-bg border-b border-tavern-accent flex gap-2 flex-wrap">
            <Button
              onClick={handleGenerateCharacters}
              disabled={isGeneratingCharacters}
              className="bg-tavern-accent hover:bg-yellow-600 text-tavern-bg font-semibold text-xs px-3 py-1"
            >
              {isGeneratingCharacters ? '正在生成角色...' : '🎭 生成新角色（重置会话）'}
            </Button>
            <Button
              onClick={handleOpenSceneConfigDialog}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-3 py-1"
            >
              ⚙️ 配置生成模型
            </Button>
            <Button
              onClick={handleResetCurrentSession}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs px-3 py-1"
            >
              🔄 重置会话
            </Button>
            <Button
              onClick={() => {
                console.log('🚨 用户手动强制重启对话');
                console.log('📊 重启前状态:', {
                  hasTimer: !!autoConversationTimer,
                  isThinking: !!thinkingCharacterId,
                  isActive: isAutoConversationActive,
                  messagesLength: messages.length
                });
                
                // 立即强制清理所有状态
                forceCleanupTimers();
                setIsAutoConversationActive(false);
                
                // 延迟重启，确保状态完全清理
                setTimeout(() => {
                  console.log('🔄 状态清理完成，重新启动自动对话');
                  console.log('📊 重启后状态检查:', {
                    messagesLength: messages.length,
                    charactersCount: aiCharacters.length
                  });
                  
                  if (messages.length > 0 && aiCharacters.length > 0) {
                    setIsAutoConversationActive(true);
                    console.log('✅ 自动对话已重新激活');
                  } else {
                    console.log('⚠️ 无法重启：缺少消息或角色');
                  }
                }, 300); // 增加延迟确保状态完全清理
              }}
              className="bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs px-3 py-1"
            >
              🚨 强制重启对话
            </Button>
            <Button
              onClick={handleToggleContextManager}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs px-3 py-1"
            >
              🧠 上下文管理
            </Button>
          </div>
        <ChatWindow messages={messages} />
        
        {/* 多AI响应展示组件 */}
        {isMultiResponseActive && (
          <div className="p-2">
            <MultiResponseDisplay
              multiResponseState={multiResponseState}
              characters={aiCharacters}
              onPause={pauseMultiResponse}
              onResume={resumeMultiResponse}
              onCancel={cancelMultiResponse}
              onSkipCurrent={skipCurrentResponse}
              onOpenConfig={() => setIsMultiResponseConfigOpen(true)}
            />
          </div>
        )}
        
        <AvatarBar
          characters={aiCharacters}
          activeSpeakerId={activeSpeakerId}
          thinkingCharacterId={thinkingCharacterId}
            onAvatarClick={handleOpenPromptDialog}
          isAutoConversationActive={isAutoConversationActive}
          onToggleAutoConversation={toggleAutoConversation}
        />
        <InputArea
          onSendMessage={handlePlayerMessage}
          isAIThinking={!!thinkingCharacterId}
            availableCharacters={aiCharacters}
        />
      </div>

        {/* Prompt编辑对话框 */}
        <CharacterPromptDialog
          character={configuringCharacter}
          isOpen={isPromptDialogOpen}
          onClose={handleClosePromptDialog}
          onSave={handleSavePrompt}
        />
        {/* 场景分析模型配置对话框 */}
        <SceneAnalysisConfigDialog
          isOpen={isSceneConfigDialogOpen}
          onClose={handleCloseSceneConfigDialog}
          onSave={handleSaveSceneConfig}
          currentConfig={sceneAnalysisConfig}
        />
        {/* 场景编辑对话框 */}
        <SceneEditDialog
          isOpen={isSceneEditDialogOpen}
          onClose={handleCloseSceneEditDialog}
          onSave={handleSaveSceneDescription}
          currentDescription={sceneDescription}
        />

        {/* 多响应配置对话框 */}
        <Dialog open={isMultiResponseConfigOpen} onOpenChange={setIsMultiResponseConfigOpen}>
          <DialogContent className="sm:max-w-[500px] bg-tavern-panel-bg text-tavern-text border-tavern-accent">
            <DialogHeader>
              <DialogTitle>🎭 多AI响应配置</DialogTitle>
              <DialogDescription>
                调整多个AI角色同时响应的行为参数
              </DialogDescription>
            </DialogHeader>
            <MultiResponseConfigPanel
              config={multiResponseConfig}
              onConfigChange={setMultiResponseConfig}
              characters={aiCharacters}
            />
          </DialogContent>
        </Dialog>

        {/* 上下文管理控制面板 */}
        <ContextManagerPanel
          isOpen={isContextManagerOpen}
          onClose={() => setIsContextManagerOpen(false)}
        />
      </div>
      
      {/* 右侧面板区域 */}
      <div className="h-screen flex flex-shrink-0">
        {/* 上下文管理面板已移至主界面中 */}
        
        {/* 模型配置面板 */}
        <div className="h-screen flex-shrink-0">
          <ModelConfigPanel
            characters={aiCharacters}
            onUpdateCharacterConfig={handleUpdateCharacterConfig}
            multiResponseConfig={multiResponseConfig}
            onMultiResponseConfigChange={setMultiResponseConfig}
          />
        </div>
      </div>
    </div>
  );
};

// 增强版AI响应函数（集成动态上下文裁剪系统）
async function fetchAIResponse(character, messages, updateTokenUsageFn, estimateTokensFn) {
  try {
    // 使用增强版AI响应函数，集成动态上下文裁剪系统
    const result = await fetchEnhancedAIResponse(
      character,
      messages,
      updateTokenUsageFn,
      estimateTokensFn,
      {
        enableContextPruning: true,
        maxContextTokens: 4000,
        enablePersonalization: true,
        debugMode: false,
        logContextInfo: true
      }
    );

    if (!result.success) {
      console.error('❌ 增强AI响应失败:', result.error);
      return null;
    }

    // 如果使用了上下文裁剪，记录额外信息
    if (result.contextInfo) {
      console.log('🧠 上下文裁剪系统生效:', {
        原始消息数: result.contextInfo.originalMessageCount,
        处理后消息数: result.contextInfo.processedMessageCount,
        Token减少: `${result.contextInfo.tokenReduction.toFixed(1)}%`,
        策略: result.contextInfo.strategy,
        个性化: result.contextInfo.usedPersonalization ? '是' : '否',
        处理时间: `${result.contextInfo.processingTime}ms`
      });
    }

    // 记录性能信息
    if (result.performanceInfo) {
      console.log('⚡ 性能统计:', {
        总耗时: `${result.performanceInfo.totalTime}ms`,
        上下文处理: `${result.performanceInfo.contextProcessingTime}ms`,
        AI响应: `${result.performanceInfo.aiResponseTime}ms`,
        回退使用: result.fallbackUsed ? '是' : '否'
      });
    }

    return result.response;
  } catch (error) {
    console.error('❌ AI响应函数执行失败:', error);
    
    // 回退到原始实现
    console.log('🔄 使用原始AI响应函数作为回退...');
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
      return null;
    }
    
    try {
      const requestMessages = [
        ...(config.prompt ? [{ role: 'system', content: config.prompt }] : []),
        ...messages.map(m => ({ role: m.isPlayer ? 'user' : 'assistant', content: m.text }))
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
      
      if (!res.ok) throw new Error('API请求失败');
      const data = await res.json();
      const responseContent = data.choices?.[0]?.message?.content || null;
      
      // 记录Token使用
      if (responseContent && updateTokenUsageFn && estimateTokensFn) {
        let inputTokens = data.usage?.prompt_tokens;
        let outputTokens = data.usage?.completion_tokens;
        
        if (!inputTokens || !outputTokens) {
          const inputText = requestMessages.map(m => m.content).join(' ');
          inputTokens = estimateTokensFn(inputText);
          outputTokens = estimateTokensFn(responseContent);
        }
        
        updateTokenUsageFn(character.id, character.name, inputTokens, outputTokens, 'character');
      }
      
      return responseContent;
    } catch (e) {
      console.error('回退AI响应也失败了:', e);
      return null;
    }
  }
}

export default Index;
