import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { MultiResponseConfig } from '@/lib/multiResponseEvaluator';
import { AICharacter } from '@/types/tavern';

interface MultiResponseConfigPanelProps {
  config: MultiResponseConfig;
  onConfigChange: (config: MultiResponseConfig) => void;
  characters?: AICharacter[]; // 添加角色列表参数
}

const MultiResponseConfigPanel: React.FC<MultiResponseConfigPanelProps> = ({
  config,
  onConfigChange,
  characters = []
}) => {
  const maxAllowedResponders = Math.max(characters.length, 1); // 确保至少为1

  const handleChange = (field: keyof MultiResponseConfig, value: any) => {
    onConfigChange({
      ...config,
      [field]: value
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">🎭 多AI响应配置</CardTitle>
        <CardDescription className="text-xs">
          配置多个AI角色同时响应玩家消息的行为
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 启用多响应开关 */}
        <div className="flex items-center justify-between">
          <Label htmlFor="enable-multi-response" className="text-sm">
            启用多AI响应
          </Label>
          <Switch
            id="enable-multi-response"
            checked={config.enableMultiResponse}
            onCheckedChange={(checked) => handleChange('enableMultiResponse', checked)}
          />
        </div>

        {config.enableMultiResponse && (
          <>
            {/* 最大响应者数量 */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-sm">最大响应者数量</Label>
                <span className="text-xs text-muted-foreground">{Math.min(config.maxResponders, maxAllowedResponders)}</span>
              </div>
              <Slider
                value={[Math.min(config.maxResponders, maxAllowedResponders)]}
                onValueChange={(value) => handleChange('maxResponders', value[0])}
                min={1}
                max={maxAllowedResponders}
                step={1}
                className="w-full"
              />
              <div className="text-xs text-muted-foreground">
                最多允许 {maxAllowedResponders} 个角色同时响应（当前有{characters.length}个角色）
              </div>
            </div>

            {/* 响应阈值 */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-sm">响应阈值</Label>
                <span className="text-xs text-muted-foreground">{config.responseThreshold.toFixed(2)}</span>
              </div>
              <Slider
                value={[config.responseThreshold]}
                onValueChange={(value) => handleChange('responseThreshold', value[0])}
                min={0.1}
                max={0.9}
                step={0.05}
                className="w-full"
              />
              <div className="text-xs text-muted-foreground">
                角色需要达到 {(config.responseThreshold * 100).toFixed(0)}% 的兴趣度才会响应
              </div>
            </div>

            {/* 响应间隔时间 */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-sm">响应间隔</Label>
                <span className="text-xs text-muted-foreground">{(config.responseInterval / 1000).toFixed(1)}s</span>
              </div>
              <Slider
                value={[config.responseInterval]}
                onValueChange={(value) => handleChange('responseInterval', value[0])}
                min={1000}
                max={5000}
                step={500}
                className="w-full"
              />
              <div className="text-xs text-muted-foreground">
                多个角色响应的间隔时间
              </div>
            </div>

            {/* 优先处理@提及 */}
            <div className="flex items-center justify-between">
              <Label htmlFor="prioritize-mentioned" className="text-sm">
                优先@提及角色
              </Label>
              <Switch
                id="prioritize-mentioned"
                checked={config.prioritizeMentioned}
                onCheckedChange={(checked) => handleChange('prioritizeMentioned', checked)}
              />
            </div>
            <div className="text-xs text-muted-foreground">
              被@提及的角色会获得更高的响应优先级
            </div>


          </>
        )}

        {!config.enableMultiResponse && (
          <div className="text-xs text-muted-foreground bg-gray-50 p-3 rounded">
            关闭多AI响应时，只有一个最合适的角色会回应玩家消息
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MultiResponseConfigPanel; 