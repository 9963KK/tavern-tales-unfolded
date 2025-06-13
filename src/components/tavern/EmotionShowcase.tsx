import React, { useState, useEffect } from 'react';
import { EmotionType, EmotionalState, createDefaultEmotionalState } from '@/types/emotion';
import { EmotionIndicator, EmotionHistory, EmotionTransition } from './EmotionIndicator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// 演示用的情绪状态数据
const DEMO_EMOTIONS: EmotionalState[] = [
  {
    ...createDefaultEmotionalState(EmotionType.HAPPY),
    intensity: 0.8,
    description: '非常开心',
    triggers: ['收到好消息', '朋友来访']
  },
  {
    ...createDefaultEmotionalState(EmotionType.EXCITED),
    intensity: 0.9,
    description: '极度兴奋',
    triggers: ['即将冒险', '发现宝藏']
  },
  {
    ...createDefaultEmotionalState(EmotionType.CALM),
    intensity: 0.4,
    description: '内心平静',
    triggers: ['冥想', '听音乐']
  },
  {
    ...createDefaultEmotionalState(EmotionType.STRESSED),
    intensity: 0.7,
    description: '感到紧张',
    triggers: ['时间紧迫', '任务繁重']
  },
  {
    ...createDefaultEmotionalState(EmotionType.SAD),
    intensity: 0.6,
    description: '有些难过',
    triggers: ['离别', '回忆往事']
  }
];

