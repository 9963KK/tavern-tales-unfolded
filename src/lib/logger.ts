import { ErrorType, ErrorSeverity, BaseError } from '../types/error';

// 日志级别
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

// 日志条目接口
interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  data?: any;
  error?: Error;
  context?: string;
}

// 日志配置
interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableStorage: boolean;
  maxStorageEntries: number;
}

class LoggerClass {
  private config: LoggerConfig = {
    level: LogLevel.INFO,
    enableConsole: true,
    enableStorage: true,
    maxStorageEntries: 1000
  };

  private logs: LogEntry[] = [];

  constructor() {
    // 在开发环境启用调试日志
    if (import.meta.env.DEV) {
      this.config.level = LogLevel.DEBUG;
    }
  }

  // 配置日志器
  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // 调试日志
  debug(message: string, data?: any, context?: string): void {
    this.log(LogLevel.DEBUG, message, data, undefined, context);
  }

  // 信息日志
  info(message: string, data?: any, context?: string): void {
    this.log(LogLevel.INFO, message, data, undefined, context);
  }

  // 警告日志
  warn(message: string, data?: any, context?: string): void {
    this.log(LogLevel.WARN, message, data, undefined, context);
  }

  // 错误日志
  error(message: string, error?: Error, context?: string): void {
    this.log(LogLevel.ERROR, message, undefined, error, context);
  }

  // 记录错误对象
  logError(error: BaseError, context?: string): void {
    this.log(
      this.severityToLogLevel(error.severity),
      error.message,
      {
        id: error.id,
        type: error.type,
        userMessage: error.userMessage
      },
      error.stack ? new Error(error.stack) : undefined,
      context || error.context
    );
  }

  // 核心日志方法
  private log(
    level: LogLevel,
    message: string,
    data?: any,
    error?: Error,
    context?: string
  ): void {
    // 检查日志级别
    if (level < this.config.level) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      data,
      error,
      context
    };

    // 存储日志
    if (this.config.enableStorage) {
      this.storeLog(entry);
    }

    // 控制台输出
    if (this.config.enableConsole) {
      this.consoleLog(entry);
    }
  }

  // 存储日志
  private storeLog(entry: LogEntry): void {
    this.logs.push(entry);

    // 限制存储数量
    if (this.logs.length > this.config.maxStorageEntries) {
      this.logs = this.logs.slice(-this.config.maxStorageEntries);
    }

    // 尝试持久化到localStorage
    try {
      const recentLogs = this.logs.slice(-100); // 只保存最近100条
      localStorage.setItem('app_logs', JSON.stringify(recentLogs));
    } catch (e) {
      // localStorage可能已满，忽略错误
    }
  }

  // 控制台输出
  private consoleLog(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const context = entry.context ? `[${entry.context}]` : '';
    const prefix = `${timestamp} ${context}`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(`${prefix} DEBUG:`, entry.message, entry.data);
        break;
      case LogLevel.INFO:
        console.info(`${prefix} INFO:`, entry.message, entry.data);
        break;
      case LogLevel.WARN:
        console.warn(`${prefix} WARN:`, entry.message, entry.data);
        break;
      case LogLevel.ERROR:
        console.error(`${prefix} ERROR:`, entry.message, entry.error || entry.data);
        if (entry.error?.stack) {
          console.error('Stack trace:', entry.error.stack);
        }
        break;
    }
  }

  // 错误严重程度转换为日志级别
  private severityToLogLevel(severity: ErrorSeverity): LogLevel {
    switch (severity) {
      case ErrorSeverity.LOW:
        return LogLevel.INFO;
      case ErrorSeverity.MEDIUM:
        return LogLevel.WARN;
      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL:
        return LogLevel.ERROR;
      default:
        return LogLevel.INFO;
    }
  }

  // 获取日志
  getLogs(level?: LogLevel, limit?: number): LogEntry[] {
    let filteredLogs = this.logs;

    if (level !== undefined) {
      filteredLogs = this.logs.filter(log => log.level >= level);
    }

    if (limit) {
      filteredLogs = filteredLogs.slice(-limit);
    }

    return filteredLogs;
  }

  // 清除日志
  clearLogs(): void {
    this.logs = [];
    try {
      localStorage.removeItem('app_logs');
    } catch (e) {
      // 忽略错误
    }
  }

  // 导出日志
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  // 从localStorage恢复日志
  restoreLogs(): void {
    try {
      const stored = localStorage.getItem('app_logs');
      if (stored) {
        const logs = JSON.parse(stored);
        this.logs = logs.map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp)
        }));
      }
    } catch (e) {
      this.warn('无法恢复日志', e);
    }
  }
}

// 导出单例实例
export const Logger = new LoggerClass();

// 在应用启动时恢复日志
Logger.restoreLogs(); 