import { 
  APIError, 
  NetworkError, 
  ErrorType, 
  ErrorSeverity, 
  RetryOptions 
} from '../types/error';
import { ErrorHandler } from './errorHandler';
import { Logger } from './logger';

// API响应接口
interface APIResponse<T = any> {
  data?: T;
  error?: APIError;
  success: boolean;
  statusCode?: number;
}

// 重试配置
interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableStatusCodes: number[];
}

// 默认重试配置
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504]
};

// 网络状态监控
class NetworkMonitor {
  private isOnline: boolean = navigator.onLine;
  private connectionQuality: 'good' | 'poor' | 'offline' = 'good';
  private listeners: Array<(status: boolean) => void> = [];

  constructor() {
    this.setupEventListeners();
    this.checkConnectionQuality();
  }

  private setupEventListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.connectionQuality = 'good';
      this.notifyListeners(true);
      Logger.info('网络连接已恢复', undefined, 'NetworkMonitor');
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.connectionQuality = 'offline';
      this.notifyListeners(false);
      Logger.warn('网络连接已断开', undefined, 'NetworkMonitor');
    });
  }

  private async checkConnectionQuality(): Promise<void> {
    if (!this.isOnline) {
      this.connectionQuality = 'offline';
      return;
    }

    try {
      const startTime = Date.now();
      const response = await fetch('/favicon.ico', { 
        method: 'HEAD',
        cache: 'no-cache'
      });
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      if (response.ok) {
        this.connectionQuality = responseTime < 1000 ? 'good' : 'poor';
      } else {
        this.connectionQuality = 'poor';
      }
    } catch (error) {
      this.connectionQuality = 'poor';
    }

    // 每30秒检查一次连接质量
    setTimeout(() => this.checkConnectionQuality(), 30000);
  }

  public getStatus(): { isOnline: boolean; quality: string } {
    return {
      isOnline: this.isOnline,
      quality: this.connectionQuality
    };
  }

  public addListener(callback: (status: boolean) => void): void {
    this.listeners.push(callback);
  }

  public removeListener(callback: (status: boolean) => void): void {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  private notifyListeners(isOnline: boolean): void {
    this.listeners.forEach(listener => listener(isOnline));
  }
}

// API错误处理器类
export class APIErrorHandler {
  private retryConfig: RetryConfig;
  private networkMonitor: NetworkMonitor;
  private requestQueue: Map<string, Promise<any>> = new Map();

  constructor(config?: Partial<RetryConfig>) {
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
    this.networkMonitor = new NetworkMonitor();
  }

  // 处理API请求
  async handleRequest<T>(
    requestFn: () => Promise<Response>,
    options?: {
      retryConfig?: Partial<RetryConfig>;
      fallback?: () => Promise<T>;
      cacheKey?: string;
    }
  ): Promise<APIResponse<T>> {
    const config = { ...this.retryConfig, ...options?.retryConfig };
    const cacheKey = options?.cacheKey;

    // 检查是否有相同的请求正在进行
    if (cacheKey && this.requestQueue.has(cacheKey)) {
      Logger.debug(`使用缓存的请求: ${cacheKey}`, undefined, 'APIErrorHandler');
      return this.requestQueue.get(cacheKey);
    }

    const requestPromise = this.executeWithRetry(requestFn, config, options?.fallback);

    // 缓存请求
    if (cacheKey) {
      this.requestQueue.set(cacheKey, requestPromise);
      requestPromise.finally(() => {
        this.requestQueue.delete(cacheKey);
      });
    }

    return requestPromise;
  }