export function EmotionShowcase() {
  const [currentEmotion, setCurrentEmotion] = useState<EmotionalState>(DEMO_EMOTIONS[0]);
  const [previousEmotion, setPreviousEmotion] = useState<EmotionalState | undefined>();
  const [emotionHistory, setEmotionHistory] = useState<EmotionalState[]>([]);
  const [autoDemo, setAutoDemo] = useState(false);

  // 自动演示模式
  useEffect(() => {
    if (!autoDemo) return;

    const interval = setInterval(() => {
      const randomEmotion = DEMO_EMOTIONS[Math.floor(Math.random() * DEMO_EMOTIONS.length)];
      changeEmotion(randomEmotion);
    }, 3000);

    return () => clearInterval(interval);
  }, [autoDemo]);

  const changeEmotion = (newEmotion: EmotionalState) => {
    setPreviousEmotion(currentEmotion);
    setCurrentEmotion({
      ...newEmotion,
      timestamp: new Date()
    });
    setEmotionHistory(prev => [...prev, currentEmotion].slice(-8));
  };

  const createCustomEmotion = (type: EmotionType, intensity: number) => {
    const baseEmotion = createDefaultEmotionalState(type);
    return {
      ...baseEmotion,
      intensity,
      timestamp: new Date(),
      triggers: ['用户测试', '手动调整']
    };
  };

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-900 rounded-xl">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
          🎭 全新情绪UI设计展示
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          体验现代化的情绪指示器设计，包含渐变效果、动画和交互功能
        </p>
      </div>

      {/* 主要展示区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 当前情绪展示 */}
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>当前情绪状态</span>
              <Badge variant="outline">实时</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 大尺寸情绪指示器 */}
            <div className="flex justify-center">
              <EmotionTransition
                previousEmotion={previousEmotion}
                currentEmotion={currentEmotion}
              />
            </div>

            {/* 详细信息展示 */}
            <EmotionIndicator
              emotion={currentEmotion}
              showDetails={true}
              animated={true}
            />

            {/* 控制按钮 */}
            <div className="flex flex-wrap gap-2 justify-center">
              <Button
                onClick={() => setAutoDemo(!autoDemo)}
                variant={autoDemo ? "destructive" : "default"}
                size="sm"
              >
                {autoDemo ? '停止自动演示' : '开始自动演示'}
              </Button>
              <Button
                onClick={() => changeEmotion(DEMO_EMOTIONS[Math.floor(Math.random() * DEMO_EMOTIONS.length)])}
                variant="outline"
                size="sm"
              >
                随机情绪
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 情绪历史 */}
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>情绪历史记录</CardTitle>
          </CardHeader>
          <CardContent>
            {emotionHistory.length > 0 ? (
              <EmotionHistory
                history={emotionHistory}
                maxItems={8}
              />
            ) : (
              <p className="text-gray-500 text-center py-4">
                暂无历史记录，请切换情绪状态
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 所有情绪类型展示 */}
      <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>所有情绪类型</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-4">
            {Object.values(EmotionType).map((emotionType) => {
              const emotion = createDefaultEmotionalState(emotionType);
              return (
                <div
                  key={emotionType}
                  className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                  onClick={() => changeEmotion({
                    ...emotion,
                    intensity: 0.5 + Math.random() * 0.5,
                    timestamp: new Date(),
                    triggers: ['点击选择']
                  })}
                >
                  <EmotionIndicator
                    emotion={emotion}
                    size="medium"
                    animated={true}
                  />
                  <span className="text-xs text-center font-medium">
                    {emotion.description}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 强度测试 */}
      <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>强度级别展示</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[0.2, 0.4, 0.6, 0.8, 1.0].map((intensity) => (
              <div key={intensity} className="flex items-center gap-4">
                <div className="w-16 text-sm font-medium">
                  {Math.round(intensity * 100)}%
                </div>
                <EmotionIndicator
                  emotion={{
                    ...createDefaultEmotionalState(EmotionType.HAPPY),
                    intensity,
                    timestamp: new Date()
                  }}
                  size="small"
                  animated={true}
                />
                <EmotionIndicator
                  emotion={{
                    ...createDefaultEmotionalState(EmotionType.ANGRY),
                    intensity,
                    timestamp: new Date()
                  }}
                  size="small"
                  animated={true}
                />
                <EmotionIndicator
                  emotion={{
                    ...createDefaultEmotionalState(EmotionType.SAD),
                    intensity,
                    timestamp: new Date()
                  }}
                  size="small"
                  animated={true}
                />
                <div className="flex-1 text-sm text-gray-600">
                  {intensity < 0.3 ? '微弱' : 
                   intensity < 0.5 ? '轻微' : 
                   intensity < 0.75 ? '中等' : 
                   intensity < 0.9 ? '强烈' : '极强'}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 尺寸对比 */}
      <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>尺寸对比</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-8">
            <div className="text-center">
              <EmotionIndicator
                emotion={currentEmotion}
                size="small"
                animated={true}
              />
              <p className="text-xs mt-2">小尺寸</p>
            </div>
            <div className="text-center">
              <EmotionIndicator
                emotion={currentEmotion}
                size="medium"
                animated={true}
              />
              <p className="text-xs mt-2">中尺寸</p>
            </div>
            <div className="text-center">
              <EmotionIndicator
                emotion={currentEmotion}
                size="large"
                animated={true}
              />
              <p className="text-xs mt-2">大尺寸</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 设计特性说明 */}
      <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>🎨 新设计特性</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-semibold text-green-600">✨ 视觉升级</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• 现代化渐变色彩系统</li>
                <li>• 环形进度条显示强度</li>
                <li>• 光晕和阴影效果</li>
                <li>• 响应式尺寸设计</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-blue-600">🎭 动画效果</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• 强度脉动动画</li>
                <li>• 情绪变化过渡</li>
                <li>• 悬停缩放效果</li>
                <li>• 粒子变化动画</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-purple-600">💡 交互体验</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• 悬停详情卡片</li>
                <li>• 丰富的触发信息</li>
                <li>• 情感属性展示</li>
                <li>• 时间戳记录</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-orange-600">🔧 技术特性</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• 暗色主题支持</li>
                <li>• 无障碍设计</li>
                <li>• 性能优化</li>
                <li>• 模块化组件</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 