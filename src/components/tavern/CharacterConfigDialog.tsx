import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AICharacter, ModelConfig } from '@/types/tavern';
import { Textarea } from '@/components/ui/textarea';

interface CharacterConfigDialogProps {
  character: AICharacter | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (characterId: string, config: ModelConfig) => void;
}

const CharacterConfigDialog: React.FC<CharacterConfigDialogProps> = ({ character, isOpen, onClose, onSave }) => {
  const [baseUrl, setBaseUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [modelName, setModelName] = useState('');
  const [prompt, setPrompt] = useState('');

  useEffect(() => {
    if (character && character.modelConfig) {
      setBaseUrl(character.modelConfig.baseUrl || '');
      setApiKey(character.modelConfig.apiKey || '');
      setModelName(character.modelConfig.modelName || '');
      setPrompt(character.modelConfig.prompt || '');
    } else {
      setBaseUrl('');
      setApiKey('');
      setModelName('');
      setPrompt('');
    }
  }, [character]);

  const handleSave = () => {
    if (character) {
      onSave(character.id, { baseUrl, apiKey, modelName, prompt });
    }
  };

  if (!character) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-tavern-panel-bg text-tavern-text border-tavern-accent">
        <DialogHeader>
          <DialogTitle>配置 {character.name} 的AI模型</DialogTitle>
          <DialogDescription>
            为 {character.name} 设置特定的API端点和模型。
            请注意：API密钥将存储在浏览器本地，请谨慎操作。
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="baseUrl" className="text-right col-span-1">
              Base URL
            </Label>
            <Input
              id="baseUrl"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              className="col-span-3 bg-tavern-bg border-tavern-text focus:border-tavern-accent"
              placeholder="例如: https://api.openai.com/v1"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="apiKey" className="text-right col-span-1">
              API Key
            </Label>
            <Input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="col-span-3 bg-tavern-bg border-tavern-text focus:border-tavern-accent"
              placeholder="您的API密钥"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="modelName" className="text-right col-span-1">
              Model Name
            </Label>
            <Input
              id="modelName"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              className="col-span-3 bg-tavern-bg border-tavern-text focus:border-tavern-accent"
              placeholder="例如: gpt-4o-mini"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="prompt" className="text-right col-span-1">
              角色专属Prompt
            </Label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="col-span-3 bg-tavern-bg border-tavern-text focus:border-tavern-accent"
              placeholder="为该角色定制的行为/语气/背景等提示词"
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="text-tavern-text border-tavern-accent hover:bg-tavern-accent/20">取消</Button>
          <Button onClick={handleSave} className="bg-tavern-accent hover:bg-tavern-accent/80 text-white">保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CharacterConfigDialog;
