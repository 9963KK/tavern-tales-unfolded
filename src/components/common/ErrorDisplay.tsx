import React, { useState, useEffect } from 'react';
import { BaseError, ErrorType, ErrorSeverity } from '../../types/error';

// 错误显示组件属性接口
interface ErrorDisplayProps {
  error: BaseError | Error | string;
  type?: 'warning' | 'error' | 'info';
  recoverable?: boolean;
  onRetry?: () => void;
  onDismiss?: () => void;
  autoHide?: boolean;
  autoHideDelay?: number;
  showDetails?: boolean;
  className?: string;
}

// 错误类型到样式的映射
const getErrorStyles = (type: 'warning' | 'error' | 'info', severity?: ErrorSeverity) => {
  // 根据严重程度调整样式
  if (severity === ErrorSeverity.CRITICAL) {
    return {
      container: 'bg-red-100 border-red-500 text-red-900',
      icon: 'text-red-500',
      button: 'bg-red-600 hover:bg-red-700 text-white'
    };
  }

  switch (type) {
    case 'error':
      return {
        container: 'bg-red-50 border-red-200 text-red-800',
        icon: 'text-red-400',
        button: 'bg-red-600 hover:bg-red-700 text-white'
      };
    case 'warning':
      return {
        container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
        icon: 'text-yellow-400',
        button: 'bg-yellow-600 hover:bg-yellow-700 text-white'
      };
    case 'info':
      return {
        container: 'bg-blue-50 border-blue-200 text-blue-800',
        icon: 'text-blue-400',
        button: 'bg-blue-600 hover:bg-blue-700 text-white'
      };
    default:
      return {
        container: 'bg-gray-50 border-gray-200 text-gray-800',
        icon: 'text-gray-400',
        button: 'bg-gray-600 hover:bg-gray-700 text-white'
      };
  }
};

// 获取错误图标
const getErrorIcon = (type: 'warning' | 'error' | 'info') => {
  switch (type) {
    case 'error':
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      );
    case 'warning':
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'info':
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    default:
      return null;
  }
};

// 解析错误对象
const parseError = (error: BaseError | Error | string) => {
  if (typeof error === 'string') {
    return {
      message: error,
      userMessage: error,
      type: ErrorType.SYSTEM_ERROR,
      severity: ErrorSeverity.MEDIUM,
      id: `string_error_${Date.now()}`
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      userMessage: error.message,
      type: ErrorType.SYSTEM_ERROR,
      severity: ErrorSeverity.MEDIUM,
      id: `error_${Date.now()}`,
      stack: error.stack
    };
  }

  return error;
};

// 获取错误类型
const getErrorType = (error: BaseError | Error | string): 'warning' | 'error' | 'info' => {
  const parsedError = parseError(error);
  
  if ('severity' in parsedError) {
    switch (parsedError.severity) {
      case ErrorSeverity.LOW:
        return 'info';
      case ErrorSeverity.MEDIUM:
        return 'warning';
      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL:
        return 'error';
      default:
        return 'error';
    }
  }
  
  return 'error';
};

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  type,
  recoverable = false,
  onRetry,
  onDismiss,
  autoHide = false,
  autoHideDelay = 5000,
  showDetails = false,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [showDetailedInfo, setShowDetailedInfo] = useState(false);

  const parsedError = parseError(error);
  const errorType = type || getErrorType(error);
  const styles = getErrorStyles(errorType, 'severity' in parsedError ? parsedError.severity : undefined);

  // 自动隐藏逻辑
  useEffect(() => {
    if (autoHide && errorType !== 'error') {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onDismiss?.();
      }, autoHideDelay);

      return () => clearTimeout(timer);
    }
  }, [autoHide, autoHideDelay, errorType, onDismiss]);

  // 处理关闭
  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  // 处理重试
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    }
  };

  if (!isVisible) {
    return null;
  }

  const userMessage = 'userMessage' in parsedError ? parsedError.userMessage : parsedError.message;
  const technicalMessage = parsedError.message;

  return (
    <div className={`rounded-md border p-4 ${styles.container} ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <div className={styles.icon}>
            {getErrorIcon(errorType)}
          </div>
        </div>
        <div className="ml-3 flex-1">
          <div className="text-sm font-medium">
            {userMessage || technicalMessage}
          </div>
          
          {/* 技术详情 */}
          {showDetails && userMessage !== technicalMessage && (
            <div className="mt-2">
              <button
                onClick={() => setShowDetailedInfo(!showDetailedInfo)}
                className="text-xs underline hover:no-underline focus:outline-none"
              >
                {showDetailedInfo ? '隐藏' : '显示'}技术详情
              </button>
              
              {showDetailedInfo && (
                <div className="mt-2 p-2 bg-black bg-opacity-10 rounded text-xs font-mono">
                  <div><strong>错误ID:</strong> {parsedError.id}</div>
                  <div><strong>技术信息:</strong> {technicalMessage}</div>
                  {'type' in parsedError && (
                    <div><strong>错误类型:</strong> {parsedError.type}</div>
                  )}
                  {'stack' in parsedError && parsedError.stack && (
                    <details className="mt-1">
                      <summary className="cursor-pointer">堆栈跟踪</summary>
                      <pre className="mt-1 whitespace-pre-wrap text-xs">{parsedError.stack}</pre>
                    </details>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 操作按钮 */}
          <div className="mt-3 flex space-x-2">
            {recoverable && onRetry && (
              <button
                onClick={handleRetry}
                className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md ${styles.button} focus:outline-none focus:ring-2 focus:ring-offset-2`}
              >
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                重试
              </button>
            )}
            
            {onDismiss && (
              <button
                onClick={handleDismiss}
                className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md bg-transparent hover:bg-black hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-offset-2"
              >
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                关闭
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// 简化的错误提示组件
export const ErrorToast: React.FC<{
  message: string;
  type?: 'error' | 'warning' | 'info';
  onClose?: () => void;
}> = ({ message, type = 'error', onClose }) => {
  return (
    <ErrorDisplay
      error={message}
      type={type}
      onDismiss={onClose}
      autoHide={type !== 'error'}
      autoHideDelay={3000}
      className="fixed top-4 right-4 z-50 max-w-sm shadow-lg"
    />
  );
};

// 内联错误组件
export const InlineError: React.FC<{
  message: string;
  className?: string;
}> = ({ message, className = '' }) => {
  return (
    <div className={`flex items-center text-red-600 text-sm ${className}`}>
      <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{message}</span>
    </div>
  );
}; 