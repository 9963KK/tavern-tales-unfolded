import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  Settings, 
  BarChart3, 
  Trash2, 
  RefreshCw, 
  Clock, 
  Zap, 
  Target,
  TrendingUp,
  Users,
  MessageSquare,
  Gauge
} from 'lucide-react';
import { 
  contextManager, 
  getEnhancedAIResponseStats,
  clearEnhancedAIResponseCache,
  updateEnhancedAIResponseConfig,
  EnhancedAIResponseConfig
} from '@/lib/enhancedAIResponse';
import { ContextManagerConfig, PerformanceStats, ContextProcessingResult } from '@/lib/contextManager';

interface ContextManagerPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const ContextManagerPanel: React.FC<ContextManagerPanelProps> = ({ isOpen, onClose }) => {
  const [config, setConfig] = useState<ContextManagerConfig | null>(null);
  const [stats, setStats] = useState<PerformanceStats | null>(null);
  const [processingHistory, setProcessingHistory] = useState<ContextProcessingResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 加载配置和统计信息
  const loadData = async () => {
    setIsLoading(true);
    try {
      const currentConfig = contextManager.getConfig();
      const currentStats = contextManager.getPerformanceStats();
      const history = contextManager.getProcessingHistory(20);
      
      setConfig(currentConfig);
      setStats(currentStats);
      setProcessingHistory(history);
    } catch (error) {
      console.error('加载上下文管理数据失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
      // 定期刷新统计信息
      const interval = setInterval(loadData, 5000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  // 更新配置
  const updateConfig = (updates: Partial<ContextManagerConfig>) => {
    if (!config) return;
    
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    contextManager.updateConfig(newConfig);
    
    // 同时更新增强AI响应配置
    updateEnhancedAIResponseConfig({
      enableContextPruning: newConfig.enablePersonalization,
      maxContextTokens: newConfig.pruning.maxTokens,
      enablePersonalization: newConfig.enablePersonalization,
      debugMode: newConfig.enableDebugMode
    });
  };

  // 清理缓存
  const handleClearCache = () => {
    clearEnhancedAIResponseCache();
    loadData();
  };

  // 格式化时间
  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  // 格式化百分比
  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[90vw] h-[90vh] max-w-6xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Brain className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold">上下文管理控制台</h2>
              <p className="text-sm text-gray-600">动态上下文裁剪系统配置与监控</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              刷新
            </Button>
            <Button variant="outline" size="sm" onClick={onClose}>
              关闭
            </Button>
          </div>
        </div>

        <div className="p-6 h-[calc(100%-80px)] overflow-y-auto">
          <Tabs defaultValue="overview" className="h-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">概览</TabsTrigger>
              <TabsTrigger value="config">配置</TabsTrigger>
              <TabsTrigger value="performance">性能</TabsTrigger>
              <TabsTrigger value="history">历史</TabsTrigger>
            </TabsList>

            {/* 概览标签页 */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">总处理次数</CardTitle>
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.totalProcessed || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      累计处理的对话数量
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">平均处理时间</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats ? formatTime(stats.averageProcessingTime) : '0ms'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      每次处理的平均耗时
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">缓存命中率</CardTitle>
                    <Zap className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats ? formatPercentage(stats.cacheHitRate) : '0%'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      缓存提升性能效果
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">错误率</CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats ? formatPercentage(stats.errorRate) : '0%'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      处理失败的比例
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* 系统状态 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gauge className="w-5 h-5" />
                    系统状态
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>上下文裁剪</span>
                        <Badge variant={config?.enablePersonalization ? "default" : "secondary"}>
                          {config?.enablePersonalization ? "启用" : "禁用"}
                        </Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>个性化策略</span>
                        <Badge variant={config?.enablePersonalization ? "default" : "secondary"}>
                          {config?.enablePersonalization ? "启用" : "禁用"}
                        </Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>自适应学习</span>
                        <Badge variant={config?.enableAdaptiveLearning ? "default" : "secondary"}>
                          {config?.enableAdaptiveLearning ? "启用" : "禁用"}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>缓存系统</span>
                        <Badge variant={config?.enableCaching ? "default" : "secondary"}>
                          {config?.enableCaching ? "启用" : "禁用"}
                        </Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>调试模式</span>
                        <Badge variant={config?.enableDebugMode ? "destructive" : "secondary"}>
                          {config?.enableDebugMode ? "启用" : "禁用"}
                        </Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>集成模式</span>
                        <Badge variant="outline">
                          {config?.integrationMode || 'enhanced'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 最近处理结果 */}
              {processingHistory.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      最近处理结果
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {processingHistory.slice(0, 5).map((result, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center gap-2">
                            <Badge variant={result.success ? "default" : "destructive"}>
                              {result.success ? "成功" : "失败"}
                            </Badge>
                            <span className="text-sm">
                              {result.originalMessageCount} → {result.finalMessageCount} 消息
                            </span>
                            <span className="text-sm text-gray-600">
                              {result.strategy}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span>{result.tokenReduction.toFixed(1)}% 减少</span>
                            <span>{formatTime(result.processingTime)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* 配置标签页 */}
            <TabsContent value="config" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 基础配置 */}
                <Card>
                  <CardHeader>
                    <CardTitle>基础配置</CardTitle>
                    <CardDescription>上下文裁剪的基本参数</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">最大Token数量</label>
                      <Slider
                        value={[config?.pruning.maxTokens || 4000]}
                        onValueChange={([value]) => updateConfig({
                          pruning: { ...config!.pruning, maxTokens: value }
                        })}
                        max={8000}
                        min={1000}
                        step={100}
                        className="w-full"
                      />
                      <div className="text-xs text-gray-600">
                        当前: {config?.pruning.maxTokens || 4000} tokens
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">最小保留比例</label>
                      <Slider
                        value={[config?.pruning.minRetainRatio || 0.3]}
                        onValueChange={([value]) => updateConfig({
                          pruning: { ...config!.pruning, minRetainRatio: value }
                        })}
                        max={1}
                        min={0.1}
                        step={0.05}
                        className="w-full"
                      />
                      <div className="text-xs text-gray-600">
                        当前: {formatPercentage(config?.pruning.minRetainRatio || 0.3)}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">话题相关性阈值</label>
                      <Slider
                        value={[config?.pruning.topicRelevanceThreshold || 0.3]}
                        onValueChange={([value]) => updateConfig({
                          pruning: { ...config!.pruning, topicRelevanceThreshold: value }
                        })}
                        max={1}
                        min={0}
                        step={0.05}
                        className="w-full"
                      />
                      <div className="text-xs text-gray-600">
                        当前: {config?.pruning.topicRelevanceThreshold || 0.3}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 个性化配置 */}
                <Card>
                  <CardHeader>
                    <CardTitle>个性化配置</CardTitle>
                    <CardDescription>基于角色特征的智能裁剪</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">启用个性化裁剪</label>
                      <Switch
                        checked={config?.enablePersonalization || false}
                        onCheckedChange={(checked) => updateConfig({ enablePersonalization: checked })}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">个性化权重</label>
                      <Slider
                        value={[config?.personalityWeight || 0.4]}
                        onValueChange={([value]) => updateConfig({ personalityWeight: value })}
                        max={1}
                        min={0}
                        step={0.1}
                        className="w-full"
                        disabled={!config?.enablePersonalization}
                      />
                      <div className="text-xs text-gray-600">
                        当前: {config?.personalityWeight || 0.4}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">自适应学习</label>
                      <Switch
                        checked={config?.enableAdaptiveLearning || false}
                        onCheckedChange={(checked) => updateConfig({ enableAdaptiveLearning: checked })}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">学习率</label>
                      <Slider
                        value={[config?.learningRate || 0.1]}
                        onValueChange={([value]) => updateConfig({ learningRate: value })}
                        max={0.5}
                        min={0.01}
                        step={0.01}
                        className="w-full"
                        disabled={!config?.enableAdaptiveLearning}
                      />
                      <div className="text-xs text-gray-600">
                        当前: {config?.learningRate || 0.1}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 性能配置 */}
                <Card>
                  <CardHeader>
                    <CardTitle>性能配置</CardTitle>
                    <CardDescription>缓存和调试选项</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">启用缓存</label>
                      <Switch
                        checked={config?.enableCaching || false}
                        onCheckedChange={(checked) => updateConfig({ enableCaching: checked })}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">最大缓存大小</label>
                      <Slider
                        value={[config?.maxCacheSize || 2000]}
                        onValueChange={([value]) => updateConfig({ maxCacheSize: value })}
                        max={5000}
                        min={100}
                        step={100}
                        className="w-full"
                        disabled={!config?.enableCaching}
                      />
                      <div className="text-xs text-gray-600">
                        当前: {config?.maxCacheSize || 2000} 条目
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">调试模式</label>
                      <Switch
                        checked={config?.enableDebugMode || false}
                        onCheckedChange={(checked) => updateConfig({ enableDebugMode: checked })}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">回退阈值</label>
                      <Slider
                        value={[config?.fallbackThreshold || 0.8]}
                        onValueChange={([value]) => updateConfig({ fallbackThreshold: value })}
                        max={1}
                        min={0.1}
                        step={0.05}
                        className="w-full"
                      />
                      <div className="text-xs text-gray-600">
                        当前: {config?.fallbackThreshold || 0.8}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 操作按钮 */}
                <Card>
                  <CardHeader>
                    <CardTitle>系统操作</CardTitle>
                    <CardDescription>缓存管理和系统维护</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button
                      variant="outline"
                      onClick={handleClearCache}
                      className="w-full"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      清理所有缓存
                    </Button>

                    <Button
                      variant="outline"
                      onClick={loadData}
                      className="w-full"
                      disabled={isLoading}
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                      刷新统计数据
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* 性能标签页 */}
            <TabsContent value="performance" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>性能指标</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>缓存命中率</span>
                        <span>{stats ? formatPercentage(stats.cacheHitRate) : '0%'}</span>
                      </div>
                      <Progress value={(stats?.cacheHitRate || 0) * 100} />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>错误率</span>
                        <span>{stats ? formatPercentage(stats.errorRate) : '0%'}</span>
                      </div>
                      <Progress value={(stats?.errorRate || 0) * 100} className="bg-red-100" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Token节省率</span>
                        <span>{stats ? formatPercentage(stats.tokenSavingsRate) : '0%'}</span>
                      </div>
                      <Progress value={(stats?.tokenSavingsRate || 0) * 100} className="bg-green-100" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>处理时间分布</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {processingHistory.slice(0, 10).map((result, index) => (
                        <div key={index} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>处理 #{processingHistory.length - index}</span>
                            <span>{formatTime(result.processingTime)}</span>
                          </div>
                          <Progress 
                            value={Math.min((result.processingTime / 5000) * 100, 100)} 
                            className="h-2"
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* 历史标签页 */}
            <TabsContent value="history" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>处理历史</CardTitle>
                  <CardDescription>最近的上下文处理记录</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {processingHistory.map((result, index) => (
                      <div key={index} className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant={result.success ? "default" : "destructive"}>
                              {result.success ? "成功" : "失败"}
                            </Badge>
                            <Badge variant="outline">{result.strategy}</Badge>
                            {result.metadata.usedPersonalization && (
                              <Badge variant="secondary">个性化</Badge>
                            )}
                          </div>
                          <span className="text-sm text-gray-600">
                            {formatTime(result.processingTime)}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">消息数量:</span>
                            <br />
                            {result.originalMessageCount} → {result.finalMessageCount}
                          </div>
                          <div>
                            <span className="text-gray-600">Token减少:</span>
                            <br />
                            {result.tokenReduction.toFixed(1)}%
                          </div>
                          <div>
                            <span className="text-gray-600">话题关键词:</span>
                            <br />
                            {result.metadata.topicKeywords.slice(0, 3).join(', ') || '无'}
                          </div>
                        </div>

                        {result.error && (
                          <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                            错误: {result.error}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ContextManagerPanel; 