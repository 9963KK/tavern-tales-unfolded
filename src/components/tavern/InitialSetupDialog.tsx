import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Settings, Sparkles, MapPin, Eye, EyeOff, Loader2 } from 'lucide-react';

export interface ModelConfig {
  baseUrl: string;
  apiKey: string;
  modelName: string;
}

export interface ScenarioConfig {
  name: string;
  description: string;
  setting: string;
  atmosphere: string;
  category: string;
}

interface InitialSetupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (config: ModelConfig, scenario: ScenarioConfig | null, customSceneDescription?: string) => void;
  isLoading?: boolean;
}

// 预设场景选项
const PRESET_SCENARIOS: ScenarioConfig[] = [
  {
    name: "游荡翼龙酒馆",
    description: "一间充满冒险者的传统奇幻酒馆，各路英雄在此相聚",
    setting: "你发现自己身处于光线昏暗的游荡翼龙酒馆。空气中弥漫着陈年麦酒和木柴烟熏的气味。低语交谈声和酒杯碰撞声充满了整个房间。壁炉的火焰跳跃着，墙上挂着各种冒险纪念品和战利品。",
    atmosphere: "温馨、热闹、充满冒险氛围",
    category: "奇幻"
  },
  {
    name: "星际空间站咖啡厅",
    description: "未来世界的豪华空间站，汇聚着来自各星系的旅客",
    setting: "你正位于奥米加空间站的观景咖啡厅内。透过巨大的全息玻璃窗，可以看到璀璨的星海和往来的星际飞船。咖啡厅内播放着轻柔的合成音乐，服务机器人在各桌间穿梭。来自不同星球的客人们正在享受着各种异域美食。",
    atmosphere: "科幻、现代、多元文化",
    category: "科幻"
  },
  {
    name: "江南茶楼",
    description: "古典雅致的江南水乡茶楼，文人墨客云集之地",
    setting: "你坐在临水而建的听雨轩茶楼二楼。窗外是小桥流水，柳絮飞舞。茶楼内古琴悠扬，茶香袅袅。身着古装的茶客们正在品茗论诗，偶尔传来轻声的笑谈声。雕花木窗透进温和的午后阳光。",
    atmosphere: "古典、雅致、文化气息浓厚",
    category: "古风"
  },
  {
    name: "赛博朋克夜店",
    description: "霓虹闪烁的地下夜店，信息商人与黑客的聚集地",
    setting: "你进入了名为数据流的地下夜店。霓虹灯光在烟雾中闪烁，电子音乐震撼着整个空间。吧台后的全息屏幕显示着不断跳动的数据流。戴着AR眼镜的客人们正在进行各种神秘的交易。",
    atmosphere: "神秘、高科技、地下文化",
    category: "赛博朋克"
  },
  {
    name: "魔法学院图书馆",
    description: "古老魔法学院的藏书丰富的图书馆，充满学术氛围",
    setting: "你身处阿卡纳学院的古老图书馆中。高大的书架直达天花板，漂浮的蜡烛提供着温暖的光明。古老的魔法书籍散发着淡淡的魔力光辉。学者们正在埋头研究，偶尔有羽毛笔自动书写的沙沙声。",
    atmosphere: "学术、神秘、充满智慧",
    category: "奇幻学院"
  },
  {
    name: "西部小镇酒吧",
    description: "荒野西部的小镇酒吧，牛仔和拓荒者的聚集地",
    setting: "你推开了响尾蛇酒吧的百叶门。木制吧台上摆着威士忌酒瓶，钢琴师正在弹奏着悠扬的曲调。戴着牛仔帽的客人们坐在圆桌旁，空气中弥漫着烟草和皮革的味道。墙上的鹿头标本俯视着整个酒吧。",
    atmosphere: "粗犷、自由、充满冒险精神",
    category: "西部"
  }
];

