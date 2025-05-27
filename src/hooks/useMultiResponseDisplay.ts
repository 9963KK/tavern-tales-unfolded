/**
 * 多AI响应展示Hook
 * 管理多响应的增强状态、进度计算和控制操作
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  EnhancedMultiResponseState, 
  CompletedResponse, 
  ResponseError 
} from '@/components/tavern/MultiResponseDisplay';
import { MultiResponsePlan } from '@/lib/multiResponseEvaluator';

/**
 * Hook配置选项
 */
export interface UseMultiResponseDisplayConfig {
  estimatedResponseTime?: number; // 预估单个响应时间（毫秒）
  enableTimeEstimation?: boolean; // 是否启用时间估计
  autoCleanupAfter?: number; // 完成后自动清理时间（毫秒）
}

/**
 * Hook返回值
 */
export interface UseMultiResponseDisplayReturn {
  // 状态
  enhancedState: EnhancedMultiResponseState;
  
  // 控制方法
  startMultiResponse: (plan: MultiResponsePlan) => void;
  pauseMultiResponse: () => void;
  resumeMultiResponse: () => void;
  cancelMultiResponse: () => void;
  skipCurrentResponse: () => void;
  
  // 响应处理
  markResponseCompleted: (characterId: string, response: string, duration: number) => void;
  markResponseError: (characterId: string, error: string) => void;
  updateCurrentResponderIndex: (index: number) => void;
  
  // 计算属性
  progressPercentage: number;
  timeRemaining: number | null;
  isActive: boolean;
}

/**
 * 默认配置
 */
const DEFAULT_CONFIG: Required<UseMultiResponseDisplayConfig> = {
  estimatedResponseTime: 15000, // 15秒
  enableTimeEstimation: true,
  autoCleanupAfter: 5000 // 5秒后清理
};

/**
 * 多AI响应展示Hook
 */
