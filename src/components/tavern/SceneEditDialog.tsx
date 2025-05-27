import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Scroll, Sparkles } from 'lucide-react';

interface SceneEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (description: string) => void;
  currentDescription: string;
}

const SceneEditDialog: React.FC<SceneEditDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  currentDescription,
}) => {
  const [description, setDescription] = useState(currentDescription);

  useEffect(() => {
    setDescription(currentDescription);
  }, [currentDescription, isOpen]);

  const handleSave = () => {
    if (description.trim()) {
      onSave(description.trim());
      onClose();
    }
  };

  const handleCancel = () => {
    setDescription(currentDescription);
    onClose();
  };

  // 预设场景模板
  const sceneTemplates = [
    {
      name: "神秘酒馆",
      description: "你发现自己身处于光线昏暗的'游荡翼龙'酒馆。空气中弥漫着陈年麦酒和木柴烟熏的气味。低语交谈声和酒杯碰撞声充满了整个房间。"
    },
    {
      name: "魔法学院",
      description: "古老的魔法学院图书馆中，高耸的书架直达天花板，魔法水晶散发着柔和的蓝光。空气中弥漫着羊皮纸和魔法药剂的气味，偶尔传来翻书声和低声咒语吟唱。"
    },
    {
      name: "冒险者公会",
      description: "热闹的冒险者公会大厅里，告示板上贴满了各种任务委托。身着各种装备的冒险者们三三两两地聚在一起讨论着最新的任务和传说中的宝藏。"
    },
    {
      name: "皇宫议事厅",
      description: "庄严的皇宫议事厅内，华丽的吊灯投下金黄色的光芒。大理石柱撑起穹顶，墙上挂着历代君王的肖像，空气中充满了权力与阴谋的气息。"
    },
    {
      name: "神秘遗迹",
      description: "古老遗迹的石室内，墙壁上刻满了神秘的符文，微弱的光芒从水晶中透出。空气潮湿而古老，似乎隐藏着千年的秘密和未知的危险。"
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-amber-950 to-amber-900 border-amber-600/50 text-amber-100 max-w-2xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-amber-200 flex items-center gap-2 text-lg font-semibold">
            <Scroll size={20} className="text-amber-300" />
            编辑场景描述
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-5">
          <div>
            <Label className="text-sm font-medium text-amber-200 mb-3 block">
              场景描述
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="描述一个生动的场景，AI将基于此生成相应的角色..."
              className="min-h-32 bg-amber-950/40 border-amber-600/40 text-amber-100 placeholder:text-amber-300/50 resize-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-all"
              rows={6}
            />
            <p className="text-xs text-amber-200/60 mt-2 bg-amber-950/20 p-2 rounded-md border border-amber-800/30">
              💡 详细的场景描述有助于AI生成更符合环境的角色
            </p>
          </div>

          {/* 预设场景模板 */}
          <div>
            <Label className="text-sm font-medium text-amber-200 mb-3 block flex items-center gap-1">
              <Sparkles size={14} className="text-amber-300" />
              快速选择预设场景
            </Label>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {sceneTemplates.map((template) => (
                <div
                  key={template.name}
                  onClick={() => setDescription(template.description)}
                  className="group relative bg-gradient-to-r from-amber-950/30 to-amber-900/20 border border-amber-700/40 rounded-lg p-3 cursor-pointer hover:border-amber-500/60 hover:from-amber-950/50 hover:to-amber-900/40 transition-all duration-300 overflow-hidden"
                >
                  {/* 背景装饰 */}
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-amber-600/5 to-amber-800/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-amber-200 text-sm group-hover:text-amber-100 transition-colors">
                        {template.name}
                      </h4>
                      <span className="text-xs text-amber-300/60 group-hover:text-amber-200/80 transition-colors px-2 py-1 bg-amber-900/30 rounded-full">
                        点击使用
                      </span>
                    </div>
                    <p className="text-xs text-amber-100/70 leading-relaxed break-words overflow-hidden">
                      <span className="block line-clamp-3">
                        {template.description}
                      </span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-xs text-amber-200/60 mt-3 text-center bg-amber-950/20 rounded-md py-2 border border-amber-800/30">
              <Sparkles size={12} className="inline mr-1" />
              选择预设场景后可继续编辑修改
            </div>
          </div>
        </div>

        <DialogFooter className="gap-3 pt-2">
          <Button
            onClick={handleCancel}
            variant="ghost"
            className="bg-amber-900/30 text-amber-200 border border-amber-700/40 hover:bg-amber-800/40 hover:border-amber-600/60 hover:text-amber-100 transition-all"
          >
            取消
          </Button>
          <Button
            onClick={handleSave}
            disabled={!description.trim()}
            className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-amber-950 font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            保存场景
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SceneEditDialog; 