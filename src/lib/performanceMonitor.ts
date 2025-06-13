import { Logger } from './logger';
import { ErrorHandler } from './errorHandler';
import { ErrorType, ErrorSeverity } from '../types/error';

interface PerformanceMetrics {
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  renderTime: number;
  apiResponseTime: number;
  errorRate: number;
  timestamp: number;
}

interface PerformanceThresholds {
  maxMemoryUsage: number; // MB
  maxRenderTime: number; // ms
  maxApiResponseTime: number; // ms
  maxErrorRate: number; // percentage
}

interface PerformanceAlert {
  metric: keyof PerformanceThresholds;
  value: number;
  threshold: number;
  severity: ErrorSeverity;
  timestamp: number;
}

class PerformanceMonitorClass {
  private static instance: PerformanceMonitorClass;
  private metrics: PerformanceMetrics[] = [];
  private alerts: PerformanceAlert[] = [];
  private isMonitoring = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  
  private readonly thresholds: PerformanceThresholds = {
    maxMemoryUsage: 100, // 100MB
    maxRenderTime: 16, // 16ms (60fps)
    maxApiResponseTime: 5000, // 5秒
    maxErrorRate: 5 // 5%
  };

  private constructor() {
    // 私有构造函数
  }

  static getInstance(): PerformanceMonitorClass {
    if (!PerformanceMonitorClass.instance) {
      PerformanceMonitorClass.instance = new PerformanceMonitorClass();
    }
    return PerformanceMonitorClass.instance;
  }