export function useMultiResponseDisplay(
  config: UseMultiResponseDisplayConfig = {}
): UseMultiResponseDisplayReturn {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  
  // 增强状态管理
  const [enhancedState, setEnhancedState] = useState<EnhancedMultiResponseState>({
    plan: null,
    currentResponderIndex: 0,
    inProgress: false,
    startTime: null,
    estimatedEndTime: null,
    completedResponses: [],
    errors: [],
    isPaused: false,
    userCancelled: false
  });

  // 自动清理定时器
  const [cleanupTimer, setCleanupTimer] = useState<NodeJS.Timeout | null>(null);

  /**
   * 计算预估结束时间
   */
  const calculateEstimatedEndTime = useCallback((
    plan: MultiResponsePlan, 
    currentIndex: number, 
    completedCount: number
  ): Date | null => {
    if (!mergedConfig.enableTimeEstimation || !plan.selectedResponders) {
      return null;
    }

    const remainingResponders = plan.selectedResponders.length - completedCount;
    if (remainingResponders <= 0) return new Date();

    const estimatedRemainingTime = remainingResponders * mergedConfig.estimatedResponseTime;
    return new Date(Date.now() + estimatedRemainingTime);
  }, [mergedConfig]);

  /**
   * 开始多响应
   */
  const startMultiResponse = useCallback((plan: MultiResponsePlan) => {
    console.log('🚀 开始多AI响应展示', { plan });
    
    // 清理现有的清理定时器
    if (cleanupTimer) {
      clearTimeout(cleanupTimer);
      setCleanupTimer(null);
    }

    const startTime = new Date();
    const estimatedEndTime = calculateEstimatedEndTime(plan, 0, 0);

    setEnhancedState({
      plan,
      currentResponderIndex: 0,
      inProgress: true,
      startTime,
      estimatedEndTime,
      completedResponses: [],
      errors: [],
      isPaused: false,
      userCancelled: false
    });
  }, [calculateEstimatedEndTime, cleanupTimer]);

  /**
   * 暂停多响应
   */
  const pauseMultiResponse = useCallback(() => {
    console.log('⏸️ 暂停多AI响应');
    setEnhancedState(prev => ({
      ...prev,
      isPaused: true
    }));
  }, []);

  /**
   * 继续多响应
   */
  const resumeMultiResponse = useCallback(() => {
    console.log('▶️ 继续多AI响应');
    setEnhancedState(prev => ({
      ...prev,
      isPaused: false
    }));
  }, []);

  /**
   * 取消多响应
   */
  const cancelMultiResponse = useCallback(() => {
    console.log('❌ 取消多AI响应');
    setEnhancedState(prev => ({
      ...prev,
      inProgress: false,
      isPaused: false,
      userCancelled: true
    }));

    // 设置自动清理
    const timer = setTimeout(() => {
      setEnhancedState(prev => ({
        ...prev,
        plan: null,
        userCancelled: false
      }));
      setCleanupTimer(null);
    }, mergedConfig.autoCleanupAfter);
    
    setCleanupTimer(timer);
  }, [mergedConfig.autoCleanupAfter]);

  /**
   * 跳过当前响应
   */
  const skipCurrentResponse = useCallback(() => {
    setEnhancedState(prev => {
      if (!prev.plan || !prev.plan.selectedResponders) return prev;

      const currentCharacterId = prev.plan.selectedResponders[prev.currentResponderIndex]?.characterId;
      console.log('⏭️ 跳过当前响应', { currentCharacterId, currentIndex: prev.currentResponderIndex });

      const newIndex = prev.currentResponderIndex + 1;
      const completedCount = prev.completedResponses.length + prev.errors.length + 1; // +1 for skipped
      const estimatedEndTime = calculateEstimatedEndTime(prev.plan, newIndex, completedCount);

      return {
        ...prev,
        currentResponderIndex: newIndex,
        estimatedEndTime
      };
    });
  }, [calculateEstimatedEndTime]);

  /**
   * 标记响应完成
   */
  const markResponseCompleted = useCallback((characterId: string, response: string, duration: number) => {
    setEnhancedState(prev => {
      const character = prev.plan?.selectedResponders?.find(r => r.characterId === characterId);
      const characterName = character?.characterId || 'Unknown';

      const completedResponse: CompletedResponse = {
        characterId,
        characterName,
        response,
        completedAt: new Date(),
        duration
      };

      console.log('✅ 标记响应完成', { characterId, duration });

      const newCompletedResponses = [...prev.completedResponses, completedResponse];
      const completedCount = newCompletedResponses.length + prev.errors.length;
      const estimatedEndTime = prev.plan ? 
        calculateEstimatedEndTime(prev.plan, prev.currentResponderIndex, completedCount) : 
        null;

      // 检查是否全部完成
      const totalResponders = prev.plan?.selectedResponders?.length || 0;
      const isAllComplete = completedCount >= totalResponders;

      return {
        ...prev,
        completedResponses: newCompletedResponses,
        estimatedEndTime,
        inProgress: !isAllComplete
      };
    });
  }, [calculateEstimatedEndTime]);

  /**
   * 标记响应错误
   */
  const markResponseError = useCallback((characterId: string, error: string) => {
    setEnhancedState(prev => {
      const character = prev.plan?.selectedResponders?.find(r => r.characterId === characterId);
      const characterName = character?.characterId || 'Unknown';

      const responseError: ResponseError = {
        characterId,
        characterName,
        error,
        timestamp: new Date()
      };

      console.log('❌ 标记响应错误', { characterId, error });

      const newErrors = [...prev.errors, responseError];
      const completedCount = prev.completedResponses.length + newErrors.length;
      const estimatedEndTime = prev.plan ? 
        calculateEstimatedEndTime(prev.plan, prev.currentResponderIndex, completedCount) : 
        null;

      // 检查是否全部完成
      const totalResponders = prev.plan?.selectedResponders?.length || 0;
      const isAllComplete = completedCount >= totalResponders;

      return {
        ...prev,
        errors: newErrors,
        estimatedEndTime,
        inProgress: !isAllComplete
      };
    });
  }, [calculateEstimatedEndTime]);

  /**
   * 更新当前响应者索引
   */
  const updateCurrentResponderIndex = useCallback((index: number) => {
    setEnhancedState(prev => {
      if (index === prev.currentResponderIndex) return prev;

      console.log('🔄 更新当前响应者索引', { from: prev.currentResponderIndex, to: index });

      const completedCount = prev.completedResponses.length + prev.errors.length;
      const estimatedEndTime = prev.plan ? 
        calculateEstimatedEndTime(prev.plan, index, completedCount) : 
        null;

      return {
        ...prev,
        currentResponderIndex: index,
        estimatedEndTime
      };
    });
  }, [calculateEstimatedEndTime]);

  /**
   * 计算进度百分比
   */
  const progressPercentage = useMemo(() => {
    if (!enhancedState.plan?.selectedResponders) return 0;
    
    const totalResponders = enhancedState.plan.selectedResponders.length;
    const completedCount = enhancedState.completedResponses.length + enhancedState.errors.length;
    
    return totalResponders > 0 ? (completedCount / totalResponders) * 100 : 0;
  }, [enhancedState.completedResponses, enhancedState.errors, enhancedState.plan]);

  /**
   * 计算剩余时间（毫秒）
   */
  const timeRemaining = useMemo(() => {
    if (!enhancedState.estimatedEndTime) return null;
    
    const remaining = enhancedState.estimatedEndTime.getTime() - Date.now();
    return Math.max(0, remaining);
  }, [enhancedState.estimatedEndTime]);

  /**
   * 是否活跃状态
   */
  const isActive = useMemo(() => {
    return enhancedState.inProgress && !!enhancedState.plan;
  }, [enhancedState.inProgress, enhancedState.plan]);

  // 自动清理完成状态
  useEffect(() => {
    if (!enhancedState.inProgress && enhancedState.plan && !enhancedState.userCancelled) {
      console.log('🧹 多AI响应完成，设置自动清理');
      
      const timer = setTimeout(() => {
        setEnhancedState(prev => ({
          ...prev,
          plan: null,
          completedResponses: [],
          errors: []
        }));
        setCleanupTimer(null);
      }, mergedConfig.autoCleanupAfter);
      
      setCleanupTimer(timer);
    }
  }, [enhancedState.inProgress, enhancedState.plan, enhancedState.userCancelled, mergedConfig.autoCleanupAfter]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (cleanupTimer) {
        clearTimeout(cleanupTimer);
      }
    };
  }, [cleanupTimer]);

  return {
    enhancedState,
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
    isActive
  };
} 