const InitialSetupDialog: React.FC<InitialSetupDialogProps> = ({
  isOpen,
  onClose,
  onComplete,
  isLoading = false
}) => {
  const [activeTab, setActiveTab] = useState<string>('model');
  const [modelConfig, setModelConfig] = useState<ModelConfig>({
    baseUrl: 'https://api.deepseek.com/v1',
    apiKey: '',
    modelName: 'deepseek-chat'
  });
  const [selectedScenario, setSelectedScenario] = useState<ScenarioConfig | null>(null);
  const [customSceneDescription, setCustomSceneDescription] = useState<string>('');
  const [useCustomScene, setUseCustomScene] = useState<boolean>(false);
  const [showApiKey, setShowApiKey] = useState<boolean>(false);

  const handleModelConfigChange = (field: keyof ModelConfig, value: string) => {
    setModelConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleContinueToScenario = () => {
    if (!modelConfig.baseUrl || !modelConfig.apiKey || !modelConfig.modelName) {
      alert('请填写完整的模型配置信息');
      return;
    }
    setActiveTab('scenario');
  };

  const handleComplete = () => {
    if (!modelConfig.baseUrl || !modelConfig.apiKey || !modelConfig.modelName) {
      alert('请填写完整的模型配置信息');
      return;
    }

    if (useCustomScene) {
      if (!customSceneDescription.trim()) {
        alert('请输入自定义场景描述');
        return;
      }
      onComplete(modelConfig, null, customSceneDescription.trim());
    } else {
      if (!selectedScenario) {
        alert('请选择一个场景');
        return;
      }
      onComplete(modelConfig, selectedScenario);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      '奇幻': 'bg-purple-500',
      '科幻': 'bg-blue-500',
      '古风': 'bg-green-500',
      '赛博朋克': 'bg-pink-500',
      '奇幻学院': 'bg-indigo-500',
      '西部': 'bg-orange-500'
    };
    return colors[category] || 'bg-gray-500';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            欢迎来到 Tavern Tales - 初始设置
          </DialogTitle>
          <DialogDescription>
            开始你的冒险之前，请先配置AI模型和选择场景
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="model" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              模型配置
            </TabsTrigger>
            <TabsTrigger value="scenario" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              场景选择
            </TabsTrigger>
          </TabsList>

          <TabsContent value="model" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">AI模型配置</CardTitle>
                <CardDescription>
                  配置用于生成角色对话的AI模型参数
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="baseUrl">API Base URL</Label>
                  <Input
                    id="baseUrl"
                    placeholder="https://api.deepseek.com/v1"
                    value={modelConfig.baseUrl}
                    onChange={(e) => handleModelConfigChange('baseUrl', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key</Label>
                  <div className="relative">
                    <Input
                      id="apiKey"
                      type={showApiKey ? 'text' : 'password'}
                      placeholder="sk-..."
                      value={modelConfig.apiKey}
                      onChange={(e) => handleModelConfigChange('apiKey', e.target.value)}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="modelName">模型名称</Label>
                  <Input
                    id="modelName"
                    placeholder="deepseek-chat"
                    value={modelConfig.modelName}
                    onChange={(e) => handleModelConfigChange('modelName', e.target.value)}
                  />
                </div>

                <div className="pt-4">
                  <Button 
                    onClick={handleContinueToScenario}
                    className="w-full"
                    disabled={!modelConfig.baseUrl || !modelConfig.apiKey || !modelConfig.modelName}
                  >
                    继续选择场景
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scenario" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">选择你的冒险场景</h3>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="customScene"
                    checked={useCustomScene}
                    onChange={(e) => setUseCustomScene(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="customScene">自定义场景</Label>
                </div>
              </div>

              {useCustomScene ? (
                <Card>
                  <CardHeader>
                    <CardTitle>自定义场景描述</CardTitle>
                    <CardDescription>
                      描述你想要的场景环境，AI将根据你的描述生成相应的角色
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder="请详细描述你想要的场景环境，包括地点、氛围、背景设定等..."
                      value={customSceneDescription}
                      onChange={(e) => setCustomSceneDescription(e.target.value)}
                      rows={6}
                      className="resize-none"
                    />
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                  {PRESET_SCENARIOS.map((scenario) => (
                    <Card
                      key={scenario.name}
                      className={`cursor-pointer transition-all hover:shadow-lg ${
                        selectedScenario?.name === scenario.name
                          ? 'ring-2 ring-purple-500 bg-purple-50 dark:bg-purple-950/20'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                      onClick={() => setSelectedScenario(scenario)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{scenario.name}</CardTitle>
                          <Badge className={`text-white ${getCategoryColor(scenario.category)}`}>
                            {scenario.category}
                          </Badge>
                        </div>
                        <CardDescription className="text-sm">
                          {scenario.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-3">
                          {scenario.setting}
                        </p>
                        <p className="text-xs text-purple-600 dark:text-purple-400 mt-2 font-medium">
                          氛围：{scenario.atmosphere}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              <div className="flex justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={() => setActiveTab('model')}
                >
                  返回模型配置
                </Button>
                <Button
                  onClick={handleComplete}
                  disabled={
                    isLoading ||
                    (useCustomScene ? !customSceneDescription.trim() : !selectedScenario)
                  }
                  className="min-w-[120px]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    '开始冒险'
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default InitialSetupDialog; 