import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorHandler } from '../../lib/errorHandler';
import { ErrorType, ErrorSeverity } from '../../types/error';
import { Logger } from '../../lib/logger';

// 错误边界状态接口
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
  retryCount: number;
}

// 错误边界属性接口
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  maxRetries?: number;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
}

// 错误回退组件属性接口
export interface ErrorFallbackProps {
  error: Error;
  errorId: string;
  retry: () => void;
  canRetry: boolean;
  retryCount: number;
}

// 默认错误回退组件
const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  errorId,
  retry,
  canRetry,
  retryCount
}) => {
  return (
    <div className="min-h-[200px] flex items-center justify-center p-6">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-red-800">
              页面组件出现问题
            </h3>
          </div>
        </div>
        
        <div className="mb-4">
          <p className="text-sm text-red-700">
            很抱歉，这个页面组件遇到了一些问题。我们已经记录了这个错误，正在努力修复。
          </p>
          {import.meta.env.DEV && (
            <details className="mt-3">
              <summary className="text-xs text-red-600 cursor-pointer hover:text-red-800">
                技术详情 (开发模式)
              </summary>
              <div className="mt-2 p-2 bg-red-100 rounded text-xs font-mono text-red-800 overflow-auto">
                <div><strong>错误ID:</strong> {errorId}</div>
                <div><strong>重试次数:</strong> {retryCount}</div>
                <div><strong>错误信息:</strong> {error.message}</div>
                {error.stack && (
                  <div className="mt-2">
                    <strong>堆栈跟踪:</strong>
                    <pre className="whitespace-pre-wrap text-xs">{error.stack}</pre>
                  </div>
                )}
              </div>
            </details>
          )}
        </div>

        <div className="flex space-x-3">
          {canRetry && (
            <button
              onClick={retry}
              className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              重试
            </button>
          )}
          <button
            onClick={() => window.location.reload()}
            className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            刷新页面
          </button>
        </div>
      </div>
    </div>
  );
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // 更新状态以显示错误UI
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 创建错误对象
    const componentError = ErrorHandler.createError(
      ErrorType.COMPONENT_ERROR,
      ErrorSeverity.HIGH,
      `组件渲染错误: ${error.message}`,
      error,
      'ErrorBoundary'
    );

    // 处理错误
    ErrorHandler.handleError(componentError, 'ErrorBoundary');

    // 记录错误详情
    Logger.error('React组件错误', error, 'ErrorBoundary');
    Logger.debug('组件错误详情', {
      componentStack: errorInfo.componentStack,
      errorBoundary: this.constructor.name
    });

    // 更新状态
    this.setState({
      errorId: componentError.id
    });

    // 调用自定义错误处理器
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetOnPropsChange, resetKeys } = this.props;
    const { hasError } = this.state;

    // 如果有错误且启用了属性变化重置
    if (hasError && resetOnPropsChange) {
      // 检查重置键是否发生变化
      if (resetKeys && prevProps.resetKeys) {
        const hasResetKeyChanged = resetKeys.some(
          (key, index) => key !== prevProps.resetKeys![index]
        );
        
        if (hasResetKeyChanged) {
          this.resetErrorBoundary();
        }
      }
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  // 重置错误边界
  resetErrorBoundary = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }

    this.setState({
      hasError: false,
      error: null,
      errorId: null,
      retryCount: 0
    });

    Logger.info('错误边界已重置', undefined, 'ErrorBoundary');
  };

  // 重试操作
  handleRetry = () => {
    const { maxRetries = 3 } = this.props;
    const { retryCount } = this.state;

    if (retryCount >= maxRetries) {
      Logger.warn(`已达到最大重试次数 (${maxRetries})`, undefined, 'ErrorBoundary');
      return;
    }

    Logger.info(`尝试恢复组件 (第${retryCount + 1}次)`, undefined, 'ErrorBoundary');

    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorId: null,
      retryCount: prevState.retryCount + 1
    }));

    // 设置自动重置超时
    this.resetTimeoutId = window.setTimeout(() => {
      if (this.state.hasError) {
        Logger.warn('自动重置超时，组件仍有错误', undefined, 'ErrorBoundary');
      }
    }, 5000);
  };

  render() {
    const { hasError, error, errorId, retryCount } = this.state;
    const { children, fallback: FallbackComponent, maxRetries = 3 } = this.props;

    if (hasError && error && errorId) {
      const canRetry = retryCount < maxRetries;
      
      // 使用自定义回退组件或默认组件
      const ErrorFallback = FallbackComponent || DefaultErrorFallback;
      
      return (
        <ErrorFallback
          error={error}
          errorId={errorId}
          retry={this.handleRetry}
          canRetry={canRetry}
          retryCount={retryCount}
        />
      );
    }

    return children;
  }
}

// 高阶组件：为组件添加错误边界
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Hook：在函数组件中使用错误边界
export function useErrorHandler() {
  return React.useCallback((error: Error, errorInfo?: any) => {
    const componentError = ErrorHandler.createError(
      ErrorType.COMPONENT_ERROR,
      ErrorSeverity.MEDIUM,
      `函数组件错误: ${error.message}`,
      error,
      'useErrorHandler'
    );

    ErrorHandler.handleError(componentError, 'useErrorHandler');
    
    if (errorInfo) {
      Logger.debug('组件错误信息', errorInfo);
    }
  }, []);
} 