import React from 'react';
import { EmotionIndicator } from '@/components/tavern/EmotionIndicator';
import { EmotionType, createDefaultEmotionalState } from '@/types/emotion';

const EmotionTest: React.FC = () => {
  // 创建测试用的情绪状态
  const testEmotions = [
    {
      ...createDefaultEmotionalState(EmotionType.HAPPY),
      intensity: 0.8,
      description: '非常开心'
    },
    {
      ...createDefaultEmotionalState(EmotionType.EXCITED),
      intensity: 0.9,
      description: '极度兴奋'
    },
    {
      ...createDefaultEmotionalState(EmotionType.SAD),
      intensity: 0.6,
      description: '有些悲伤'
    },
    {
      ...createDefaultEmotionalState(EmotionType.ANGRY),
      intensity: 0.7,
      description: '愤怒生气'
    },
    {
      ...createDefaultEmotionalState(EmotionType.CALM),
      intensity: 0.4,
      description: '内心平静'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800 dark:text-white">
          情绪组件测试页面
        </h1>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300">
            环形进度条颜色测试
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            检查每个情绪的环形进度条是否显示正确的渐变颜色（不应该是黑白色）
          </p>
          
          <div className="grid grid-cols-5 gap-8">
            {testEmotions.map((emotion, index) => (
              <div key={index} className="flex flex-col items-center space-y-2">
                <EmotionIndicator
                  emotion={emotion}
                  size="large"
                  showTooltip={true}
                  animated={true}
                />
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {emotion.description}
                  </div>
                  <div className="text-xs text-gray-500">
                    强度: {Math.round(emotion.intensity * 100)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300">
            详细模式测试
          </h2>
          <div className="space-y-4">
            {testEmotions.slice(0, 2).map((emotion, index) => (
              <EmotionIndicator
                key={index}
                emotion={emotion}
                showDetails={true}
                animated={true}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmotionTest; 