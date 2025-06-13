import React, { useState, useEffect } from 'react';
import { EmotionType, EmotionalState } from '@/types/emotion';
import { cn } from '@/lib/utils';

interface EmotionIndicatorProps {
  emotion: EmotionalState;
  size?: 'small' | 'medium' | 'large';
  showDetails?: boolean;
  className?: string;
  showTooltip?: boolean;
  animated?: boolean;
}

// 更精美的情感图标映射
const EMOTION_ICONS = {
  [EmotionType.HAPPY]: '😊',
  [EmotionType.EXCITED]: '🤩',
  [EmotionType.SAD]: '😢',
  [EmotionType.ANGRY]: '😡',
  [EmotionType.STRESSED]: '😰',
  [EmotionType.CALM]: '😌',
  [EmotionType.RELAXED]: '😎',
  [EmotionType.BORED]: '😑',
  [EmotionType.NEUTRAL]: '😐'
};

// 现代化渐变色彩系统
const EMOTION_GRADIENTS = {
  [EmotionType.HAPPY]: {
    from: 'from-emerald-400',
    to: 'to-green-500',
    ring: 'ring-emerald-400/30',
    glow: 'shadow-emerald-400/50',
    text: 'text-emerald-600',
    colors: { start: '#34d399', end: '#10b981' }
  },
  [EmotionType.EXCITED]: {
    from: 'from-orange-400',
    to: 'to-red-500',
    ring: 'ring-orange-400/30',
    glow: 'shadow-orange-400/50',
    text: 'text-orange-600',
    colors: { start: '#fb923c', end: '#ef4444' }
  },
  [EmotionType.SAD]: {
    from: 'from-blue-400',
    to: 'to-indigo-500',
    ring: 'ring-blue-400/30',
    glow: 'shadow-blue-400/50',
    text: 'text-blue-600',
    colors: { start: '#60a5fa', end: '#6366f1' }
  },
  [EmotionType.ANGRY]: {
    from: 'from-red-400',
    to: 'to-rose-600',
    ring: 'ring-red-400/30',
    glow: 'shadow-red-400/50',
    text: 'text-red-600',
    colors: { start: '#f87171', end: '#e11d48' }
  },
  [EmotionType.STRESSED]: {
    from: 'from-yellow-400',
    to: 'to-amber-500',
    ring: 'ring-yellow-400/30',
    glow: 'shadow-yellow-400/50',
    text: 'text-yellow-600',
    colors: { start: '#facc15', end: '#f59e0b' }
  },
  [EmotionType.CALM]: {
    from: 'from-teal-400',
    to: 'to-cyan-500',
    ring: 'ring-teal-400/30',
    glow: 'shadow-teal-400/50',
    text: 'text-teal-600',
    colors: { start: '#2dd4bf', end: '#06b6d4' }
  },
  [EmotionType.RELAXED]: {
    from: 'from-purple-400',
    to: 'to-violet-500',
    ring: 'ring-purple-400/30',
    glow: 'shadow-purple-400/50',
    text: 'text-purple-600',
    colors: { start: '#a78bfa', end: '#8b5cf6' }
  },
  [EmotionType.BORED]: {
    from: 'from-gray-400',
    to: 'to-slate-500',
    ring: 'ring-gray-400/30',
    glow: 'shadow-gray-400/50',
    text: 'text-gray-600',
    colors: { start: '#9ca3af', end: '#64748b' }
  },
  [EmotionType.NEUTRAL]: {
    from: 'from-slate-400',
    to: 'to-gray-500',
    ring: 'ring-slate-400/30',
    glow: 'shadow-slate-400/50',
    text: 'text-slate-600',
    colors: { start: '#94a3b8', end: '#6b7280' }
  }
};

// 尺寸配置
const SIZE_CONFIG = {
  small: {
    container: 'w-8 h-8',
    icon: 'text-sm',
    ring: 'ring-2',
    progress: 'w-10 h-10',
    tooltip: 'text-xs'
  },
  medium: {
    container: 'w-10 h-10',
    icon: 'text-base',
    ring: 'ring-2',
    progress: 'w-12 h-12',
    tooltip: 'text-sm'
  },
  large: {
    container: 'w-12 h-12',
    icon: 'text-lg',
    ring: 'ring-3',
    progress: 'w-14 h-14',
    tooltip: 'text-base'
  }
};

