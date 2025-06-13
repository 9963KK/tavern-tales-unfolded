import { useState, useCallback, useRef, useEffect } from 'react';
import { Logger } from '../lib/logger';
import { ErrorHandler } from '../lib/errorHandler';
import { ErrorType, ErrorSeverity, RetryOptions } from '../types/error';

interface RecoveryState {
  isRecovering: boolean;
  retryCount: number;
  lastError: Error | null;
  recoveryAttempts: number;
  canRetry: boolean;
}

interface RecoveryOptions {
  maxRetries?: number;
  retryDelay?: number;
  exponentialBackoff?: boolean;
  resetOnSuccess?: boolean;
  autoRecover?: boolean;
  onRecoveryStart?: () => void;
  onRecoverySuccess?: () => void;
  onRecoveryFailed?: (error: Error) => void;
}

interface UseErrorRecoveryReturn {
  recoveryState: RecoveryState;
  executeWithRecovery: <T>(
    operation: () => Promise<T> | T,
    options?: RecoveryOptions
  ) => Promise<T>;
  retry: () => Promise<void>;
  reset: () => void;
  canRecover: boolean;
}

export function useErrorRecovery(
  defaultOptions: RecoveryOptions = {}
): UseErrorRecoveryReturn {
  const logger = Logger.getInstance();
  const errorHandler = ErrorHandler.getInstance();
  
  const [recoveryState, setRecoveryState] = useState<RecoveryState>({
    isRecovering: false,
    retryCount: 0,
    lastError: null,
    recoveryAttempts: 0,
    canRetry: true
  });

  const lastOperationRef = useRef<{
    operation: () => Promise<any> | any;
    options: RecoveryOptions;
  } | null>(null);

  const defaultRecoveryOptions: Required<RecoveryOptions> = {
    maxRetries: 3,
    retryDelay: 1000,
    exponentialBackoff: true,
    resetOnSuccess: true,
    autoRecover: false,
    onRecoveryStart: () => {},
    onRecoverySuccess: () => {},
    onRecoveryFailed: () => {},
    ...defaultOptions
  };

  /**
   * 计算重试延迟
   */
  const calculateRetryDelay = useCallback((
    retryCount: number,
    baseDelay: number,
    exponentialBackoff: boolean
  ): number => {
    if (!exponentialBackoff) {
      return baseDelay;
    }
    return baseDelay * Math.pow(2, retryCount);
  }, []);

  /**
   * 延迟函数
   */
  const delay = useCallback((ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
  }, []);

  /**
   * 执行带恢复机制的操作
   */
  const executeWithRecovery = useCallback(async <T>(
    operation: () => Promise<T> | T,
    options: RecoveryOptions = {}
  ): Promise<T> => {
    const mergedOptions = { ...defaultRecoveryOptions, ...options };
    lastOperationRef.current = { operation, options: mergedOptions };

    setRecoveryState(prev => ({
      ...prev,
      isRecovering: true,
      canRetry: true
    }));

    let currentRetryCount = 0;
    let lastError: Error | null = null;

    while (currentRetryCount <= mergedOptions.maxRetries) {
      try {
        logger.debug('执行操作', { 
          retryCount: currentRetryCount,
          maxRetries: mergedOptions.maxRetries 
        });

        const result = await Promise.resolve(operation());

        // 成功执行
        if (mergedOptions.resetOnSuccess) {
          setRecoveryState({
            isRecovering: false,
            retryCount: 0,
            lastError: null,
            recoveryAttempts: 0,
            canRetry: true
          });
        } else {
          setRecoveryState(prev => ({
            ...prev,
            isRecovering: false,
            lastError: null
          }));
        }

        mergedOptions.onRecoverySuccess();
        logger.info('操作执行成功', { retryCount: currentRetryCount });
        
        return result;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        currentRetryCount++;

        logger.warn('操作执行失败', {
          error: lastError.message,
          retryCount: currentRetryCount,
          maxRetries: mergedOptions.maxRetries
        });

        setRecoveryState(prev => ({
          ...prev,
          retryCount: currentRetryCount,
          lastError,
          recoveryAttempts: prev.recoveryAttempts + 1
        }));

        // 检查是否还能重试
        if (currentRetryCount > mergedOptions.maxRetries) {
          break;
        }

        // 计算延迟时间
        const retryDelay = calculateRetryDelay(
          currentRetryCount - 1,
          mergedOptions.retryDelay,
          mergedOptions.exponentialBackoff
        );

        logger.debug('等待重试', { delay: retryDelay });
        await delay(retryDelay);
      }
    }

    // 所有重试都失败了
    setRecoveryState(prev => ({
      ...prev,
      isRecovering: false,
      canRetry: false
    }));

    mergedOptions.onRecoveryFailed(lastError!);
    
    // 记录错误
    errorHandler.handleError({
      type: ErrorType.OPERATION,
      message: `操作失败，已重试 ${mergedOptions.maxRetries} 次`,
      severity: ErrorSeverity.HIGH,
      details: {
        originalError: lastError!.message,
        retryCount: currentRetryCount - 1,
        maxRetries: mergedOptions.maxRetries
      },
      timestamp: Date.now()
    });

    throw lastError;
  }, [
    defaultRecoveryOptions,
    calculateRetryDelay,
    delay,
    logger,
    errorHandler
  ]);

  /**
   * 手动重试最后一次操作
   */
  const retry = useCallback(async (): Promise<void> => {
    if (!lastOperationRef.current) {
      throw new Error('没有可重试的操作');
    }

    if (!recoveryState.canRetry) {
      throw new Error('已达到最大重试次数，无法重试');
    }

    const { operation, options } = lastOperationRef.current;
    
    try {
      await executeWithRecovery(operation, options);
    } catch (error) {
      logger.error('手动重试失败', error);
      throw error;
    }
  }, [recoveryState.canRetry, executeWithRecovery, logger]);

  /**
   * 重置恢复状态
   */
  const reset = useCallback((): void => {
    setRecoveryState({
      isRecovering: false,
      retryCount: 0,
      lastError: null,
      recoveryAttempts: 0,
      canRetry: true
    });
    lastOperationRef.current = null;
    logger.info('错误恢复状态已重置');
  }, [logger]);

  /**
   * 检查是否可以恢复
   */
  const canRecover = recoveryState.canRetry && !recoveryState.isRecovering;

  /**
   * 自动恢复机制
   */
  useEffect(() => {
    if (
      defaultRecoveryOptions.autoRecover &&
      recoveryState.lastError &&
      !recoveryState.isRecovering &&
      recoveryState.canRetry &&
      lastOperationRef.current
    ) {
      const autoRetryDelay = calculateRetryDelay(
        recoveryState.retryCount,
        defaultRecoveryOptions.retryDelay,
        defaultRecoveryOptions.exponentialBackoff
      );

      logger.info('启动自动恢复', { delay: autoRetryDelay });

      const timeoutId = setTimeout(() => {
        retry().catch(error => {
          logger.error('自动恢复失败', error);
        });
      }, autoRetryDelay);

      return () => clearTimeout(timeoutId);
    }
  }, [
    defaultRecoveryOptions.autoRecover,
    defaultRecoveryOptions.retryDelay,
    defaultRecoveryOptions.exponentialBackoff,
    recoveryState.lastError,
    recoveryState.isRecovering,
    recoveryState.canRetry,
    recoveryState.retryCount,
    calculateRetryDelay,
    retry,
    logger
  ]);

  return {
    recoveryState,
    executeWithRecovery,
    retry,
    reset,
    canRecover
  };
}

