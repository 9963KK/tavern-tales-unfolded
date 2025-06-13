import { Logger } from './logger';
import { ErrorHandler } from './errorHandler';
import { ErrorType, ErrorSeverity, HealthStatus } from '../types/error';

interface HealthCheckConfig {
  interval: number; // 检查间隔（毫秒）
  timeout: number; // 超时时间（毫秒）
  retries: number; // 重试次数
}

interface HealthCheckResult {
  status: HealthStatus;
  checks: {
    network: boolean;
    api: boolean;
    localStorage: boolean;
    memory: boolean;
    performance: boolean;
  };
  details: {
    networkLatency?: number;
    apiResponseTime?: number;
    memoryUsage?: number;
    performanceScore?: number;
    errors: string[];
  };
  timestamp: number;
}

interface HealthReport {
  overall: HealthStatus;
  uptime: number;
  lastCheck: HealthCheckResult;
  history: HealthCheckResult[];
  recommendations: string[];
}

class HealthCheckerClass {
  private static instance: HealthCheckerClass;
  private isRunning = false;
  private checkInterval: NodeJS.Timeout | null = null;
  private config: HealthCheckConfig = {
    interval: 60000, // 1分钟
    timeout: 5000, // 5秒
    retries: 2
  };
  private history: HealthCheckResult[] = [];
  private startTime = Date.now();

  private constructor() {
    // 私有构造函数
  }

  static getInstance(): HealthCheckerClass {
    if (!HealthCheckerClass.instance) {
      HealthCheckerClass.instance = new HealthCheckerClass();
    }
    return HealthCheckerClass.instance;
  }