// 环形进度条组件
const EmotionProgressRing: React.FC<{
  progress: number;
  size: string;
  gradient: any;
  emotionType: EmotionType;
  animated?: boolean;
}> = ({ progress, size, gradient, emotionType, animated = true }) => {
  const radius = size === 'small' ? 16 : size === 'medium' ? 20 : 24;
  const strokeWidth = 2;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDasharray = `${circumference} ${circumference}`;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  
  // 为每个情绪类型创建唯一的渐变ID
  const gradientId = `gradient-${emotionType}-${size}`;

  return (
    <div className={cn("absolute inset-0 -m-1", SIZE_CONFIG[size as keyof typeof SIZE_CONFIG].progress)}>
      <svg
        height={radius * 2}
        width={radius * 2}
        className="transform -rotate-90"
      >
        {/* 渐变定义 */}
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={gradient.colors.start} />
            <stop offset="100%" stopColor={gradient.colors.end} />
          </linearGradient>
        </defs>
        
        {/* 背景圆环 */}
        <circle
          stroke="currentColor"
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className="text-gray-200 dark:text-gray-700"
        />
        
        {/* 进度圆环 */}
        <circle
          stroke={`url(#${gradientId})`}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className={cn(
            "transition-all duration-500 ease-out",
            animated && "animate-pulse"
          )}
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};

// 悬停详情卡片组件
const EmotionTooltip: React.FC<{
  emotion: EmotionalState;
  gradient: any;
  size: string;
}> = ({ emotion, gradient, size }) => {
  const intensityLevel = getIntensityLevel(emotion.intensity);
  const intensityPercentage = Math.round(emotion.intensity * 100);

  return (
    <div className={cn(
      "absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50",
      "bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700",
      "p-3 min-w-[200px] opacity-0 group-hover:opacity-100 transition-all duration-200",
      "pointer-events-none"
    )}>
      {/* 箭头 */}
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white dark:border-t-gray-800" />
      
      {/* 内容 */}
      <div className="space-y-2">
        {/* 标题 */}
        <div className="flex items-center gap-2">
          <span className="text-lg">{EMOTION_ICONS[emotion.type]}</span>
          <div>
            <div className={cn("font-semibold", gradient.text)}>
              {emotion.description}
            </div>
            <div className="text-xs text-gray-500">
              强度: {intensityLevel} ({intensityPercentage}%)
            </div>
          </div>
        </div>

        {/* 情感属性 */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-gray-500">效价:</span>
            <span className={cn("ml-1", emotion.valence > 0 ? "text-green-600" : "text-red-600")}>
              {emotion.valence > 0 ? '积极' : '消极'}
            </span>
          </div>
          <div>
            <span className="text-gray-500">唤醒:</span>
            <span className={cn("ml-1", emotion.arousal > 0 ? "text-orange-600" : "text-blue-600")}>
              {emotion.arousal > 0 ? '高' : '低'}
            </span>
          </div>
        </div>

        {/* 触发因素 */}
        {emotion.triggers.length > 0 && (
          <div className="text-xs">
            <div className="text-gray-500 mb-1">触发因素:</div>
            <div className="flex flex-wrap gap-1">
              {emotion.triggers.slice(-3).map((trigger, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-gray-700 dark:text-gray-300"
                >
                  {trigger}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 时间戳 */}
        <div className="text-xs text-gray-400 border-t pt-1">
          {emotion.timestamp.toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

export function EmotionIndicator({ 
  emotion, 
  size = 'medium', 
  showDetails = false,
  className,
  showTooltip = true,
  animated = true
}: EmotionIndicatorProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const icon = EMOTION_ICONS[emotion.type];
  const gradient = EMOTION_GRADIENTS[emotion.type];
  const sizeConfig = SIZE_CONFIG[size];
  
  // 计算强度相关数值
  const intensityLevel = getIntensityLevel(emotion.intensity);
  const intensityPercentage = Math.round(emotion.intensity * 100);
  const pulseIntensity = emotion.intensity;

  // 情感变化动画效果
  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => setIsTransitioning(false), 600);
    return () => clearTimeout(timer);
  }, [emotion.type]);

  if (showDetails) {
    return (
      <div className={cn(
        "flex items-center gap-3 p-4 rounded-xl border backdrop-blur-sm",
        "bg-gradient-to-r", gradient.from, gradient.to,
        "text-white shadow-lg", gradient.glow,
        className
      )}>
        <div className="relative">
          <div className={cn(
            "flex items-center justify-center rounded-full bg-white/20",
            sizeConfig.container,
            animated && "animate-pulse"
          )}>
            <span className={sizeConfig.icon}>{icon}</span>
          </div>
          <EmotionProgressRing
            progress={intensityPercentage}
            size={size}
            gradient={gradient}
            emotionType={emotion.type}
            animated={animated}
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-lg">{emotion.description}</span>
            <span className="px-2 py-1 bg-white/20 rounded-full text-xs font-medium">
              {intensityLevel}
            </span>
          </div>
          
          <div className="text-sm opacity-90 mb-2">
            强度: {intensityPercentage}% • 
            效价: {emotion.valence > 0 ? '积极' : '消极'} • 
            唤醒: {emotion.arousal > 0 ? '高' : '低'}
          </div>
          
          {emotion.triggers.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {emotion.triggers.slice(-3).map((trigger, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-white/20 rounded text-xs"
                >
                  {trigger}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "relative group cursor-pointer",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 主要指示器 */}
      <div className={cn(
        "relative flex items-center justify-center rounded-full transition-all duration-300",
        "bg-gradient-to-br", gradient.from, gradient.to,
        sizeConfig.container, sizeConfig.ring, gradient.ring,
        "shadow-lg", gradient.glow,
        isHovered && "scale-110 shadow-xl",
        isTransitioning && "animate-bounce",
        animated && pulseIntensity > 0.7 && "animate-pulse"
      )}
      style={{
        animationDuration: animated ? `${2 - pulseIntensity}s` : undefined
      }}
    >
      <span className={cn(
        sizeConfig.icon,
        "transition-transform duration-200",
        isHovered && "scale-110"
      )}>
        {icon}
      </span>

      {/* 环形进度条 */}
      <EmotionProgressRing
        progress={intensityPercentage}
        size={size}
        gradient={gradient}
        emotionType={emotion.type}
        animated={animated && pulseIntensity > 0.5}
      />

      {/* 强度脉冲效果 */}
      {animated && pulseIntensity > 0.6 && (
        <div className={cn(
          "absolute inset-0 rounded-full animate-ping",
          "bg-gradient-to-br", gradient.from, gradient.to,
          "opacity-20"
        )} />
      )}

      {/* 变化指示器 */}
      {isTransitioning && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-ping" />
      )}
    </div>

    {/* 悬停详情卡片 */}
    {showTooltip && (
      <EmotionTooltip
        emotion={emotion}
        gradient={gradient}
        size={size}
      />
    )}
    </div>
  );
}

// 辅助函数
function getIntensityLevel(intensity: number): string {
  if (intensity < 0.25) return '微弱';
  if (intensity < 0.5) return '轻微';
  if (intensity < 0.75) return '中等';
  if (intensity < 0.9) return '强烈';
  return '极强';
}

// 情感历史组件 - 重新设计
interface EmotionHistoryProps {
  history: EmotionalState[];
  maxItems?: number;
  className?: string;
}

export function EmotionHistory({ 
  history, 
  maxItems = 5,
  className 
}: EmotionHistoryProps) {
  const recentHistory = history.slice(-maxItems);

  if (recentHistory.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800", className)}>
      <span className="text-xs text-gray-500 font-medium">历史:</span>
      <div className="flex items-center gap-1">
        {recentHistory.map((emotion, index) => (
          <div key={`${emotion.timestamp.getTime()}-${index}`} className="relative">
            <EmotionIndicator
              emotion={emotion}
              size="small"
              showTooltip={false}
              animated={false}
              className={cn(
                "opacity-60 hover:opacity-100 transition-opacity",
                index === recentHistory.length - 1 && "opacity-80"
              )}
            />
            {index < recentHistory.length - 1 && (
              <div className="absolute top-1/2 -right-0.5 w-1 h-0.5 bg-gray-300 dark:bg-gray-600" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// 情感变化动画组件 - 重新设计
interface EmotionTransitionProps {
  previousEmotion?: EmotionalState;
  currentEmotion: EmotionalState;
  className?: string;
}

export function EmotionTransition({ 
  previousEmotion, 
  currentEmotion,
  className 
}: EmotionTransitionProps) {
  const [showTransition, setShowTransition] = useState(false);

  useEffect(() => {
    if (previousEmotion && previousEmotion.type !== currentEmotion.type) {
      setShowTransition(true);
      const timer = setTimeout(() => setShowTransition(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [previousEmotion, currentEmotion]);

  return (
    <div className={cn("relative", className)}>
      {/* 当前情感 */}
      <EmotionIndicator
        emotion={currentEmotion}
        animated={true}
        className={cn(
          "transition-all duration-500",
          showTransition && "scale-110"
        )}
      />
      
      {/* 变化动画效果 */}
      {showTransition && (
        <>
          {/* 光环效果 */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 opacity-30 animate-ping" />
          
          {/* 粒子效果 */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-blue-400 rounded-full animate-bounce"
                style={{
                  left: `${20 + i * 10}%`,
                  top: `${20 + (i % 2) * 60}%`,
                  animationDelay: `${i * 100}ms`,
                  animationDuration: '1s'
                }}
              />
            ))}
          </div>
          
          {/* 变化提示 */}
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs text-blue-500 font-medium animate-fade-in-out">
            情感变化
          </div>
        </>
      )}
    </div>
  );
}

// 添加自定义动画样式
const customStyles = `
  @keyframes fade-in-out {
    0%, 100% { opacity: 0; transform: translateY(10px); }
    50% { opacity: 1; transform: translateY(0); }
  }
  
  .animate-fade-in-out {
    animation: fade-in-out 2s ease-in-out;
  }
`;

// 注入样式
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = customStyles;
  document.head.appendChild(styleElement);
} 