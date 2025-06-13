import { useState, useEffect, useCallback, useRef } from 'react';
import { Logger } from '../lib/logger';

// 网络状态接口
export interface NetworkStatus {
  isOnline: boolean;
  connectionType: string;
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
}

// 连接质量类型
export type ConnectionQuality = 'excellent' | 'good' | 'poor' | 'offline';

// Hook返回值接口
interface UseNetworkStatusReturn {
  isOnline: boolean;
  connectionQuality: ConnectionQuality;
  networkStatus: NetworkStatus | null;
  isReconnecting: boolean;
  reconnect: () => Promise<void>;
  lastOnlineTime: Date | null;
  lastOfflineTime: Date | null;
}

// 获取网络信息
const getNetworkInfo = (): NetworkStatus | null => {
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    return {
      isOnline: navigator.onLine,
      connectionType: connection.type || 'unknown',
      effectiveType: connection.effectiveType || 'unknown',
      downlink: connection.downlink || 0,
      rtt: connection.rtt || 0,
      saveData: connection.saveData || false
    };
  }
  
  return {
    isOnline: navigator.onLine,
    connectionType: 'unknown',
    effectiveType: 'unknown',
    downlink: 0,
    rtt: 0,
    saveData: false
  };
};

// 评估连接质量
const evaluateConnectionQuality = (networkStatus: NetworkStatus | null): ConnectionQuality => {
  if (!networkStatus || !networkStatus.isOnline) {
    return 'offline';
  }

  const { effectiveType, downlink, rtt } = networkStatus;

  // 基于有效连接类型评估
  if (effectiveType === '4g' || effectiveType === '5g') {
    if (downlink >= 10 && rtt <= 100) {
      return 'excellent';
    } else if (downlink >= 1.5 && rtt <= 300) {
      return 'good';
    } else {
      return 'poor';
    }
  } else if (effectiveType === '3g') {
    if (downlink >= 0.7 && rtt <= 500) {
      return 'good';
    } else {
      return 'poor';
    }
  } else if (effectiveType === '2g' || effectiveType === 'slow-2g') {
    return 'poor';
  }

  // 基于下载速度和延迟评估
  if (downlink >= 5 && rtt <= 150) {
    return 'excellent';
  } else if (downlink >= 1 && rtt <= 400) {
    return 'good';
  } else {
    return 'poor';
  }
};

// 测试网络连接
const testConnection = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch('/favicon.ico', {
      method: 'HEAD',
      cache: 'no-cache',
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    Logger.debug('网络连接测试失败', error, 'useNetworkStatus');
    return false;
  }
};

