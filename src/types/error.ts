// 错误类型枚举
export enum ErrorType {
  NETWORK_ERROR = 'network_error',
  API_ERROR = 'api_error',
  VALIDATION_ERROR = 'validation_error',
  COMPONENT_ERROR = 'component_error',
  SYSTEM_ERROR = 'system_error',
  USER_INPUT_ERROR = 'user_input_error'
}

// 错误严重程度
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// 健康状态枚举
export enum HealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy'
}

// 基础错误接口
export interface BaseError {
  id: string;
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  timestamp: Date;
  context?: string;
  stack?: string;
  userMessage?: string;
}

// API错误接口
export interface APIError extends BaseError {
  type: ErrorType.API_ERROR;
  statusCode?: number;
  endpoint?: string;
  retryable: boolean;
}

// 网络错误接口
export interface NetworkError extends BaseError {
  type: ErrorType.NETWORK_ERROR;
  isOnline: boolean;
  connectionQuality?: 'good' | 'poor' | 'offline';
}

// 验证错误接口
export interface ValidationError extends BaseError {
  type: ErrorType.VALIDATION_ERROR;
  field?: string;
  value?: any;
  rules?: string[];
}

// 组件错误接口
export interface ComponentError extends BaseError {
  type: ErrorType.COMPONENT_ERROR;
  componentName?: string;
  props?: any;
  recoverable: boolean;
}

// 错误报告接口
export interface ErrorReport {
  error: BaseError;
  userAgent: string;
  url: string;
  userId?: string;
  sessionId: string;
  additionalData?: Record<string, any>;
}

// 验证结果接口
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings?: string[];
}

// 重试选项接口
export interface RetryOptions {
  maxRetries: number;
  delay: number;
  backoff: boolean;
  fallback?: () => any;
}

// 错误恢复状态
export interface ErrorRecoveryState {
  error: BaseError | null;
  isRecovering: boolean;
  recoveryAttempts: number;
  lastRecoveryTime?: Date;
}

// 系统健康状态
export interface HealthReport {
  overall: 'healthy' | 'warning' | 'critical';
  memory: MemoryHealth;
  api: APIHealth;
  storage: StorageHealth;
  timestamp: Date;
}

export interface MemoryHealth {
  usage: number;
  limit: number;
  status: 'good' | 'warning' | 'critical';
}

export interface APIHealth {
  status: 'online' | 'offline' | 'degraded';
  responseTime: number;
  lastCheck: Date;
}

export interface StorageHealth {
  available: number;
  used: number;
  status: 'good' | 'warning' | 'full';
}

// 性能监控数据
export interface PerformanceReport {
  memoryStats: MemoryStats;
  renderStats: RenderStats;
  apiStats: APIStats;
  timestamp: Date;
}

export interface MemoryStats {
  used: number;
  total: number;
  percentage: number;
}

export interface RenderStats {
  averageRenderTime: number;
  slowComponents: string[];
  totalRenders: number;
}

export interface APIStats {
  totalRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  slowestEndpoint: string;
}

// 内存泄漏报告
export interface LeakReport {
  componentName: string;
  memoryIncrease: number;
  timestamp: Date;
  severity: ErrorSeverity;
} 