  /**
   * 开始健康检查
   */
  startHealthCheck(config?: Partial<HealthCheckConfig>): void {
    if (this.isRunning) {
      Logger.warn('健康检查已在运行');
      return;
    }

    if (config) {
      this.config = { ...this.config, ...config };
    }

    this.isRunning = true;
    this.startTime = Date.now();
    Logger.info('开始系统健康检查', this.config);

    // 立即执行一次检查
    this.performHealthCheck();

    // 定期执行检查
    this.checkInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.config.interval);
  }

  /**
   * 停止健康检查
   */
  stopHealthCheck(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    Logger.info('停止系统健康检查');
  }

  /**
   * 执行健康检查
   */
  private async performHealthCheck(): Promise<void> {
    try {
      Logger.debug('开始执行健康检查');

      const result: HealthCheckResult = {
        status: HealthStatus.HEALTHY,
        checks: {
          network: false,
          api: false,
          localStorage: false,
          memory: false,
          performance: false
        },
        details: {
          errors: []
        },
        timestamp: Date.now()
      };

      // 并行执行所有检查
      const checks = await Promise.allSettled([
        this.checkNetwork(),
        this.checkAPI(),
        this.checkLocalStorage(),
        this.checkMemory(),
        this.checkPerformance()
      ]);

      // 处理检查结果
      result.checks.network = checks[0].status === 'fulfilled' && checks[0].value.success;
      if (checks[0].status === 'fulfilled') {
        result.details.networkLatency = checks[0].value.latency;
      } else {
        result.details.errors.push(`网络检查失败: ${checks[0].reason}`);
      }

      result.checks.api = checks[1].status === 'fulfilled' && checks[1].value.success;
      if (checks[1].status === 'fulfilled') {
        result.details.apiResponseTime = checks[1].value.responseTime;
      } else {
        result.details.errors.push(`API检查失败: ${checks[1].reason}`);
      }

      result.checks.localStorage = checks[2].status === 'fulfilled' && checks[2].value;
      if (checks[2].status === 'rejected') {
        result.details.errors.push(`本地存储检查失败: ${checks[2].reason}`);
      }

      result.checks.memory = checks[3].status === 'fulfilled' && checks[3].value.healthy;
      if (checks[3].status === 'fulfilled') {
        result.details.memoryUsage = checks[3].value.usage;
      } else {
        result.details.errors.push(`内存检查失败: ${checks[3].reason}`);
      }

      result.checks.performance = checks[4].status === 'fulfilled' && checks[4].value.good;
      if (checks[4].status === 'fulfilled') {
        result.details.performanceScore = checks[4].value.score;
      } else {
        result.details.errors.push(`性能检查失败: ${checks[4].reason}`);
      }

      // 计算整体状态
      const passedChecks = Object.values(result.checks).filter(Boolean).length;
      const totalChecks = Object.keys(result.checks).length;

      if (passedChecks === totalChecks) {
        result.status = HealthStatus.HEALTHY;
      } else if (passedChecks >= totalChecks * 0.6) {
        result.status = HealthStatus.DEGRADED;
      } else {
        result.status = HealthStatus.UNHEALTHY;
      }

      // 记录结果
      this.history.push(result);
      if (this.history.length > 100) {
        this.history = this.history.slice(-100);
      }

      // 记录日志
      if (result.status === HealthStatus.HEALTHY) {
        Logger.debug('系统健康检查通过', result);
      } else {
        Logger.warn('系统健康检查发现问题', result);
        
        // 创建错误报告
        const error = ErrorHandler.createError(
          ErrorType.SYSTEM_ERROR,
          result.status === HealthStatus.UNHEALTHY ? ErrorSeverity.HIGH : ErrorSeverity.MEDIUM,
          `系统健康状态: ${result.status}`,
          undefined,
          'HealthChecker'
        );
        ErrorHandler.handleError(error);
      }

    } catch (error) {
      Logger.error('健康检查执行失败', error as Error);
    }
  }

  /**
   * 检查网络连接
   */
  private async checkNetwork(): Promise<{ success: boolean; latency?: number }> {
    const start = Date.now();
    
    try {
      // 使用一个轻量级的请求来测试网络
      const response = await fetch('https://httpbin.org/get', {
        method: 'GET',
        signal: AbortSignal.timeout(this.config.timeout)
      });
      
      const latency = Date.now() - start;
      return {
        success: response.ok,
        latency
      };
    } catch (error) {
      return { success: false };
    }
  }

  /**
   * 检查API配置
   */
  private async checkAPI(): Promise<{ success: boolean; responseTime?: number }> {
    const start = Date.now();
    
    try {
      // 检查是否有配置的API密钥
      const apiKeys = {
        openai: localStorage.getItem('openai_api_key'),
        anthropic: localStorage.getItem('anthropic_api_key'),
        gemini: localStorage.getItem('gemini_api_key')
      };

      const hasValidKey = Object.values(apiKeys).some(key => key && key.length > 0);
      
      if (!hasValidKey) {
        return { success: false };
      }

      const responseTime = Date.now() - start;
      return {
        success: true,
        responseTime
      };
    } catch (error) {
      return { success: false };
    }
  }

  /**
   * 检查本地存储
   */
  private async checkLocalStorage(): Promise<boolean> {
    try {
      const testKey = '__health_check_test__';
      const testValue = 'test';
      
      localStorage.setItem(testKey, testValue);
      const retrieved = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      
      return retrieved === testValue;
    } catch (error) {
      return false;
    }
  }

  /**
   * 检查内存使用
   */
  private async checkMemory(): Promise<{ healthy: boolean; usage?: number }> {
    try {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const usedMB = memory.usedJSHeapSize / 1024 / 1024;
        const limitMB = memory.jsHeapSizeLimit / 1024 / 1024;
        const usage = (usedMB / limitMB) * 100;
        
        return {
          healthy: usage < 80, // 内存使用率低于80%认为健康
          usage
        };
      }
      
      return { healthy: true }; // 无法检测时假设健康
    } catch (error) {
      return { healthy: false };
    }
  }

  /**
   * 检查性能
   */
  private async checkPerformance(): Promise<{ good: boolean; score?: number }> {
    try {
      // 简单的性能测试：测量一个计算密集型操作的时间
      const start = performance.now();
      
      // 执行一些计算
      let sum = 0;
      for (let i = 0; i < 100000; i++) {
        sum += Math.random();
      }
      
      const duration = performance.now() - start;
      const score = Math.max(0, 100 - duration); // 时间越短分数越高
      
      return {
        good: duration < 50, // 50ms以内认为性能良好
        score
      };
    } catch (error) {
      return { good: false };
    }
  }

  /**
   * 获取健康报告
   */
  getHealthReport(): HealthReport {
    const lastCheck = this.history[this.history.length - 1];
    const uptime = Date.now() - this.startTime;
    
    // 计算整体状态
    const recentChecks = this.history.slice(-10);
    const healthyCount = recentChecks.filter(check => check.status === HealthStatus.HEALTHY).length;
    const degradedCount = recentChecks.filter(check => check.status === HealthStatus.DEGRADED).length;
    
    let overall: HealthStatus;
    if (healthyCount >= recentChecks.length * 0.8) {
      overall = HealthStatus.HEALTHY;
    } else if (healthyCount + degradedCount >= recentChecks.length * 0.6) {
      overall = HealthStatus.DEGRADED;
    } else {
      overall = HealthStatus.UNHEALTHY;
    }

    // 生成建议
    const recommendations: string[] = [];
    if (lastCheck) {
      if (!lastCheck.checks.network) {
        recommendations.push('检查网络连接');
      }
      if (!lastCheck.checks.api) {
        recommendations.push('检查API配置');
      }
      if (!lastCheck.checks.localStorage) {
        recommendations.push('检查浏览器存储权限');
      }
      if (!lastCheck.checks.memory) {
        recommendations.push('考虑刷新页面以释放内存');
      }
      if (!lastCheck.checks.performance) {
        recommendations.push('关闭其他标签页以提升性能');
      }
    }

    return {
      overall,
      uptime,
      lastCheck: lastCheck || {
        status: HealthStatus.HEALTHY,
        checks: {
          network: true,
          api: true,
          localStorage: true,
          memory: true,
          performance: true
        },
        details: { errors: [] },
        timestamp: Date.now()
      },
      history: [...this.history],
      recommendations
    };
  }

  /**
   * 手动执行健康检查
   */
  async runHealthCheck(): Promise<HealthCheckResult> {
    await this.performHealthCheck();
    return this.history[this.history.length - 1];
  }

  /**
   * 清除历史记录
   */
  clearHistory(): void {
    this.history = [];
    Logger.info('清除健康检查历史记录');
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<HealthCheckConfig>): void {
    this.config = { ...this.config, ...newConfig };
    Logger.info('更新健康检查配置', newConfig);
    
    // 如果正在运行，重启以应用新配置
    if (this.isRunning) {
      this.stopHealthCheck();
      this.startHealthCheck();
    }
  }

  /**
   * 获取当前配置
   */
  getConfig(): HealthCheckConfig {
    return { ...this.config };
  }
}

// 导出单例实例
export const HealthChecker = HealthCheckerClass.getInstance();
export { type HealthCheckResult, type HealthReport }; 