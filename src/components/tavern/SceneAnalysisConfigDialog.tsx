import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SceneAnalysisConfigDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: { baseUrl: string; apiKey: string; modelName: string }) => void;
  currentConfig: { baseUrl: string; apiKey: string; modelName: string };
}

const SceneAnalysisConfigDialog: React.FC<SceneAnalysisConfigDialogProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  currentConfig 
}) => {
  const [baseUrl, setBaseUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [modelName, setModelName] = useState('');

  useEffect(() => {
    if (currentConfig) {
      setBaseUrl(currentConfig.baseUrl || '');
      setApiKey(currentConfig.apiKey || '');
      setModelName(currentConfig.modelName || '');
    }
  }, [currentConfig, isOpen]);

  const handleSave = () => {
    onSave({ baseUrl, apiKey, modelName });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-tavern-panel-bg text-tavern-text border-tavern-accent">
        <DialogHeader>
          <DialogTitle>配置场景分析模型</DialogTitle>
          <DialogDescription>
            设置用于自动生成角色的AI模型参数。
            此模型将分析场景描述并生成适合的角色。
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="sceneBaseUrl" className="text-right col-span-1">
              Base URL
            </Label>
            <Input
              id="sceneBaseUrl"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              className="col-span-3 bg-tavern-bg border-tavern-text focus:border-tavern-accent"
              placeholder="例如: https://api.deepseek.com/v1"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="sceneApiKey" className="text-right col-span-1">
              API Key
            </Label>
            <Input
              id="sceneApiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="col-span-3 bg-tavern-bg border-tavern-text focus:border-tavern-accent"
              placeholder="您的API密钥"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="sceneModelName" className="text-right col-span-1">
              Model Name
            </Label>
            <Input
              id="sceneModelName"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              className="col-span-3 bg-tavern-bg border-tavern-text focus:border-tavern-accent"
              placeholder="例如: deepseek-chat"
            />
          </div>
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose} 
            className="text-tavern-text border-tavern-accent hover:bg-tavern-accent/20"
          >
            取消
          </Button>
          <Button 
            onClick={handleSave} 
            className="bg-tavern-accent hover:bg-tavern-accent/80 text-white"
          >
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SceneAnalysisConfigDialog; 