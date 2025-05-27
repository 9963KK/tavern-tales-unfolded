/**
 * 多AI响应展示组件
 * 提供可视化的多AI响应队列管理界面
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  Play, 
  Pause, 
  Square, 
  SkipForward, 
  Settings, 
  Clock,
  Users,
  CheckCircle,
  AlertCircle,
  Loader2,
  Keyboard
} from 'lucide-react';
import { AICharacter } from '@/types/tavern';
import { MultiResponsePlan } from '@/lib/multiResponseEvaluator';

// 扩展的多响应状态接口
export interface EnhancedMultiResponseState {
  plan: MultiResponsePlan | null;
  currentResponderIndex: number;
  inProgress: boolean;
  startTime: Date | null;
  estimatedEndTime: Date | null;
  completedResponses: CompletedResponse[];
  errors: ResponseError[];
  isPaused: boolean;
  userCancelled: boolean;
}

export interface CompletedResponse {
  characterId: string;
  characterName: string;
  response: string;
  completedAt: Date;
  duration: number;
}

export interface ResponseError {
  characterId: string;
  characterName: string;
  error: string;
  timestamp: Date;
}

// 响应状态常量 - 避免Fast Refresh问题
export const RESPONSE_STATUS = {
  WAITING: 'waiting',
  THINKING: 'thinking', 
  COMPLETED: 'completed',
  ERROR: 'error',
  SKIPPED: 'skipped'
} as const;

export type ResponseStatus = typeof RESPONSE_STATUS[keyof typeof RESPONSE_STATUS];

// 组件Props接口
export interface MultiResponseDisplayProps {
  multiResponseState: EnhancedMultiResponseState;
  characters: AICharacter[];
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
  onSkipCurrent: () => void;
  onOpenConfig: () => void;
}

// 队列项组件Props
interface ResponseQueueItemProps {
  character: AICharacter;
  status: ResponseStatus;
  response?: string;
  error?: string;
  isActive: boolean;
  duration?: number;
}

// 整体进度条组件Props
interface OverallProgressBarProps {
  currentIndex: number;
  totalResponders: number;
  estimatedEndTime: Date | null;
  startTime: Date | null;
}

// 控制面板组件Props
interface MultiResponseControlsProps {
  isPaused: boolean;
  inProgress: boolean;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
  onSkipCurrent: () => void;
  onOpenConfig: () => void;
  hasCurrentResponder: boolean;
}

/**
 * 队列项组件 - 显示单个角色的响应状态 (增强动画版)
 */
