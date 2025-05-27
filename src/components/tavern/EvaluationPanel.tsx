import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, TrendingUp, Users, MessageCircle, Download } from 'lucide-react';
import SystemEvaluator, { EvaluationResult, testScenarios } from '@/utils/systemEvaluator';
import { AICharacter, Message } from '@/types/tavern';

interface EvaluationPanelProps {
  characters: AICharacter[];
  messages: Message[];
  currentTokenUsage: any[];
  isVisible: boolean;
  onToggle: () => void;
}

const EvaluationPanel: React.FC<EvaluationPanelProps> = ({
  characters,
  messages,
  currentTokenUsage,
  isVisible,
  onToggle
}) => {
  const [evaluator] = useState(() => new SystemEvaluator(characters));
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [testProgress, setTestProgress] = useState(0);

  // 更新评估数据
  useEffect(() => {
    messages.forEach(message => {
      evaluator.recordMessage(message);
    });
    setEvaluationResult(evaluator.generateEvaluationReport());
  }, [messages, evaluator]);

  // 运行自动化测试
  const runAutomatedTest = async () => {
    setIsRunningTest(true);
    setTestProgress(0);
    
    for (let i = 0; i < testScenarios.length; i++) {
      const scenario = testScenarios[i];
      console.log(`运行测试场景: ${scenario.name}`);
      
      // 模拟测试执行
      await new Promise(resolve => setTimeout(resolve, 2000));
      setTestProgress(((i + 1) / testScenarios.length) * 100);
    }
    
    setIsRunningTest(false);
    setEvaluationResult(evaluator.generateEvaluationReport());
  };

  // 导出测试报告
  const exportReport = () => {
    const report = evaluator.generateTestReport();
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AI系统评估报告_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isVisible) {
    return (
      <Button
        onClick={onToggle}
        className="fixed bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg"
        aria-label="打开评估面板"
      >
        <BarChart3 size={20} />
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">🎯 多角色AI系统评估</h2>
          <div className="flex gap-2">
            <Button
              onClick={runAutomatedTest}
              disabled={isRunningTest}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isRunningTest ? '测试中...' : '▶️ 运行测试'}
            </Button>
            <Button
              onClick={exportReport}
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-50"
            >
              <Download size={16} className="mr-1" />
              导出报告
            </Button>
            <Button onClick={onToggle} variant="ghost">
              ✕
            </Button>
          </div>
        </div>

        {isRunningTest && (
          <div className="p-4 bg-blue-50 border-b">
            <div className="flex items-center gap-2 mb-2">
              <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              <span className="text-sm text-blue-800">正在执行自动化测试...</span>
            </div>
            <Progress value={testProgress} className="w-full" />
          </div>
        )}

        <div className="p-4 overflow-y-auto max-h-[calc(90vh-8rem)]">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">📊 总览</TabsTrigger>
              <TabsTrigger value="fairness">⚖️ 公平性</TabsTrigger>
              <TabsTrigger value="intelligence">🧠 智能性</TabsTrigger>
              <TabsTrigger value="efficiency">⚡ 效率</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard
                  title="消息总数"
                  value={messages.length}
                  icon={<MessageCircle />}
                  color="blue"
                />
                <MetricCard
                  title="活跃角色"
                  value={characters.length}
                  icon={<Users />}
                  color="green"
                />
                <MetricCard
                  title="Token使用"
                  value={currentTokenUsage.reduce((sum, usage) => sum + usage.totalTokens, 0)}
                  icon={<TrendingUp />}
                  color="purple"
                />
                <MetricCard
                  title="基尼系数"
                  value={evaluationResult?.fairness.giniCoefficient.toFixed(3) || 'N/A'}
                  icon={<BarChart3 />}
                  color={getGiniColor(evaluationResult?.fairness.giniCoefficient || 0)}
                />
              </div>

              {evaluationResult && (
                <Card>
                  <CardHeader>
                    <CardTitle>🎯 系统健康度</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <HealthIndicator
                        label="发言分布均匀度"
                        value={evaluationResult.fairness.giniCoefficient}
                        threshold={0.3}
                        inverted={true}
                      />
                      <HealthIndicator
                        label="@提及响应率"
                        value={evaluationResult.intelligence.mentionResponseRate}
                        threshold={0.8}
                      />
                      <HealthIndicator
                        label="连续发言控制"
                        value={evaluationResult.fairness.consecutiveSpeakingRate}
                        threshold={0.05}
                        inverted={true}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="fairness" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>⚖️ 发言公平性分析</CardTitle>
                </CardHeader>
                <CardContent>
                  {evaluationResult && (
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">角色发言分布</h4>
                        <div className="space-y-2">
                          {Object.entries(evaluationResult.fairness.speakingDistribution).map(([name, count]) => (
                            <div key={name} className="flex items-center gap-2">
                              <span className="w-20 text-sm">{name}</span>
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                  style={{
                                    width: `${(count / Math.max(...Object.values(evaluationResult.fairness.speakingDistribution))) * 100}%`
                                  }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-600">{count}次</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                        <div>
                          <h5 className="font-medium text-gray-700">基尼系数</h5>
                          <p className="text-2xl font-bold text-blue-600">
                            {evaluationResult.fairness.giniCoefficient.toFixed(3)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {evaluationResult.fairness.giniCoefficient < 0.3 ? '优秀' : 
                             evaluationResult.fairness.giniCoefficient < 0.5 ? '良好' : '需改进'}
                          </p>
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-700">连续发言率</h5>
                          <p className="text-2xl font-bold text-orange-600">
                            {(evaluationResult.fairness.consecutiveSpeakingRate * 100).toFixed(1)}%
                          </p>
                          <p className="text-xs text-gray-500">
                            {evaluationResult.fairness.consecutiveSpeakingRate < 0.05 ? '优秀' : '需改进'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="intelligence" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>🧠 智能响应分析</CardTitle>
                </CardHeader>
                <CardContent>
                  {evaluationResult && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <h5 className="font-medium text-gray-700 mb-2">@提及响应率</h5>
                          <div className="text-3xl font-bold text-green-600">
                            {(evaluationResult.intelligence.mentionResponseRate * 100).toFixed(0)}%
                          </div>
                        </div>
                        <div className="text-center">
                          <h5 className="font-medium text-gray-700 mb-2">话题相关性</h5>
                          <div className="text-3xl font-bold text-blue-600">
                            {evaluationResult.intelligence.topicRelevanceScore || 'N/A'}
                          </div>
                        </div>
                        <div className="text-center">
                          <h5 className="font-medium text-gray-700 mb-2">沉默合理性</h5>
                          <div className="text-3xl font-bold text-purple-600">
                            {evaluationResult.intelligence.silenceAppropriatenesss || 'N/A'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-4 border-t">
                        <h5 className="font-medium text-gray-700 mb-3">建议测试场景</h5>
                        <div className="grid grid-cols-2 gap-2">
                          {testScenarios.map((scenario, index) => (
                            <div key={index} className="p-3 bg-gray-50 rounded-lg">
                              <h6 className="font-medium text-sm">{scenario.name}</h6>
                              <p className="text-xs text-gray-600 mt-1">{scenario.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="efficiency" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>⚡ 系统效率分析</CardTitle>
                </CardHeader>
                <CardContent>
                  {evaluationResult && (
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h5 className="font-medium text-gray-700 mb-3">响应性能</h5>
                        <div className="space-y-3">
                          <div>
                            <span className="text-sm text-gray-600">平均响应时间</span>
                            <div className="text-xl font-bold">
                              {evaluationResult.efficiency.averageResponseTime.toFixed(0)}ms
                            </div>
                          </div>
                          <div>
                            <span className="text-sm text-gray-600">API成功率</span>
                            <div className="text-xl font-bold text-green-600">
                              {(evaluationResult.efficiency.apiSuccessRate * 100).toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h5 className="font-medium text-gray-700 mb-3">资源使用</h5>
                        <div className="space-y-3">
                          <div>
                            <span className="text-sm text-gray-600">每消息Token数</span>
                            <div className="text-xl font-bold">
                              {evaluationResult.efficiency.tokenUsagePerMessage.toFixed(0)}
                            </div>
                          </div>
                          <div>
                            <span className="text-sm text-gray-600">回退使用率</span>
                            <div className="text-xl font-bold text-orange-600">
                              {(evaluationResult.efficiency.fallbackRate * 100).toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

// 辅助组件
const MetricCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}> = ({ title, value, icon, color }) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <div className={`text-${color}-600`}>
          {icon}
        </div>
      </div>
    </CardContent>
  </Card>
);

const HealthIndicator: React.FC<{
  label: string;
  value: number;
  threshold: number;
  inverted?: boolean;
}> = ({ label, value, threshold, inverted = false }) => {
  const isHealthy = inverted ? value < threshold : value >= threshold;
  const percentage = Math.min(value * 100, 100);
  
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium">{label}</span>
        <Badge variant={isHealthy ? "default" : "destructive"}>
          {isHealthy ? "✅ 健康" : "⚠️ 需注意"}
        </Badge>
      </div>
      <Progress
        value={inverted ? 100 - percentage : percentage}
        className={`h-2 ${isHealthy ? 'bg-green-100' : 'bg-red-100'}`}
      />
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>{value.toFixed(3)}</span>
        <span>目标: {inverted ? '<' : '>'} {threshold}</span>
      </div>
    </div>
  );
};

const getGiniColor = (value: number): string => {
  if (value < 0.3) return 'green';
  if (value < 0.5) return 'yellow';
  return 'red';
};

export default EvaluationPanel; 