  // 执行带重试的请求
  private async executeWithRetry<T>(
    requestFn: () => Promise<Response>,
    config: RetryConfig,
    fallback?: () => Promise<T>
  ): Promise<APIResponse<T>> {
    let lastError: APIError | NetworkError | null = null;

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        // 检查网络状态
        const networkStatus = this.networkMonitor.getStatus();
        if (!networkStatus.isOnline) {
          throw this.createNetworkError('设备离线，请检查网络连接', false);
        }

        Logger.debug(`API请求尝试 ${attempt + 1}/${config.maxRetries + 1}`, undefined, 'APIErrorHandler');

        const response = await requestFn();
        
        if (response.ok) {
          const data = await response.json();
          Logger.debug('API请求成功', { statusCode: response.status }, 'APIErrorHandler');
          
          return {
            data,
            success: true,
            statusCode: response.status
          };
        } else {
          // 创建API错误
          const apiError = await this.createAPIError(response);
          
          // 检查是否可重试
          if (attempt < config.maxRetries && this.isRetryable(response.status, config)) {
            lastError = apiError;
            await this.delay(this.calculateDelay(attempt, config));
            continue;
          } else {
            throw apiError;
          }
        }
      } catch (error) {
        if (error instanceof TypeError && error.message.includes('fetch')) {
          // 网络错误
          const networkError = this.createNetworkError(
            '网络请求失败，请检查网络连接',
            this.networkMonitor.getStatus().isOnline
          );
          
          if (attempt < config.maxRetries) {
            lastError = networkError;
            await this.delay(this.calculateDelay(attempt, config));
            continue;
          } else {
            throw networkError;
          }
        } else if (error instanceof APIError || error instanceof NetworkError) {
          throw error;
        } else {
          // 其他错误
          const systemError = ErrorHandler.createError(
            ErrorType.SYSTEM_ERROR,
            ErrorSeverity.HIGH,
            `请求处理失败: ${error instanceof Error ? error.message : String(error)}`,
            error instanceof Error ? error : undefined,
            'APIErrorHandler'
          ) as APIError;
          
          throw systemError;
        }
      }
    }

    // 所有重试都失败了
    if (lastError) {
      ErrorHandler.handleError(lastError, 'APIErrorHandler');
      
      // 尝试使用降级策略
      if (fallback) {
        try {
          Logger.info('尝试使用降级策略', undefined, 'APIErrorHandler');
          const fallbackData = await fallback();
          return {
            data: fallbackData,
            success: true,
            error: lastError
          };
        } catch (fallbackError) {
          Logger.error('降级策略也失败了', fallbackError as Error, 'APIErrorHandler');
        }
      }

      return {
        success: false,
        error: lastError
      };
    }

    // 这种情况理论上不应该发生
    const unknownError = ErrorHandler.createError(
      ErrorType.SYSTEM_ERROR,
      ErrorSeverity.HIGH,
      '未知的API错误',
      undefined,
      'APIErrorHandler'
    ) as APIError;

    return {
      success: false,
      error: unknownError
    };
  }

  // 创建API错误
  private async createAPIError(response: Response): Promise<APIError> {
    let errorMessage = `API请求失败 (${response.status})`;
    
    try {
      const errorData = await response.json();
      if (errorData.message) {
        errorMessage = errorData.message;
      } else if (errorData.error) {
        errorMessage = errorData.error;
      }
    } catch (e) {
      // 无法解析响应体，使用默认错误消息
      errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    }

    const apiError = ErrorHandler.createError(
      ErrorType.API_ERROR,
      this.getErrorSeverity(response.status),
      errorMessage,
      undefined,
      'APIErrorHandler'
    ) as APIError;

    apiError.statusCode = response.status;
    apiError.endpoint = response.url;
    apiError.retryable = this.isRetryable(response.status, this.retryConfig);

    return apiError;
  }

  // 创建网络错误
  private createNetworkError(message: string, isOnline: boolean): NetworkError {
    const networkError = ErrorHandler.createError(
      ErrorType.NETWORK_ERROR,
      ErrorSeverity.HIGH,
      message,
      undefined,
      'APIErrorHandler'
    ) as NetworkError;

    networkError.isOnline = isOnline;
    networkError.connectionQuality = this.networkMonitor.getStatus().quality as any;

    return networkError;
  }

  // 获取错误严重程度
  private getErrorSeverity(statusCode: number): ErrorSeverity {
    if (statusCode >= 500) {
      return ErrorSeverity.HIGH;
    } else if (statusCode >= 400) {
      return ErrorSeverity.MEDIUM;
    } else {
      return ErrorSeverity.LOW;
    }
  }

  // 检查是否可重试
  private isRetryable(statusCode: number, config: RetryConfig): boolean {
    return config.retryableStatusCodes.includes(statusCode);
  }

  // 计算延迟时间
  private calculateDelay(attempt: number, config: RetryConfig): number {
    const delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt);
    return Math.min(delay, config.maxDelay);
  }

  // 延迟函数
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 获取网络状态
  public getNetworkStatus(): { isOnline: boolean; quality: string } {
    return this.networkMonitor.getStatus();
  }

  // 添加网络状态监听器
  public addNetworkListener(callback: (status: boolean) => void): void {
    this.networkMonitor.addListener(callback);
  }

  // 移除网络状态监听器
  public removeNetworkListener(callback: (status: boolean) => void): void {
    this.networkMonitor.removeListener(callback);
  }

  // 清除请求缓存
  public clearRequestCache(): void {
    this.requestQueue.clear();
  }

  // 更新重试配置
  public updateRetryConfig(config: Partial<RetryConfig>): void {
    this.retryConfig = { ...this.retryConfig, ...config };
  }
}

// 导出单例实例
export const apiErrorHandler = new APIErrorHandler(); 