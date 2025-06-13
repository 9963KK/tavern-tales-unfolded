import { 
  BaseError, 
  APIError, 
  NetworkError, 
  ValidationError, 
  ComponentError,
  ErrorType, 
  ErrorSeverity, 
  ErrorReport 
} from '../types/error';
import { Logger } from './logger';

class ErrorHandlerClass {
  private sessionId: string;
  private errorCount: Map<ErrorType, number> = new Map();

  constructor() {
    this.sessionId = this.generateSessionId();
    this.setupGlobalErrorHandlers();
  }

  // 生成会话ID
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 设置全局错误处理器
  private setupGlobalErrorHandlers(): void {
    // 捕获未处理的Promise拒绝
    window.addEventListener('unhandledrejection', (event) => {
      const error = this.createError(
        ErrorType.SYSTEM_ERROR,
        ErrorSeverity.HIGH,
        '未处理的Promise拒绝',
        event.reason
      );
      this.handleError(error, 'UnhandledPromiseRejection');
      event.preventDefault();
    });

    // 捕获全局JavaScript错误
    window.addEventListener('error', (event) => {
      const error = this.createError(
        ErrorType.SYSTEM_ERROR,
        ErrorSeverity.HIGH,
        event.message,
        event.error
      );
      this.handleError(error, 'GlobalError');
    });
  }

  // 创建错误对象
  createError(
    type: ErrorType,
    severity: ErrorSeverity,
    message: string,
    originalError?: Error | any,
    context?: string
  ): BaseError {
    return {
      id: this.generateErrorId(),
      type,
      severity,
      message,
      timestamp: new Date(),
      context,
      stack: originalError?.stack,
      userMessage: this.generateUserMessage(type, message)
    };
  }

  // 生成错误ID
  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 生成用户友好的错误消息
  private generateUserMessage(type: ErrorType, message: string): string {
    switch (type) {
      case ErrorType.NETWORK_ERROR:
        return '网络连接出现问题，请检查您的网络设置';
      case ErrorType.API_ERROR:
        return 'AI服务暂时不可用，请稍后重试';
      case ErrorType.VALIDATION_ERROR:
        return '输入内容有误，请检查后重新输入';
      case ErrorType.USER_INPUT_ERROR:
        return '输入格式不正确，请重新输入';
      case ErrorType.COMPONENT_ERROR:
        return '页面组件出现问题，正在尝试恢复';
      case ErrorType.SYSTEM_ERROR:
        return '系统出现异常，我们正在处理中';
      default:
        return '出现了一些问题，请稍后重试';
    }
  }

  // 处理通用错误
  handleError(error: BaseError, context?: string): void {
    // 更新错误计数
    const currentCount = this.errorCount.get(error.type) || 0;
    this.errorCount.set(error.type, currentCount + 1);

    // 记录日志
    Logger.logError(error, context);

    // 根据错误类型执行特定处理
    switch (error.type) {
      case ErrorType.NETWORK_ERROR:
        this.handleNetworkError(error as NetworkError);
        break;
      case ErrorType.API_ERROR:
        this.handleAPIError(error as APIError);
        break;
      case ErrorType.VALIDATION_ERROR:
        this.handleValidationError(error as ValidationError);
        break;
      case ErrorType.COMPONENT_ERROR:
        this.handleComponentError(error as ComponentError);
        break;
      default:
        this.handleGenericError(error);
    }

    // 如果是严重错误，发送错误报告
    if (error.severity === ErrorSeverity.CRITICAL) {
      this.sendErrorReport(error);
    }
  }

  // 处理API错误
  handleAPIError(error: APIError): void {
    Logger.error(`API错误: ${error.message}`, undefined, 'APIError');
    
    // 根据状态码进行特殊处理
    if (error.statusCode) {
      switch (error.statusCode) {
        case 429:
          Logger.warn('API请求频率过高，建议降低请求频率');
          break;
        case 401:
          Logger.warn('API认证失败，请检查配置');
          break;
        case 503:
          Logger.warn('API服务不可用，将尝试重试');
          break;
      }
    }
  }

  // 处理网络错误
  handleNetworkError(error: NetworkError): void {
    Logger.error(`网络错误: ${error.message}`, undefined, 'NetworkError');
    
    if (!error.isOnline) {
      Logger.warn('设备离线，请检查网络连接');
    }
  }

  // 处理验证错误
  handleValidationError(error: ValidationError): void {
    Logger.warn(`验证错误: ${error.message}`, {
      field: error.field,
      value: error.value,
      rules: error.rules
    }, 'ValidationError');
  }

  // 处理组件错误
  handleComponentError(error: ComponentError): void {
    Logger.error(`组件错误: ${error.message}`, {
      component: error.componentName,
      recoverable: error.recoverable
    }, 'ComponentError');
  }

  // 处理通用错误
  handleGenericError(error: BaseError): void {
    Logger.error(`系统错误: ${error.message}`, undefined, 'GenericError');
  }

  // 创建错误报告
  createErrorReport(error: BaseError): ErrorReport {
    return {
      error,
      userAgent: navigator.userAgent,
      url: window.location.href,
      sessionId: this.sessionId,
      additionalData: {
        errorCounts: Object.fromEntries(this.errorCount),
        timestamp: new Date().toISOString(),
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        memory: this.getMemoryInfo()
      }
    };
  }

  // 发送错误报告
  private sendErrorReport(error: BaseError): void {
    try {
      const report = this.createErrorReport(error);
      
      // 在开发环境只记录到控制台
      if (import.meta.env.DEV) {
        console.group('🚨 错误报告');
        console.error('错误详情:', report);
        console.groupEnd();
        return;
      }

      // 生产环境可以发送到错误收集服务
      // 这里暂时只存储到localStorage
      this.storeErrorReport(report);
    } catch (e) {
      Logger.error('发送错误报告失败', e as Error);
    }
  }

  // 存储错误报告到本地
  private storeErrorReport(report: ErrorReport): void {
    try {
      const stored = localStorage.getItem('error_reports') || '[]';
      const reports = JSON.parse(stored);
      reports.push(report);
      
      // 只保留最近50个错误报告
      const recentReports = reports.slice(-50);
      localStorage.setItem('error_reports', JSON.stringify(recentReports));
    } catch (e) {
      // localStorage可能已满，忽略错误
    }
  }

  // 获取内存信息
  private getMemoryInfo(): any {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit
      };
    }
    return null;
  }

  // 获取错误统计
  getErrorStats(): Record<string, number> {
    return Object.fromEntries(this.errorCount);
  }

  // 清除错误统计
  clearErrorStats(): void {
    this.errorCount.clear();
  }

  // 检查是否有频繁错误
  hasFrequentErrors(type: ErrorType, threshold: number = 5): boolean {
    return (this.errorCount.get(type) || 0) >= threshold;
  }

  // 获取存储的错误报告
  getStoredErrorReports(): ErrorReport[] {
    try {
      const stored = localStorage.getItem('error_reports') || '[]';
      return JSON.parse(stored);
    } catch (e) {
      return [];
    }
  }

  // 清除存储的错误报告
  clearStoredErrorReports(): void {
    try {
      localStorage.removeItem('error_reports');
    } catch (e) {
      // 忽略错误
    }
  }
}

// 导出单例实例
export const ErrorHandler = new ErrorHandlerClass(); 