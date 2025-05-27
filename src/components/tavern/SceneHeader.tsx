
import React from 'react';
import { Button } from '@/components/ui/button';
import { Edit3 } from 'lucide-react';

interface SceneHeaderProps {
  description: string;
  onEditScene?: () => void;
}

const SceneHeader: React.FC<SceneHeaderProps> = ({ description, onEditScene }) => {
  return (
    <div className="p-4 bg-tavern-panel-bg rounded-t-lg shadow-md mb-2">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-semibold text-tavern-accent">AI酒馆奇谈</h2>
        {onEditScene && (
          <Button
            onClick={onEditScene}
            variant="ghost"
            size="sm"
            className="text-tavern-accent hover:text-yellow-400 hover:bg-tavern-accent/10 transition-colors text-xs"
          >
            <Edit3 size={14} className="mr-1" />
            编辑场景
          </Button>
        )}
      </div>
      <p className="text-sm text-tavern-text italic cursor-pointer hover:text-tavern-accent transition-colors" onClick={onEditScene}>
        {description}
      </p>
      {onEditScene && (
        <p className="text-xs text-tavern-text opacity-50 mt-1">
          💡 点击场景描述可修改背景设定
        </p>
      )}
    </div>
  );
};

export default SceneHeader;