/**
 * 网络错误恢复Hook
 */
export function useNetworkErrorRecovery() {
  return useErrorRecovery({
    maxRetries: 5,
    retryDelay: 2000,
    exponentialBackoff: true,
    autoRecover: true
  });
}

/**
 * API错误恢复Hook
 */
export function useAPIErrorRecovery() {
  return useErrorRecovery({
    maxRetries: 3,
    retryDelay: 1000,
    exponentialBackoff: true,
    autoRecover: false
  });
}

/**
 * 组件错误恢复Hook
 */
export function useComponentErrorRecovery() {
  const [errorBoundaryKey, setErrorBoundaryKey] = useState(0);
  
  const recovery = useErrorRecovery({
    maxRetries: 2,
    retryDelay: 500,
    exponentialBackoff: false,
    resetOnSuccess: true,
    onRecoveryStart: () => {
      // 重置错误边界
      setErrorBoundaryKey(prev => prev + 1);
    }
  });

  return {
    ...recovery,
    errorBoundaryKey,
    resetErrorBoundary: () => setErrorBoundaryKey(prev => prev + 1)
  };
}

/**
 * 批量操作错误恢复Hook
 */
export function useBatchErrorRecovery<T>(
  items: T[],
  operation: (item: T) => Promise<any>,
  options: RecoveryOptions = {}
) {
  const [results, setResults] = useState<Array<{ item: T; result?: any; error?: Error }>>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const recovery = useErrorRecovery(options);

  const processBatch = useCallback(async () => {
    setIsProcessing(true);
    const batchResults: Array<{ item: T; result?: any; error?: Error }> = [];

    for (const item of items) {
      try {
        const result = await recovery.executeWithRecovery(() => operation(item));
        batchResults.push({ item, result });
      } catch (error) {
        batchResults.push({ 
          item, 
          error: error instanceof Error ? error : new Error(String(error))
        });
      }
    }

    setResults(batchResults);
    setIsProcessing(false);
  }, [items, operation, recovery]);

  const retryFailed = useCallback(async () => {
    const failedItems = results.filter(r => r.error).map(r => r.item);
    if (failedItems.length === 0) return;

    setIsProcessing(true);
    const retryResults = [...results];

    for (const item of failedItems) {
      try {
        const result = await recovery.executeWithRecovery(() => operation(item));
        const index = retryResults.findIndex(r => r.item === item);
        if (index !== -1) {
          retryResults[index] = { item, result };
        }
      } catch (error) {
        const index = retryResults.findIndex(r => r.item === item);
        if (index !== -1) {
          retryResults[index] = { 
            item, 
            error: error instanceof Error ? error : new Error(String(error))
          };
        }
      }
    }

    setResults(retryResults);
    setIsProcessing(false);
  }, [results, operation, recovery]);

  return {
    results,
    isProcessing,
    processBatch,
    retryFailed,
    successCount: results.filter(r => !r.error).length,
    failureCount: results.filter(r => r.error).length,
    ...recovery
  };
} 