export const useNetworkStatus = (): UseNetworkStatusReturn => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus | null>(getNetworkInfo());
  const [connectionQuality, setConnectionQuality] = useState<ConnectionQuality>(
    evaluateConnectionQuality(getNetworkInfo())
  );
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [lastOnlineTime, setLastOnlineTime] = useState<Date | null>(
    navigator.onLine ? new Date() : null
  );
  const [lastOfflineTime, setLastOfflineTime] = useState<Date | null>(null);

  const reconnectTimeoutRef = useRef<number | null>(null);
  const qualityCheckIntervalRef = useRef<number | null>(null);

  // 更新网络状态
  const updateNetworkStatus = useCallback(() => {
    const newNetworkStatus = getNetworkInfo();
    const newQuality = evaluateConnectionQuality(newNetworkStatus);
    
    setNetworkStatus(newNetworkStatus);
    setConnectionQuality(newQuality);
    
    Logger.debug('网络状态更新', {
      isOnline: newNetworkStatus?.isOnline,
      quality: newQuality,
      effectiveType: newNetworkStatus?.effectiveType,
      downlink: newNetworkStatus?.downlink,
      rtt: newNetworkStatus?.rtt
    }, 'useNetworkStatus');
  }, []);

  // 处理在线状态变化
  const handleOnline = useCallback(() => {
    setIsOnline(true);
    setLastOnlineTime(new Date());
    setIsReconnecting(false);
    updateNetworkStatus();
    
    Logger.info('网络连接已恢复', undefined, 'useNetworkStatus');
    
    // 清除重连超时
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, [updateNetworkStatus]);

  // 处理离线状态变化
  const handleOffline = useCallback(() => {
    setIsOnline(false);
    setLastOfflineTime(new Date());
    setConnectionQuality('offline');
    
    Logger.warn('网络连接已断开', undefined, 'useNetworkStatus');
    
    // 开始自动重连尝试
    const attemptReconnect = async () => {
      setIsReconnecting(true);
      
      const isConnected = await testConnection();
      if (isConnected) {
        handleOnline();
      } else {
        // 5秒后再次尝试
        reconnectTimeoutRef.current = window.setTimeout(attemptReconnect, 5000);
      }
    };
    
    // 延迟1秒开始重连，避免频繁尝试
    reconnectTimeoutRef.current = window.setTimeout(attemptReconnect, 1000);
  }, [handleOnline]);

  // 手动重连
  const reconnect = useCallback(async (): Promise<void> => {
    if (isReconnecting) {
      Logger.debug('重连已在进行中', undefined, 'useNetworkStatus');
      return;
    }

    setIsReconnecting(true);
    Logger.info('开始手动重连', undefined, 'useNetworkStatus');

    try {
      const isConnected = await testConnection();
      if (isConnected) {
        handleOnline();
      } else {
        setIsReconnecting(false);
        Logger.warn('手动重连失败', undefined, 'useNetworkStatus');
      }
    } catch (error) {
      setIsReconnecting(false);
      Logger.error('重连过程中出错', error as Error, 'useNetworkStatus');
    }
  }, [isReconnecting, handleOnline]);

  // 定期检查连接质量
  const startQualityCheck = useCallback(() => {
    if (qualityCheckIntervalRef.current) {
      clearInterval(qualityCheckIntervalRef.current);
    }

    qualityCheckIntervalRef.current = window.setInterval(() => {
      if (navigator.onLine) {
        updateNetworkStatus();
      }
    }, 30000); // 每30秒检查一次
  }, [updateNetworkStatus]);

  // 设置事件监听器
  useEffect(() => {
    // 监听网络状态变化
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 监听连接信息变化
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection && typeof connection.addEventListener === 'function') {
        connection.addEventListener('change', updateNetworkStatus);
      }
    }

    // 开始定期质量检查
    startQualityCheck();

    // 初始状态检查
    updateNetworkStatus();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);

      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        if (connection && typeof connection.removeEventListener === 'function') {
          connection.removeEventListener('change', updateNetworkStatus);
        }
      }

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      if (qualityCheckIntervalRef.current) {
        clearInterval(qualityCheckIntervalRef.current);
      }
    };
  }, [handleOnline, handleOffline, updateNetworkStatus, startQualityCheck]);

  // 页面可见性变化时检查网络状态
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && navigator.onLine) {
        updateNetworkStatus();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [updateNetworkStatus]);

  return {
    isOnline,
    connectionQuality,
    networkStatus,
    isReconnecting,
    reconnect,
    lastOnlineTime,
    lastOfflineTime
  };
};

// 网络状态指示器组件
export const NetworkStatusIndicator: React.FC<{
  className?: string;
  showDetails?: boolean;
}> = ({ className = '', showDetails = false }) => {
  const { isOnline, connectionQuality, isReconnecting, reconnect } = useNetworkStatus();

  const getStatusColor = () => {
    if (isReconnecting) return 'text-yellow-500';
    if (!isOnline) return 'text-red-500';
    
    switch (connectionQuality) {
      case 'excellent': return 'text-green-500';
      case 'good': return 'text-blue-500';
      case 'poor': return 'text-orange-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusText = () => {
    if (isReconnecting) return '重连中...';
    if (!isOnline) return '离线';
    
    switch (connectionQuality) {
      case 'excellent': return '网络优秀';
      case 'good': return '网络良好';
      case 'poor': return '网络较差';
      default: return '网络状态未知';
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={`w-2 h-2 rounded-full ${getStatusColor().replace('text-', 'bg-')}`} />
      {showDetails && (
        <>
          <span className={`text-xs ${getStatusColor()}`}>
            {getStatusText()}
          </span>
          {!isOnline && !isReconnecting && (
            <button
              onClick={reconnect}
              className="text-xs text-blue-500 hover:text-blue-700 underline"
            >
              重连
            </button>
          )}
        </>
      )}
    </div>
  );
}; 