  /**
   * 开始性能监控
   */
  startMonitoring(interval: number = 30000): void {
    if (this.isMonitoring) {
      Logger.warn('性能监控已在运行');
      return;
    }

    this.isMonitoring = true;
    Logger.info('开始性能监控', { interval });

    // 立即收集一次指标
    this.collectMetrics();

    // 定期收集指标
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
    }, interval);

    // 监听页面可见性变化
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
  }

  /**
   * 停止性能监控
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    Logger.info('停止性能监控');
  }

  /**
   * 收集性能指标
   */
  private collectMetrics(): void {
    try {
      const metrics: PerformanceMetrics = {
        memoryUsage: this.getMemoryUsage(),
        renderTime: this.getRenderTime(),
        apiResponseTime: this.getAverageApiResponseTime(),
        errorRate: this.getErrorRate(),
        timestamp: Date.now()
      };

      this.metrics.push(metrics);
      this.checkThresholds(metrics);

      // 保持最近100条记录
      if (this.metrics.length > 100) {
        this.metrics = this.metrics.slice(-100);
      }

      Logger.debug('收集性能指标', metrics);
    } catch (error) {
      Logger.error('收集性能指标失败', error as Error);
    }
  }

  /**
   * 获取内存使用情况
   */
  private getMemoryUsage(): PerformanceMetrics['memoryUsage'] {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const used = memory.usedJSHeapSize / 1024 / 1024; // MB
      const total = memory.totalJSHeapSize / 1024 / 1024; // MB
      return {
        used,
        total,
        percentage: (used / total) * 100
      };
    }

    // 降级方案：估算内存使用
    return {
      used: 0,
      total: 0,
      percentage: 0
    };
  }

  /**
   * 获取渲染时间
   */
  private getRenderTime(): number {
    const entries = performance.getEntriesByType('measure');
    const renderEntries = entries.filter(entry => 
      entry.name.includes('render') || entry.name.includes('React')
    );

    if (renderEntries.length > 0) {
      return renderEntries[renderEntries.length - 1].duration;
    }

    return 0;
  }

  /**
   * 获取平均API响应时间
   */
  private getAverageApiResponseTime(): number {
    const entries = performance.getEntriesByType('navigation');
    if (entries.length > 0) {
      const navigation = entries[0] as PerformanceNavigationTiming;
      return navigation.responseEnd - navigation.requestStart;
    }

    return 0;
  }

  /**
   * 获取错误率
   */
  private getErrorRate(): number {
    const recentMetrics = this.metrics.slice(-10);
    if (recentMetrics.length === 0) return 0;

    const totalRequests = recentMetrics.length;
    const errorStats = ErrorHandler.getErrorStats();
    const errorCount = Object.values(errorStats).reduce((sum, count) => sum + count, 0);
    
    return (errorCount / totalRequests) * 100;
  }

  /**
   * 检查性能阈值
   */
  private checkThresholds(metrics: PerformanceMetrics): void {
    // 检查内存使用
    if (metrics.memoryUsage.used > this.thresholds.maxMemoryUsage) {
      this.createAlert('maxMemoryUsage', metrics.memoryUsage.used, ErrorSeverity.HIGH);
    }

    // 检查渲染时间
    if (metrics.renderTime > this.thresholds.maxRenderTime) {
      this.createAlert('maxRenderTime', metrics.renderTime, ErrorSeverity.MEDIUM);
    }

    // 检查API响应时间
    if (metrics.apiResponseTime > this.thresholds.maxApiResponseTime) {
      this.createAlert('maxApiResponseTime', metrics.apiResponseTime, ErrorSeverity.MEDIUM);
    }

    // 检查错误率
    if (metrics.errorRate > this.thresholds.maxErrorRate) {
      this.createAlert('maxErrorRate', metrics.errorRate, ErrorSeverity.HIGH);
    }
  }

  /**
   * 创建性能警报
   */
  private createAlert(
    metric: keyof PerformanceThresholds,
    value: number,
    severity: ErrorSeverity
  ): void {
    const alert: PerformanceAlert = {
      metric,
      value,
      threshold: this.thresholds[metric],
      severity,
      timestamp: Date.now()
    };

    this.alerts.push(alert);
    Logger.warn('性能警报', alert);

    // 触发错误处理
    const error = ErrorHandler.createError(
      ErrorType.SYSTEM_ERROR,
      severity,
      `性能指标 ${metric} 超过阈值`,
      undefined,
      'PerformanceMonitor'
    );
    ErrorHandler.handleError(error);

    // 保持最近50条警报
    if (this.alerts.length > 50) {
      this.alerts = this.alerts.slice(-50);
    }
  }

  /**
   * 处理页面可见性变化
   */
  private handleVisibilityChange(): void {
    if (document.hidden) {
      Logger.info('页面隐藏，暂停性能监控');
      if (this.monitoringInterval) {
        clearInterval(this.monitoringInterval);
        this.monitoringInterval = null;
      }
    } else {
      Logger.info('页面显示，恢复性能监控');
      if (this.isMonitoring && !this.monitoringInterval) {
        this.monitoringInterval = setInterval(() => {
          this.collectMetrics();
        }, 30000);
      }
    }
  }

  /**
   * 测量函数执行时间
   */
  measureFunction<T>(name: string, fn: () => T): T {
    const start = performance.now();
    try {
      const result = fn();
      const duration = performance.now() - start;
      
      performance.mark(`${name}-start`);
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);
      
      Logger.debug(`函数 ${name} 执行时间`, { duration });
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      Logger.error(`函数 ${name} 执行失败`, error as Error);
      throw error;
    }
  }

  /**
   * 测量异步函数执行时间
   */
  async measureAsyncFunction<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      
      performance.mark(`${name}-start`);
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);
      
      Logger.debug(`异步函数 ${name} 执行时间`, { duration });
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      Logger.error(`异步函数 ${name} 执行失败`, error as Error);
      throw error;
    }
  }

  /**
   * 获取性能报告
   */
  getPerformanceReport(): {
    metrics: PerformanceMetrics[];
    alerts: PerformanceAlert[];
    summary: {
      averageMemoryUsage: number;
      averageRenderTime: number;
      averageApiResponseTime: number;
      averageErrorRate: number;
      alertCount: number;
    };
  } {
    const summary = {
      averageMemoryUsage: this.calculateAverage(this.metrics.map(m => m.memoryUsage.used)),
      averageRenderTime: this.calculateAverage(this.metrics.map(m => m.renderTime)),
      averageApiResponseTime: this.calculateAverage(this.metrics.map(m => m.apiResponseTime)),
      averageErrorRate: this.calculateAverage(this.metrics.map(m => m.errorRate)),
      alertCount: this.alerts.length
    };

    return {
      metrics: [...this.metrics],
      alerts: [...this.alerts],
      summary
    };
  }

  /**
   * 计算平均值
   */
  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  /**
   * 清除历史数据
   */
  clearHistory(): void {
    this.metrics = [];
    this.alerts = [];
    Logger.info('清除性能监控历史数据');
  }

  /**
   * 更新性能阈值
   */
  updateThresholds(newThresholds: Partial<PerformanceThresholds>): void {
    Object.assign(this.thresholds, newThresholds);
    Logger.info('更新性能阈值', newThresholds);
  }

  /**
   * 获取当前阈值
   */
  getThresholds(): PerformanceThresholds {
    return { ...this.thresholds };
  }
}

// 导出单例实例
export const PerformanceMonitor = PerformanceMonitorClass.getInstance();
export { type PerformanceMetrics, type PerformanceAlert }; 