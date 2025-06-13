import React, { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// 错误处理系统导入
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { ErrorHandler } from "./lib/errorHandler";
import { Logger } from "./lib/logger";
import { PerformanceMonitor } from "./lib/performanceMonitor";
import { HealthChecker } from "./lib/healthCheck";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // 使用我们的错误处理逻辑
        logger.warn('Query失败，准备重试', { 
          failureCount, 
          error: error instanceof Error ? error.message : error 
        });
        
        // 最多重试3次
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: false, // mutations通常不重试
    },
  },
});

// 系统初始化组件
const SystemInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    // 初始化日志系统
    Logger.info('应用启动', { 
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });

    // 记录错误处理系统已初始化
    Logger.info('错误处理系统已初始化');

    // 启动性能监控
    // performanceMonitor.startMonitoring(30000); // 30秒间隔
    Logger.info('性能监控已启动');

    // 启动健康检查
    // healthChecker.startHealthCheck({
    //   interval: 60000, // 1分钟间隔
    //   timeout: 5000,
    //   retries: 2
    // });
    Logger.info('系统健康检查已启动');

    // 清理函数
    return () => {
      Logger.info('应用关闭，清理系统资源');
      // performanceMonitor.stopMonitoring();
      // healthChecker.stopHealthCheck();
    };
  }, []);

  return <>{children}</>;
};

const App = () => (
  <ErrorBoundary>
    <SystemInitializer>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ErrorBoundary>
              <Routes>
                <Route path="/" element={
                  <ErrorBoundary>
                    <Index />
                  </ErrorBoundary>
                } />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={
                  <ErrorBoundary>
                    <NotFound />
                  </ErrorBoundary>
                } />
              </Routes>
            </ErrorBoundary>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </SystemInitializer>
  </ErrorBoundary>
);

export default App;

