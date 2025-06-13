import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ChevronLeft, ChevronRight, History, BarChart3, Clock, MessageSquare, Users, Coins, Trash2, Info } from 'lucide-react';
import { Message, AICharacter } from '@/types/tavern';

interface TokenUsage {
  characterId: string;
  characterName: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  apiCalls: number;
  category: 'character' | 'system' | 'player' | 'analysis';
}

interface HistorySession {
  id: string;
  name: string;
  timestamp: Date;
  messages: Message[];
  characters: AICharacter[];
  tokenUsage: TokenUsage[];
}

interface HistoryPanelProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  currentTokenUsage: TokenUsage[];
  currentMessages: Message[];
  currentCharacters: AICharacter[];
  historySessions: HistorySession[];
  onLoadSession: (session: HistorySession) => void;
  onDeleteSession: (sessionId: string) => void;
  onSaveCurrentSession: () => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({
  isCollapsed,
  onToggleCollapse,
  currentTokenUsage,
  currentMessages,
  currentCharacters,
  historySessions,
  onLoadSession,
  onDeleteSession,
  onSaveCurrentSession,
}) => {
  const [activeTab, setActiveTab] = useState<'history' | 'stats'>('history');
  const [showDetailFor, setShowDetailFor] = useState<string | null>(null);

  // 计算当前会话总token消耗
  const totalTokens = Array.isArray(currentTokenUsage) 
    ? currentTokenUsage.reduce((sum, usage) => sum + (usage?.totalTokens || 0), 0)
    : 0;
  const totalInputTokens = Array.isArray(currentTokenUsage)
    ? currentTokenUsage.reduce((sum, usage) => sum + (usage?.inputTokens || 0), 0)
    : 0;
  const totalOutputTokens = Array.isArray(currentTokenUsage)
    ? currentTokenUsage.reduce((sum, usage) => sum + (usage?.outputTokens || 0), 0)
    : 0;
  const totalApiCalls = Array.isArray(currentTokenUsage)
    ? currentTokenUsage.reduce((sum, usage) => sum + (usage?.apiCalls || 0), 0)
    : 0;

  // 格式化时间
  const formatTime = (date: Date) => {
    return date.toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 估算token成本（假设每1000个token成本0.01元，可以根据实际API调整）
  const estimateCost = (tokens: number) => {
    return (tokens / 1000 * 0.01).toFixed(4);
  };

  // 按分类统计Token使用
  const getUsageByCategory = (tokenUsage: TokenUsage[]) => {
    const categoryStats = {
      character: { total: 0, input: 0, output: 0, calls: 0 },
      system: { total: 0, input: 0, output: 0, calls: 0 },
      player: { total: 0, input: 0, output: 0, calls: 0 },
      analysis: { total: 0, input: 0, output: 0, calls: 0 },
    };
    
    tokenUsage.forEach(usage => {
      const category = usage.category || 'character';
      
      // 确保分类存在于 categoryStats 中
      if (categoryStats[category as keyof typeof categoryStats]) {
        categoryStats[category as keyof typeof categoryStats].total += usage.totalTokens || 0;
        categoryStats[category as keyof typeof categoryStats].input += usage.inputTokens || 0;
        categoryStats[category as keyof typeof categoryStats].output += usage.outputTokens || 0;
        categoryStats[category as keyof typeof categoryStats].calls += usage.apiCalls || 0;
      } else {
        // 如果分类不存在，归类到 character
        categoryStats.character.total += usage.totalTokens || 0;
        categoryStats.character.input += usage.inputTokens || 0;
        categoryStats.character.output += usage.outputTokens || 0;
        categoryStats.character.calls += usage.apiCalls || 0;
      }
    });
    
    return categoryStats;
  };

  // 获取会话统计信息
  const getSessionStats = (session: HistorySession) => {
    // 确保 tokenUsage 存在且是数组
    const tokenUsage = Array.isArray(session.tokenUsage) ? session.tokenUsage : [];
    
    const totalTokens = tokenUsage.reduce((sum, usage) => {
      return sum + (usage?.totalTokens || 0);
    }, 0);
    
    const categoryStats = getUsageByCategory(tokenUsage);
    return { totalTokens, categoryStats };
  };

  return (
    <div 
      className={`bg-tavern-panel-bg border-r border-tavern-accent flex flex-col transition-all duration-300 ease-in-out overflow-hidden h-full ${
        isCollapsed ? 'w-12' : 'w-80'
      }`}
      style={{
        willChange: 'width',
        contain: 'layout style size',
        transform: 'translateZ(0)',
        minHeight: '100vh',
      }}
    >
      {/* 收缩状态 */}
      {isCollapsed && (
        <div className="flex flex-col items-center py-4 h-full">
          <Button
            onClick={onToggleCollapse}
            variant="ghost"
            size="icon"
            className="text-tavern-accent hover:text-yellow-400 mb-2 transition-colors duration-200"
            aria-label="展开历史面板"
          >
            <ChevronRight size={20} />
          </Button>
          <div 
            className="text-tavern-text text-xs opacity-70 mt-4 transform -rotate-90 whitespace-nowrap transition-opacity duration-300"
            style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
          >
            历史统计
          </div>
        </div>
      )}

      {/* 展开状态 */}
      {!isCollapsed && (
        <div 
          className="p-4 h-full flex flex-col animate-in fade-in-0 duration-300"
          style={{
            contain: 'layout style',
            willChange: 'contents',
            overflow: 'hidden',
          }}
        >
          <div className="mb-4 flex items-center justify-between flex-shrink-0">
            <div className="transition-opacity duration-300">
              <h3 className="text-lg font-semibold text-tavern-accent mb-2">历史与统计</h3>
              <p className="text-sm text-tavern-text opacity-70">管理会话记录和Token消耗</p>
            </div>
            <Button
              onClick={onToggleCollapse}
              variant="ghost"
              size="icon"
              className="text-tavern-accent hover:text-yellow-400 transition-colors duration-200"
              aria-label="收起历史面板"
            >
              <ChevronLeft size={20} />
            </Button>
          </div>

          {/* 标签切换 */}
          <div className="flex mb-4 bg-tavern-bg rounded-lg p-1 flex-shrink-0">
            <Button
              onClick={() => setActiveTab('history')}
              variant={activeTab === 'history' ? 'default' : 'ghost'}
              size="sm"
              className={`flex-1 text-xs h-8 transition-all duration-200 ${
                activeTab === 'history' 
                  ? 'bg-tavern-accent text-tavern-bg shadow-sm' 
                  : 'text-tavern-text hover:text-tavern-accent'
              }`}
            >
              <History size={14} className="mr-1" />
              历史记录
            </Button>
            <Button
              onClick={() => setActiveTab('stats')}
              variant={activeTab === 'stats' ? 'default' : 'ghost'}
              size="sm"
              className={`flex-1 text-xs h-8 transition-all duration-200 ${
                activeTab === 'stats' 
                  ? 'bg-tavern-accent text-tavern-bg shadow-sm' 
                  : 'text-tavern-text hover:text-tavern-accent'
              }`}
            >
              <BarChart3 size={14} className="mr-1" />
              Token统计
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto" style={{ contain: 'layout style' }}>
            {/* 历史记录标签页 */}
            {activeTab === 'history' && (
              <div className="space-y-3">
                {/* 保存当前会话按钮 */}
                <Button
                  onClick={onSaveCurrentSession}
                  className="w-full bg-tavern-accent hover:bg-yellow-600 text-tavern-bg font-semibold text-xs py-2"
                  disabled={currentMessages.length === 0}
                >
                  💾 保存当前会话
                </Button>

                {/* 历史会话列表 */}
                <div className="space-y-2">
                  {historySessions.length === 0 ? (
                    <div className="text-center text-tavern-text opacity-60 py-8">
                      <History size={32} className="mx-auto mb-2 opacity-40" />
                      <p className="text-sm">暂无历史会话</p>
                    </div>
                  ) : (
                    historySessions.map((session) => (
                      <Card key={session.id} className="border border-tavern-accent/30 bg-tavern-bg hover:border-tavern-accent/50 transition-all duration-200">
                        <CardHeader className="p-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-medium text-tavern-text truncate flex-1">
                              {session.name}
                            </CardTitle>
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteSession(session.id);
                              }}
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                            >
                              <Trash2 size={12} />
                            </Button>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-tavern-text opacity-60">
                            <div className="flex items-center gap-1">
                              <Clock size={10} />
                              <span>{formatTime(session.timestamp)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageSquare size={10} />
                              <span>{session.messages.length}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users size={10} />
                              <span>{session.characters.length}</span>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-3 pt-0">
                          <div className="flex gap-2">
                            <Button
                              onClick={() => onLoadSession(session)}
                              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs py-1.5"
                            >
                              加载会话
                            </Button>
                            <Button
                              onClick={() => setShowDetailFor(showDetailFor === session.id ? null : session.id)}
                              variant="outline"
                              size="sm"
                              className="px-2 py-1.5 border-tavern-accent/30 text-tavern-accent hover:bg-tavern-accent/10"
                            >
                              <Info size={12} />
                            </Button>
                          </div>
                          
                          {/* 详细信息展开区域 */}
                          {showDetailFor === session.id && (
                            <div className="mt-3 p-2 bg-tavern-panel-bg rounded text-xs space-y-2">
                              <div className="font-medium text-tavern-accent">会话详情</div>
                              
                              {/* 基本统计 */}
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <span className="text-tavern-text opacity-60">总Token: </span>
                                  <span className="font-semibold text-tavern-accent">{getSessionStats(session).totalTokens.toLocaleString()}</span>
                                </div>
                                <div>
                                  <span className="text-tavern-text opacity-60">预估成本: </span>
                                  <span className="font-semibold text-red-400">¥{estimateCost(getSessionStats(session).totalTokens)}</span>
                                </div>
                              </div>
                              
                              {/* 分类统计 */}
                              <div className="space-y-1">
                                <div className="font-medium text-tavern-text">分类统计:</div>
                                {Object.entries(getSessionStats(session).categoryStats).map(([category, stats]) => {
                                  // 安全检查：确保 stats 存在且有 total 属性
                                  if (!stats || typeof stats.total !== 'number' || stats.total === 0) return null;
                                  
                                  const categoryNames = {
                                    character: '角色对话',
                                    system: '系统功能',
                                    player: '玩家输入',
                                    analysis: '主题分析'
                                  };
                                  
                                  const categoryColors = {
                                    character: 'text-blue-400',
                                    system: 'text-green-400',
                                    player: 'text-purple-400',
                                    analysis: 'text-orange-400'
                                  };
                                  
                                  return (
                                    <div key={category} className="flex justify-between">
                                      <span className={`${categoryColors[category as keyof typeof categoryColors] || 'text-gray-400'}`}>
                                        {categoryNames[category as keyof typeof categoryNames] || category}:
                                      </span>
                                      <span className="font-semibold">{(stats.total || 0).toLocaleString()}</span>
                                    </div>
                                  );
                                })}
                              </div>
                              
                              {/* 角色列表 */}
                              <div className="space-y-1">
                                <div className="font-medium text-tavern-text">参与角色:</div>
                                <div className="flex flex-wrap gap-1">
                                  {session.characters.map(char => (
                                    <span key={char.id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-tavern-bg rounded text-xs text-white font-medium">
                                      <div className={`w-2 h-2 rounded-full ${char.avatarColor}`}></div>
                                      {char.name}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Token统计标签页 */}
            {activeTab === 'stats' && (
              <div className="space-y-3">
                {/* 总体统计 */}
                <Card className="border border-tavern-accent/30 bg-tavern-bg">
                  <CardHeader className="p-3">
                    <CardTitle className="text-sm font-medium text-tavern-accent flex items-center gap-2">
                      <Coins size={16} />
                      当前会话总计
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-tavern-panel-bg p-2 rounded">
                        <div className="text-tavern-text opacity-60">总Token</div>
                        <div className="font-semibold text-tavern-accent">{totalTokens.toLocaleString()}</div>
                      </div>
                      <div className="bg-tavern-panel-bg p-2 rounded">
                        <div className="text-tavern-text opacity-60">API调用</div>
                        <div className="font-semibold text-blue-400">{totalApiCalls}</div>
                      </div>
                      <div className="bg-tavern-panel-bg p-2 rounded">
                        <div className="text-tavern-text opacity-60">输入Token</div>
                        <div className="font-semibold text-green-400">{totalInputTokens.toLocaleString()}</div>
                      </div>
                      <div className="bg-tavern-panel-bg p-2 rounded">
                        <div className="text-tavern-text opacity-60">输出Token</div>
                        <div className="font-semibold text-orange-400">{totalOutputTokens.toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="bg-tavern-panel-bg p-2 rounded">
                      <div className="text-tavern-text opacity-60 text-xs">预估成本</div>
                      <div className="font-semibold text-red-400">¥{estimateCost(totalTokens)}</div>
                    </div>
                  </CardContent>
                </Card>

                {/* 分类统计 */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-tavern-text">分类消耗详情</h4>
                  {(() => {
                    const categoryStats = getUsageByCategory(currentTokenUsage);
                    const categoryNames = {
                      character: '角色对话',
                      system: '系统功能',
                      player: '玩家输入',
                      analysis: '主题分析'
                    };
                    const categoryColors = {
                      character: 'bg-blue-500',
                      system: 'bg-green-500',
                      player: 'bg-purple-500',
                      analysis: 'bg-orange-500'
                    };

                    return Object.entries(categoryStats).map(([category, stats]) => {
                      if (stats.total === 0) return null;
                      
                      return (
                        <Card key={category} className="border border-tavern-accent/20 bg-tavern-bg">
                          <CardContent className="p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <div className={`w-3 h-3 rounded-full ${categoryColors[category as keyof typeof categoryColors]}`}></div>
                              <span className="text-sm font-medium text-tavern-text">{categoryNames[category as keyof typeof categoryNames]}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <div className="text-tavern-text opacity-60">总Token</div>
                                <div className="font-semibold text-tavern-accent">{stats.total.toLocaleString()}</div>
                              </div>
                              <div>
                                <div className="text-tavern-text opacity-60">调用次数</div>
                                <div className="font-semibold text-blue-400">{stats.calls}</div>
                              </div>
                              <div>
                                <div className="text-tavern-text opacity-60">输入</div>
                                <div className="font-semibold text-green-400">{stats.input.toLocaleString()}</div>
                              </div>
                              <div>
                                <div className="text-tavern-text opacity-60">输出</div>
                                <div className="font-semibold text-orange-400">{stats.output.toLocaleString()}</div>
                              </div>
                            </div>
                            <div className="mt-2 text-xs">
                              <span className="text-tavern-text opacity-60">预估成本: </span>
                              <span className="font-semibold text-red-400">¥{estimateCost(stats.total)}</span>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    }).filter(Boolean);
                  })()}
                  
                  {currentTokenUsage.length === 0 && (
                    <div className="text-center text-tavern-text opacity-60 py-4">
                      <BarChart3 size={24} className="mx-auto mb-2 opacity-40" />
                      <p className="text-xs">暂无Token消耗记录</p>
                    </div>
                  )}
                </div>

                {/* 各角色详细统计 */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-tavern-text">角色消耗详情</h4>
                  {currentTokenUsage.filter(usage => usage.category === 'character').length === 0 ? (
                    <div className="text-center text-tavern-text opacity-60 py-4">
                      <Users size={24} className="mx-auto mb-2 opacity-40" />
                      <p className="text-xs">暂无角色对话记录</p>
                    </div>
                  ) : (
                    currentTokenUsage
                      .filter(usage => usage.category === 'character')
                      .map((usage) => {
                        const character = currentCharacters.find(c => c.id === usage.characterId);
                        return (
                          <Card key={`${usage.characterId}-${usage.category}`} className="border border-tavern-accent/20 bg-tavern-bg">
                            <CardContent className="p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <div className={`w-3 h-3 rounded-full ${character?.avatarColor || 'bg-gray-500'}`}></div>
                                <span className="text-sm font-medium text-tavern-text">{usage.characterName}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  <div className="text-tavern-text opacity-60">总Token</div>
                                  <div className="font-semibold text-tavern-accent">{usage.totalTokens.toLocaleString()}</div>
                                </div>
                                <div>
                                  <div className="text-tavern-text opacity-60">调用次数</div>
                                  <div className="font-semibold text-blue-400">{usage.apiCalls}</div>
                                </div>
                                <div>
                                  <div className="text-tavern-text opacity-60">输入</div>
                                  <div className="font-semibold text-green-400">{usage.inputTokens.toLocaleString()}</div>
                                </div>
                                <div>
                                  <div className="text-tavern-text opacity-60">输出</div>
                                  <div className="font-semibold text-orange-400">{usage.outputTokens.toLocaleString()}</div>
                                </div>
                              </div>
                              <div className="mt-2 text-xs">
                                <span className="text-tavern-text opacity-60">预估成本: </span>
                                <span className="font-semibold text-red-400">¥{estimateCost(usage.totalTokens)}</span>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryPanel; 