const ResponseQueueItem: React.FC<ResponseQueueItemProps> = ({
  character,
  status,
  response,
  error,
  isActive,
  duration
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [previousStatus, setPreviousStatus] = useState<ResponseStatus | null>(null);

  // 组件挂载动画
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // 状态变化动画
  useEffect(() => {
    if (previousStatus && previousStatus !== status) {
      // 状态变化时触发动画
      const element = document.getElementById(`queue-item-${character.id}`);
      if (element) {
        element.classList.add('status-transition');
        setTimeout(() => {
          element.classList.remove('status-transition');
        }, 500);
      }
    }
    setPreviousStatus(status);
  }, [status, character.id, previousStatus]);

  const getStatusIcon = () => {
    switch (status) {
      case RESPONSE_STATUS.WAITING:
        return <Clock className="w-4 h-4 text-muted-foreground transition-all duration-300" />;
      case RESPONSE_STATUS.THINKING:
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin transition-all duration-300" />;
      case RESPONSE_STATUS.COMPLETED:
        return (
          <CheckCircle className="w-4 h-4 text-green-500 transition-all duration-300 animate-in zoom-in-75" />
        );
      case RESPONSE_STATUS.ERROR:
        return (
          <AlertCircle className="w-4 h-4 text-red-500 transition-all duration-300 animate-in fade-in-0 shake" />
        );
      case RESPONSE_STATUS.SKIPPED:
        return <SkipForward className="w-4 h-4 text-yellow-500 transition-all duration-300" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground transition-all duration-300" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case RESPONSE_STATUS.WAITING:
        return '等待中';
      case RESPONSE_STATUS.THINKING:
        return '思考中';
      case RESPONSE_STATUS.COMPLETED:
        return duration ? `完成 (${(duration / 1000).toFixed(1)}s)` : '完成';
      case RESPONSE_STATUS.ERROR:
        return '失败';
      case RESPONSE_STATUS.SKIPPED:
        return '已跳过';
      default:
        return '未知';
    }
  };

  const getResponsePreview = () => {
    if (response && response.length > 50) {
      return response.substring(0, 50) + '...';
    }
    return response || '';
  };

  const getStatusColor = () => {
    switch (status) {
      case RESPONSE_STATUS.WAITING:
        return 'bg-gray-50 border-gray-200 hover:bg-gray-100';
      case RESPONSE_STATUS.THINKING:
        return 'bg-blue-50 border-blue-200 hover:bg-blue-100 animate-pulse';
      case RESPONSE_STATUS.COMPLETED:
        return 'bg-green-50 border-green-200 hover:bg-green-100';
      case RESPONSE_STATUS.ERROR:
        return 'bg-red-50 border-red-200 hover:bg-red-100';
      case RESPONSE_STATUS.SKIPPED:
        return 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100';
      default:
        return 'bg-gray-50 border-gray-200 hover:bg-gray-100';
    }
  };

  const getAnimationClasses = () => {
    const baseClasses = 'transition-all duration-500 ease-in-out';
    
    if (!isVisible) {
      return `${baseClasses} opacity-0 translate-y-4 scale-95`;
    }

    let statusClasses = '';
    if (isActive) {
      statusClasses = 'ring-2 ring-blue-400 ring-opacity-50 shadow-lg scale-105';
    }

    if (status === RESPONSE_STATUS.COMPLETED) {
      statusClasses += ' animate-in slide-in-from-left-1 duration-700';
    }

    if (status === RESPONSE_STATUS.ERROR) {
      statusClasses += ' animate-in shake duration-500';
    }

    return `${baseClasses} ${statusClasses}`;
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            id={`queue-item-${character.id}`}
            className={`
              p-3 rounded-lg border cursor-pointer
              hover:shadow-md hover:scale-[1.02] active:scale-[0.98]
              ${getStatusColor()}
              ${getAnimationClasses()}
            `}
            style={{
              animationDelay: `${Math.random() * 200}ms`, // 随机延迟创造自然感
            }}
          >
            <div className="flex items-start space-x-3">
              {/* 角色头像 */}
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold
                transition-all duration-300 ease-out
                ${character.avatarColor}
                ${isActive ? 'scale-110 shadow-lg ring-2 ring-white/50' : 'hover:scale-105'}
                ${status === RESPONSE_STATUS.THINKING ? 'animate-pulse' : ''}
              `}>
                {character.name.charAt(0)}
                
                {/* 状态指示器叠加 */}
                {status === RESPONSE_STATUS.THINKING && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-ping"></div>
                )}
                {status === RESPONSE_STATUS.COMPLETED && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-bounce"></div>
                )}
                {status === RESPONSE_STATUS.ERROR && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                )}
              </div>

              {/* 内容区域 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h5 className="text-sm font-medium text-gray-900 truncate transition-colors duration-300">
                    {character.name}
                  </h5>
                  <div className="flex items-center space-x-1">
                    {getStatusIcon()}
                    <Badge 
                      variant="outline" 
                      className={`
                        text-xs transition-all duration-300
                        ${status === RESPONSE_STATUS.COMPLETED ? 'bg-green-100 text-green-800 border-green-300' : ''}
                        ${status === RESPONSE_STATUS.ERROR ? 'bg-red-100 text-red-800 border-red-300' : ''}
                        ${status === RESPONSE_STATUS.THINKING ? 'bg-blue-100 text-blue-800 border-blue-300' : ''}
                      `}
                    >
                      {getStatusText()}
                    </Badge>
                  </div>
                </div>

                {/* 响应内容预览或错误信息 */}
                {response && (
                  <div className="animate-in slide-in-from-bottom-2 duration-500">
                    <p className="text-xs text-gray-600 mt-1 italic bg-white p-2 rounded border transition-all duration-300 hover:shadow-sm">
                      "{getResponsePreview()}"
                    </p>
                  </div>
                )}
                
                {error && (
                  <div className="animate-in slide-in-from-bottom-2 duration-500">
                    <p className="text-xs text-red-600 mt-1 bg-red-50 p-2 rounded border border-red-200 transition-all duration-300">
                      错误: {error}
                    </p>
                  </div>
                )}

                {/* 进度指示器 */}
                {status === RESPONSE_STATUS.THINKING && (
                  <div className="mt-2 animate-in fade-in-0 duration-700">
                    <div className="w-full bg-blue-200 rounded-full h-1 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-blue-400 to-blue-600 h-1 rounded-full animate-pulse"
                        style={{
                          width: '60%',
                          animation: 'thinking-progress 2s ease-in-out infinite alternate'
                        }}
                      ></div>
                    </div>
                    <p className="text-xs text-blue-600 mt-1 animate-pulse">AI正在思考中...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-medium">{character.name}</p>
            <p className="text-xs text-muted-foreground">状态: {getStatusText()}</p>
            {response && (
              <p className="text-xs text-muted-foreground">响应: {response}</p>
            )}
            {error && (
              <p className="text-xs text-red-600">错误: {error}</p>
            )}
            {duration && (
              <p className="text-xs text-muted-foreground">耗时: {(duration / 1000).toFixed(1)}秒</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

/**
 * 整体进度条组件 - 增强动画版
 */
const OverallProgressBar: React.FC<OverallProgressBarProps> = ({
  currentIndex,
  totalResponders,
  estimatedEndTime,
  startTime
}) => {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [elapsedTime, setElapsedTime] = useState<string>('');
  const [progressAnimation, setProgressAnimation] = useState(false);

  // 计算进度百分比
  const progressPercentage = totalResponders > 0 ? (currentIndex / totalResponders) * 100 : 0;

  // 进度变化时触发动画
  useEffect(() => {
    setProgressAnimation(true);
    const timer = setTimeout(() => setProgressAnimation(false), 800);
    return () => clearTimeout(timer);
  }, [currentIndex]);

  // 更新剩余时间和已用时间
  useEffect(() => {
    const updateTimes = () => {
      const now = new Date();
      
      // 计算已用时间
      if (startTime) {
        const elapsed = now.getTime() - startTime.getTime();
        const elapsedSeconds = Math.floor(elapsed / 1000);
        const elapsedMinutes = Math.floor(elapsedSeconds / 60);
        
        if (elapsedMinutes > 0) {
          setElapsedTime(`${elapsedMinutes}:${(elapsedSeconds % 60).toString().padStart(2, '0')}`);
        } else {
          setElapsedTime(`${elapsedSeconds}s`);
        }
      }
      
      // 计算剩余时间
      if (!estimatedEndTime || !startTime) {
        setTimeRemaining('');
        return;
      }

      const remaining = Math.max(0, estimatedEndTime.getTime() - now.getTime());
      
      if (remaining === 0) {
        setTimeRemaining('即将完成');
        return;
      }

      const seconds = Math.floor(remaining / 1000);
      const minutes = Math.floor(seconds / 60);
      
      if (minutes > 0) {
        setTimeRemaining(`${minutes}:${(seconds % 60).toString().padStart(2, '0')}`);
      } else {
        setTimeRemaining(`${seconds}s`);
      }
    };

    updateTimes();
    const interval = setInterval(updateTimes, 1000);

    return () => clearInterval(interval);
  }, [estimatedEndTime, startTime]);

  return (
    <div className="space-y-3 p-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-lg border border-blue-200 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex justify-between items-center">
        <span className="font-semibold text-gray-800 flex items-center space-x-2">
          <div className="relative">
            <Users className="w-4 h-4 text-blue-600 transition-transform duration-300 hover:scale-110" />
            <div className="absolute -inset-1 bg-blue-400 rounded-full opacity-20 animate-ping"></div>
          </div>
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            总体进度
          </span>
        </span>
        
        <div className="flex items-center space-x-4 text-sm">
          {elapsedTime && (
            <div className="flex items-center space-x-1 text-gray-600 animate-in slide-in-from-right-2 duration-500">
              <Clock className="w-3 h-3 animate-pulse" />
              <span className="font-mono bg-gray-100 px-2 py-1 rounded-md transition-all duration-300 hover:bg-gray-200">
                已用: {elapsedTime}
              </span>
            </div>
          )}
          {timeRemaining && (
            <div className="flex items-center space-x-1 text-blue-600 animate-in slide-in-from-right-2 duration-700">
              <Clock className="w-3 h-3 animate-spin" />
              <span className="font-mono bg-blue-100 px-2 py-1 rounded-md transition-all duration-300 hover:bg-blue-200">
                预计: {timeRemaining}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 进度条 */}
      <div className="relative group">
        <div className={`
          transition-all duration-500 rounded-lg overflow-hidden
          ${progressAnimation ? 'progress-glow scale-[1.02]' : ''}
        `}>
          <Progress 
            value={progressPercentage} 
            className="w-full h-4 bg-gradient-to-r from-gray-200 to-gray-300 border border-gray-300 shadow-inner"
          />
        </div>
        
        {/* 进度百分比文字叠加 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`
            text-xs font-bold text-white drop-shadow-md transition-all duration-500
            ${progressPercentage === 100 ? 'animate-bounce scale-110' : ''}
          `}>
            {progressPercentage.toFixed(0)}%
          </span>
        </div>

        {/* 发光效果 */}
        {progressPercentage > 0 && progressPercentage < 100 && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] animate-shimmer group-hover:animate-shimmer-slow"></div>
        )}
      </div>
      
      {/* 详细统计 */}
      <div className="flex justify-between items-center text-xs">
        <div className="flex items-center space-x-4">
          <Badge 
            variant="outline" 
            className="bg-white hover:bg-gray-50 transition-all duration-300 hover:scale-105 cursor-default border-2"
          >
            <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
            {currentIndex}/{totalResponders} 完成
          </Badge>
          
          {totalResponders > currentIndex && (
            <Badge 
              variant="secondary" 
              className="animate-pulse hover:animate-none transition-all duration-300 hover:scale-105 cursor-default"
            >
              <Clock className="w-3 h-3 mr-1" />
              {totalResponders - currentIndex} 待响应
            </Badge>
          )}
        </div>

        {/* 进度状态指示器 */}
        <div className="flex items-center space-x-2">
          {progressPercentage === 100 ? (
            <div className="flex items-center space-x-1 text-green-600 animate-in zoom-in-75 duration-500">
              <CheckCircle className="w-4 h-4 animate-bounce" />
              <span className="text-xs font-medium">全部完成</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '0ms'}}></div>
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '200ms'}}></div>
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '400ms'}}></div>
              </div>
              <span className="text-xs text-blue-600 font-medium animate-pulse">
                进行中
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * 控制面板组件 - 增强动画版
 */
const MultiResponseControls: React.FC<MultiResponseControlsProps> = ({
  isPaused,
  inProgress,
  onPause,
  onResume,
  onCancel,
  onSkipCurrent,
  onOpenConfig,
  hasCurrentResponder
}) => {
  const [clickedButton, setClickedButton] = useState<string | null>(null);

  // 按钮点击动画效果
  const handleButtonClick = (buttonId: string, action: () => void) => {
    setClickedButton(buttonId);
    action();
    setTimeout(() => setClickedButton(null), 200);
  };

  // 键盘快捷键处理
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    // 只在多响应进行中处理快捷键
    if (!inProgress) return;
    
    // 防止在输入框中触发快捷键
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return;
    }

    switch (event.key.toLowerCase()) {
      case ' ': // 空格键：暂停/继续
        event.preventDefault();
        if (isPaused) {
          handleButtonClick('resume', onResume);
        } else {
          handleButtonClick('pause', onPause);
        }
        break;
      case 's': // S键：跳过当前
        if (hasCurrentResponder && !isPaused) {
          event.preventDefault();
          handleButtonClick('skip', onSkipCurrent);
        }
        break;
      case 'escape': // ESC键：取消全部
        event.preventDefault();
        handleButtonClick('cancel', onCancel);
        break;
      case 'c': // C键：打开配置
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          handleButtonClick('config', onOpenConfig);
        }
        break;
    }
  }, [inProgress, isPaused, hasCurrentResponder, onPause, onResume, onSkipCurrent, onCancel, onOpenConfig]);

  // 注册键盘事件监听
  useEffect(() => {
    if (inProgress) {
      document.addEventListener('keydown', handleKeyPress);
      return () => {
        document.removeEventListener('keydown', handleKeyPress);
      };
    }
  }, [inProgress, handleKeyPress]);

  return (
    <TooltipProvider>
      <div className="flex items-center space-x-2">
        {/* 暂停/继续按钮 */}
        {inProgress && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleButtonClick(isPaused ? 'resume' : 'pause', isPaused ? onResume : onPause)}
                className={`
                  flex items-center space-x-1 transition-all duration-300 transform
                  hover:scale-110 hover:shadow-lg active:scale-95
                  ${clickedButton === (isPaused ? 'resume' : 'pause') ? 'scale-90 bg-opacity-80' : ''}
                  ${isPaused 
                    ? 'bg-green-50 hover:bg-green-100 border-green-300 text-green-700 shadow-green-200/50' 
                    : 'bg-blue-50 hover:bg-blue-100 border-blue-300 text-blue-700 shadow-blue-200/50'
                  }
                `}
              >
                {isPaused ? (
                  <>
                    <Play className="w-3 h-3 animate-in zoom-in-75 duration-300" />
                    <span className="font-medium">继续</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-3 h-3 animate-in zoom-in-75 duration-300" />
                    <span className="font-medium">暂停</span>
                  </>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="bg-gray-900 text-white">
              <p>{isPaused ? '继续响应' : '暂停响应'} <kbd className="ml-1 px-1 bg-gray-700 rounded text-xs">空格</kbd></p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* 跳过当前按钮 */}
        {inProgress && hasCurrentResponder && !isPaused && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleButtonClick('skip', onSkipCurrent)}
                className={`
                  flex items-center space-x-1 transition-all duration-300 transform
                  hover:scale-110 hover:shadow-lg active:scale-95
                  ${clickedButton === 'skip' ? 'scale-90 bg-opacity-80' : ''}
                  bg-yellow-50 hover:bg-yellow-100 border-yellow-300 text-yellow-700 shadow-yellow-200/50
                `}
              >
                <SkipForward className="w-3 h-3 animate-in zoom-in-75 duration-300" />
                <span className="font-medium">跳过</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="bg-gray-900 text-white">
              <p>跳过当前角色响应 <kbd className="ml-1 px-1 bg-gray-700 rounded text-xs">S</kbd></p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* 取消全部按钮 */}
        {inProgress && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleButtonClick('cancel', onCancel)}
                className={`
                  flex items-center space-x-1 transition-all duration-300 transform
                  hover:scale-110 hover:shadow-lg active:scale-95
                  ${clickedButton === 'cancel' ? 'scale-90 bg-opacity-80' : ''}
                  bg-red-500 hover:bg-red-600 shadow-red-300/50
                `}
              >
                <Square className="w-3 h-3 animate-in zoom-in-75 duration-300" />
                <span className="font-medium">取消</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="bg-gray-900 text-white">
              <p>取消所有响应 <kbd className="ml-1 px-1 bg-gray-700 rounded text-xs">ESC</kbd></p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* 配置按钮 */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleButtonClick('config', onOpenConfig)}
              className={`
                flex items-center space-x-1 transition-all duration-300 transform
                hover:scale-110 hover:shadow-md active:scale-95
                ${clickedButton === 'config' ? 'scale-90 bg-opacity-80' : ''}
                hover:bg-gray-100 text-gray-600 hover:text-gray-800
              `}
            >
              <Settings className="w-3 h-3 animate-in zoom-in-75 duration-300 hover:rotate-180 transition-transform duration-500" />
              <span className="font-medium">配置</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="bg-gray-900 text-white">
            <p>打开响应配置 <kbd className="ml-1 px-1 bg-gray-700 rounded text-xs">Ctrl+C</kbd></p>
          </TooltipContent>
        </Tooltip>

        {/* 快捷键提示 */}
        {inProgress && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center text-xs text-muted-foreground cursor-help ml-2 p-1 hover:bg-gray-100 rounded transition-all duration-300">
                <Keyboard className="w-3 h-3 mr-1 animate-pulse" />
                <span className="font-medium">快捷键</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs bg-gray-900 text-white">
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span>暂停/继续:</span>
                  <kbd className="px-2 py-1 bg-gray-700 rounded text-xs font-mono">空格</kbd>
                </div>
                <div className="flex justify-between items-center">
                  <span>跳过当前:</span>
                  <kbd className="px-2 py-1 bg-gray-700 rounded text-xs font-mono">S</kbd>
                </div>
                <div className="flex justify-between items-center">
                  <span>取消全部:</span>
                  <kbd className="px-2 py-1 bg-gray-700 rounded text-xs font-mono">ESC</kbd>
                </div>
                <div className="flex justify-between items-center">
                  <span>打开配置:</span>
                  <kbd className="px-2 py-1 bg-gray-700 rounded text-xs font-mono">Ctrl+C</kbd>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
};

/**
 * 主组件 - 多AI响应展示 (增强动画版)
 */
const MultiResponseDisplay: React.FC<MultiResponseDisplayProps> = ({
  multiResponseState,
  characters,
  onPause,
  onResume,
  onCancel,
  onSkipCurrent,
  onOpenConfig
}) => {
  const {
    plan,
    currentResponderIndex,
    inProgress,
    startTime,
    estimatedEndTime,
    completedResponses,
    errors,
    isPaused,
    userCancelled
  } = multiResponseState;

  const [isVisible, setIsVisible] = useState(false);

  // 组件挂载时的进入动画
  useEffect(() => {
    if (plan && inProgress) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [plan, inProgress]);

  // 计算每个角色的状态
  const characterStates = useMemo(() => {
    if (!plan || !plan.selectedResponders) return [];

    return plan.selectedResponders.map((responder, index) => {
      const character = characters.find(c => c.id === responder.characterId);
      if (!character) return null;

      let status: ResponseStatus;
      let response: string | undefined;
      let error: string | undefined;
      let duration: number | undefined;

      // 确定状态
      const completedResponse = completedResponses.find(r => r.characterId === responder.characterId);
      const errorResponse = errors.find(e => e.characterId === responder.characterId);

      if (completedResponse) {
        status = RESPONSE_STATUS.COMPLETED;
        response = completedResponse.response;
        duration = completedResponse.duration;
      } else if (errorResponse) {
        status = RESPONSE_STATUS.ERROR;
        error = errorResponse.error;
      } else if (index === currentResponderIndex && inProgress && !isPaused) {
        status = RESPONSE_STATUS.THINKING;
      } else if (index < currentResponderIndex) {
        status = RESPONSE_STATUS.SKIPPED;
      } else {
        status = RESPONSE_STATUS.WAITING;
      }

      return {
        character,
        status,
        response,
        error,
        duration,
        isActive: index === currentResponderIndex && inProgress
      };
    }).filter(Boolean);
  }, [plan, currentResponderIndex, inProgress, isPaused, completedResponses, errors, characters]);

  // 如果没有活跃的多响应状态，不显示组件
  if (!plan || !inProgress) {
    return null;
  }

  const hasCurrentResponder = currentResponderIndex < (plan.selectedResponders?.length || 0);

  return (
    <>
      {/* CSS样式定义 */}
      <style jsx>{`
        @keyframes thinking-progress {
          0% { width: 20%; }
          50% { width: 80%; }
          100% { width: 60%; }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
          20%, 40%, 60%, 80% { transform: translateX(2px); }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
        
        @keyframes shimmer-slow {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
        
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        
        .animate-shimmer-slow {
          animation: shimmer-slow 3s infinite;
        }
        
        .status-transition {
          transform: scale(1.05);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .multi-response-enter {
          animation: slideInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        
        .multi-response-exit {
          animation: slideOutDown 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes slideOutDown {
          from {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          to {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
        }
        
        .shake {
          animation: shake 0.5s ease-in-out;
        }
        
        .progress-glow {
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.6), 0 0 40px rgba(59, 130, 246, 0.4);
          filter: brightness(1.1);
        }
        
        /* 自定义滚动条样式 */
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 2px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 2px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        
        /* 按钮涟漪效果 */
        .button-ripple {
          position: relative;
          overflow: hidden;
        }
        
        .button-ripple::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          background: rgba(255, 255, 255, 0.5);
          border-radius: 50%;
          transform: translate(-50%, -50%);
          transition: width 0.6s, height 0.6s;
        }
        
        .button-ripple:active::before {
          width: 300px;
          height: 300px;
        }
      `}</style>

      <div 
        className={`
          fixed bottom-4 right-4 z-50 transition-all duration-600 ease-out
          ${isVisible ? 'multi-response-enter' : 'multi-response-exit'}
        `}
      >
        <Card className="w-96 shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-lg">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center space-x-2">
                <div className="relative">
                  <Users className="w-5 h-5 text-blue-500" />
                  {inProgress && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>
                  )}
                </div>
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  多AI响应进行中
                </span>
                {isPaused && (
                  <Badge variant="secondary" className="animate-pulse">
                    已暂停
                  </Badge>
                )}
              </CardTitle>
              
              <MultiResponseControls
                isPaused={isPaused}
                inProgress={inProgress}
                onPause={onPause}
                onResume={onResume}
                onCancel={onCancel}
                onSkipCurrent={onSkipCurrent}
                onOpenConfig={onOpenConfig}
                hasCurrentResponder={hasCurrentResponder}
              />
            </div>
          </CardHeader>

          <CardContent className="space-y-4 max-h-96 overflow-hidden">
            {/* 整体进度条 */}
            <div className="animate-in slide-in-from-top-2 duration-500">
              <OverallProgressBar
                currentIndex={completedResponses.length + errors.length}
                totalResponders={plan.selectedResponders?.length || 0}
                estimatedEndTime={estimatedEndTime}
                startTime={startTime}
              />
            </div>

            {/* 响应队列 */}
            <div className="space-y-2 animate-in slide-in-from-bottom-2 duration-700">
              <h4 className="text-sm font-medium text-muted-foreground flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span>响应队列</span>
              </h4>
              <div className="space-y-2 max-h-64 overflow-y-auto scroll-smooth custom-scrollbar">
                {characterStates.map((state, index) => (
                  state && (
                    <div
                      key={state.character.id}
                      className="animate-in slide-in-from-left-2 duration-500"
                      style={{
                        animationDelay: `${index * 100}ms`
                      }}
                    >
                      <ResponseQueueItem
                        character={state.character}
                        status={state.status}
                        response={state.response}
                        error={state.error}
                        isActive={state.isActive}
                        duration={state.duration}
                      />
                    </div>
                  )
                ))}
              </div>
            </div>

            {/* 状态信息 */}
            {userCancelled && (
              <div className="text-center p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200 animate-in fade-in-0 duration-500">
                <div className="flex items-center justify-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm text-yellow-700 font-medium">
                    响应已被用户取消
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default MultiResponseDisplay; 