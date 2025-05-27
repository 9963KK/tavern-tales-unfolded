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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AICharacter } from '@/types/tavern';

interface CharacterPromptDialogProps {
  character: AICharacter | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (characterId: string, prompt: string) => void;
}

const CharacterPromptDialog: React.FC<CharacterPromptDialogProps> = ({ 
  character, 
  isOpen, 
  onClose, 
  onSave 
}) => {
  const [prompt, setPrompt] = useState('');

  useEffect(() => {
    if (character && character.modelConfig) {
      setPrompt(character.modelConfig.prompt || '');
    } else {
      setPrompt('');
    }
  }, [character]);

  const handleSave = () => {
    if (character) {
      onSave(character.id, prompt);
    }
  };

  if (!character) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-tavern-panel-bg text-tavern-text border-tavern-accent">
        <DialogHeader>
          <DialogTitle>编辑 {character.name} 的角色设定</DialogTitle>
          <DialogDescription>
            为 {character.name} 设置专属的角色Prompt，定义其性格、语气和行为特点。
            <br />
            <span className="text-yellow-500 text-xs">💡 提示：模型配置（API参数）请在右侧面板中设置</span>
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="prompt" className="text-sm font-medium">
              角色专属Prompt
            </Label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="bg-tavern-bg border-tavern-text focus:border-tavern-accent min-h-[200px]"
              placeholder={`例如：你是${character.name}，是一位经验丰富的酒保。你性格开朗友善，喜欢与客人聊天，对各种酒类和当地传说都非常了解。你说话时带有一种温暖的关怀，经常用"朋友"来称呼客人。你有着敏锐的观察力，能够察觉客人的情绪变化...`}
              rows={8}
            />
          </div>
          <div className="text-xs text-tavern-text opacity-70">
            <p>• 描述角色的性格特点、背景故事、说话方式</p>
            <p>• 设定角色的专业知识和兴趣爱好</p>
            <p>• 定义角色与其他人物的关系</p>
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
            保存设定
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CharacterPromptDialog; 