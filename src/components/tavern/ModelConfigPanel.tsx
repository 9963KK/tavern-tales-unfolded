import React, { useState } from 'react';
import { AICharacter, ModelConfig } from '@/types/tavern';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Slider } from '@/components/ui/slider';
import { ChevronLeft, ChevronRight, Settings } from 'lucide-react';
import { modelDefaults } from '@/data/modelDefaults';
import MultiResponseConfigPanel from './MultiResponseConfigPanel';
import { MultiResponseConfig } from '@/lib/multiResponseEvaluator';

interface ModelConfigPanelProps {
  characters: AICharacter[];
  onUpdateCharacterConfig: (characterId: string, config: ModelConfig) => void;
  multiResponseConfig?: MultiResponseConfig;
  onMultiResponseConfigChange?: (config: MultiResponseConfig) => void;
}

const ModelConfigPanel: React.FC<ModelConfigPanelProps> = ({ 
  characters, 
  onUpdateCharacterConfig,
  multiResponseConfig,
  onMultiResponseConfigChange 
}) => {
  const [editingConfigs, setEditingConfigs] = useState<Record<string, ModelConfig>>({});
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [showAdvancedConfigs, setShowAdvancedConfigs] = useState<Record<string, boolean>>({});

  const getCharacterConfig = (character: AICharacter): ModelConfig => {
    if (editingConfigs[character.id]) {
      return editingConfigs[character.id];
    }
    return {
      baseUrl: character.modelConfig?.baseUrl || modelDefaults.baseUrl,
      apiKey: character.modelConfig?.apiKey || modelDefaults.apiKey,
      modelName: character.modelConfig?.modelName || modelDefaults.modelName,
      prompt: character.modelConfig?.prompt || '',
      temperature: character.modelConfig?.temperature ?? 0.7,
      maxTokens: character.modelConfig?.maxTokens ?? 2048,
      topP: character.modelConfig?.topP ?? 1.0,
      frequencyPenalty: character.modelConfig?.frequencyPenalty ?? 0.0,
      presencePenalty: character.modelConfig?.presencePenalty ?? 0.0,
    };
  };

  const updateEditingConfig = (characterId: string, field: keyof ModelConfig, value: string | number) => {
    setEditingConfigs(prev => ({
      ...prev,
      [characterId]: {
        ...getCharacterConfig(characters.find(c => c.id === characterId)!),
        [field]: value,
      }
    }));
  };

  const saveConfig = (characterId: string) => {
    const config = editingConfigs[characterId];
    if (config) {
      onUpdateCharacterConfig(characterId, config);
      setEditingConfigs(prev => {
        const newConfigs = { ...prev };
        delete newConfigs[characterId];
        return newConfigs;
      });
    }
  };

  const resetConfig = (characterId: string) => {
    setEditingConfigs(prev => {
      const newConfigs = { ...prev };
      delete newConfigs[characterId];
      return newConfigs;
    });
  };

  const toggleAdvancedConfig = (characterId: string) => {
    setShowAdvancedConfigs(prev => ({
      ...prev,
      [characterId]: !prev[characterId]
    }));
  };

  return (
    <div 
      className={`bg-tavern-panel-bg border-l border-tavern-accent flex flex-col transition-all duration-300 ease-in-out overflow-hidden h-full ${
        isCollapsed ? 'w-12' : 'w-80'
      }`}
    >
      {/* 收缩状态 */}
      {isCollapsed && (
        <div className="flex flex-col items-center py-4 h-full">
          <Button
            onClick={() => setIsCollapsed(false)}
            variant="ghost"
            size="icon"
            className="text-tavern-accent hover:text-yellow-400 mb-2 transition-colors duration-200"
            aria-label="展开配置面板"
          >
            <ChevronLeft size={20} />
          </Button>
          <div 
            className="text-tavern-text text-xs opacity-70 mt-4 transform -rotate-90 whitespace-nowrap transition-opacity duration-300"
            style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
          >
            模型配置
          </div>
        </div>
      )}

      {/* 展开状态 */}
      {!isCollapsed && (
        <div className="p-4 h-full flex flex-col animate-in fade-in-0 duration-300">
          <div className="mb-4 flex items-center justify-between flex-shrink-0">
            <div className="transition-opacity duration-300">
              <h3 className="text-lg font-semibold text-tavern-accent mb-2">模型配置管理</h3>
              <p className="text-sm text-tavern-text opacity-70">为每个角色单独配置AI模型参数</p>
            </div>
            <Button
              onClick={() => setIsCollapsed(true)}
              variant="ghost"
              size="icon"
              className="text-tavern-accent hover:text-yellow-400 transition-colors duration-200"
              aria-label="收起配置面板"
            >
              <ChevronRight size={20} />
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-4">
            {/* 多AI响应配置面板 */}
            {multiResponseConfig && onMultiResponseConfigChange && (
              <div className="transition-all duration-300">
                <MultiResponseConfigPanel
                  config={multiResponseConfig}
                  onConfigChange={onMultiResponseConfigChange}
                  characters={characters}
                />
              </div>
            )}
            
            {/* 角色配置 */}
            <div>
              <h4 className="text-sm font-semibold text-tavern-accent mb-2">角色模型配置</h4>
              <Accordion type="single" collapsible className="space-y-2">
                {characters.map((character) => {
                const config = getCharacterConfig(character);
                const isEditing = editingConfigs[character.id];
                const showAdvanced = showAdvancedConfigs[character.id];
                
                return (
                  <AccordionItem key={character.id} value={character.id} className="border border-tavern-accent/30 rounded-lg transition-all duration-200 hover:border-tavern-accent/50">
                    <AccordionTrigger className="px-3 py-2 hover:no-underline transition-colors duration-200">
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full ${character.avatarColor} transition-transform duration-200 hover:scale-110`}></div>
                        <span className="text-tavern-text font-medium">{character.name}</span>
                        {isEditing && <span className="text-xs text-yellow-500 animate-pulse">●</span>}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-3 pb-3">
                      <div className="space-y-3 pt-2">
                        {/* 基础配置 */}
                        <div className="transition-all duration-200">
                          <Label className="text-xs text-tavern-text">Base URL</Label>
                          <Input
                            value={config.baseUrl || ''}
                            onChange={(e) => updateEditingConfig(character.id, 'baseUrl', e.target.value)}
                            className="mt-1 bg-tavern-bg border-tavern-text text-xs h-8 transition-all duration-200 focus:scale-[1.02]"
                            placeholder="API Base URL"
                          />
                        </div>
                        
                        <div className="transition-all duration-200">
                          <Label className="text-xs text-tavern-text">API Key</Label>
                          <Input
                            type="password"
                            value={config.apiKey || ''}
                            onChange={(e) => updateEditingConfig(character.id, 'apiKey', e.target.value)}
                            className="mt-1 bg-tavern-bg border-tavern-text text-xs h-8 transition-all duration-200 focus:scale-[1.02]"
                            placeholder="API密钥"
                          />
                        </div>
                        
                        <div className="transition-all duration-200">
                          <Label className="text-xs text-tavern-text">Model Name</Label>
                          <Input
                            value={config.modelName || ''}
                            onChange={(e) => updateEditingConfig(character.id, 'modelName', e.target.value)}
                            className="mt-1 bg-tavern-bg border-tavern-text text-xs h-8 transition-all duration-200 focus:scale-[1.02]"
                            placeholder="模型名称"
                          />
                        </div>

                        {/* 高级配置按钮 */}
                        <div className="flex items-center justify-between pt-2">
                          <Button
                            onClick={() => toggleAdvancedConfig(character.id)}
                            variant="ghost"
                            size="sm"
                            className="text-tavern-accent hover:text-yellow-400 text-xs h-6 px-2 transition-all duration-200 hover:scale-105"
                          >
                            <Settings size={12} className={`mr-1 transition-transform duration-300 ${showAdvanced ? 'rotate-180' : ''}`} />
                            {showAdvanced ? '收起高级配置' : '展开高级配置'}
                          </Button>
                        </div>

                        {/* 高级配置 */}
                        {showAdvanced && (
                          <div className="space-y-3 pt-2 border-t border-tavern-accent/20 animate-in slide-in-from-top-2 duration-300">
                              <div className="transition-all duration-200">
                                <Label className="text-xs text-tavern-text">温度系数 (Temperature)</Label>
                                <div className="mt-1 space-y-1">
                                  <Slider
                                    value={[config.temperature || 0.7]}
                                    onValueChange={(value) => updateEditingConfig(character.id, 'temperature', value[0])}
                                    max={2}
                                    min={0}
                                    step={0.1}
                                    className="w-full transition-all duration-200"
                                  />
                                  <div className="flex justify-between text-xs text-tavern-text opacity-60">
                                    <span>0</span>
                                    <span className="transition-all duration-200 font-medium">{config.temperature?.toFixed(1) || '0.7'}</span>
                                    <span>2</span>
                                  </div>
                                </div>
                              </div>

                              <div className="transition-all duration-200">
                                <Label className="text-xs text-tavern-text">最大Token数 (Max Tokens)</Label>
                                <Input
                                  type="number"
                                  value={config.maxTokens || 2048}
                                  onChange={(e) => updateEditingConfig(character.id, 'maxTokens', parseInt(e.target.value) || 2048)}
                                  className="mt-1 bg-tavern-bg border-tavern-text text-xs h-8 transition-all duration-200 focus:scale-[1.02]"
                                  placeholder="2048"
                                  min="1"
                                  max="8192"
                                />
                              </div>

                              <div className="transition-all duration-200">
                                <Label className="text-xs text-tavern-text">Top P</Label>
                                <div className="mt-1 space-y-1">
                                  <Slider
                                    value={[config.topP || 1.0]}
                                    onValueChange={(value) => updateEditingConfig(character.id, 'topP', value[0])}
                                    max={1}
                                    min={0}
                                    step={0.1}
                                    className="w-full transition-all duration-200"
                                  />
                                  <div className="flex justify-between text-xs text-tavern-text opacity-60">
                                    <span>0</span>
                                    <span className="transition-all duration-200 font-medium">{config.topP?.toFixed(1) || '1.0'}</span>
                                    <span>1</span>
                                  </div>
                                </div>
                              </div>

                              <div className="transition-all duration-200">
                                <Label className="text-xs text-tavern-text">频率惩罚 (Frequency Penalty)</Label>
                                <div className="mt-1 space-y-1">
                                  <Slider
                                    value={[config.frequencyPenalty || 0.0]}
                                    onValueChange={(value) => updateEditingConfig(character.id, 'frequencyPenalty', value[0])}
                                    max={2}
                                    min={-2}
                                    step={0.1}
                                    className="w-full transition-all duration-200"
                                  />
                                  <div className="flex justify-between text-xs text-tavern-text opacity-60">
                                    <span>-2</span>
                                    <span className="transition-all duration-200 font-medium">{config.frequencyPenalty?.toFixed(1) || '0.0'}</span>
                                    <span>2</span>
                                  </div>
                                </div>
                              </div>

                              <div className="transition-all duration-200">
                                <Label className="text-xs text-tavern-text">存在惩罚 (Presence Penalty)</Label>
                                <div className="mt-1 space-y-1">
                                  <Slider
                                    value={[config.presencePenalty || 0.0]}
                                    onValueChange={(value) => updateEditingConfig(character.id, 'presencePenalty', value[0])}
                                    max={2}
                                    min={-2}
                                    step={0.1}
                                    className="w-full transition-all duration-200"
                                  />
                                  <div className="flex justify-between text-xs text-tavern-text opacity-60">
                                    <span>-2</span>
                                    <span className="transition-all duration-200 font-medium">{config.presencePenalty?.toFixed(1) || '0.0'}</span>
                                    <span>2</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                        )}
                        
                        {isEditing && (
                          <div className="flex gap-2 pt-2 animate-in slide-in-from-bottom-2 duration-300">
                            <Button
                              onClick={() => saveConfig(character.id)}
                              className="bg-tavern-accent hover:bg-tavern-accent/80 text-white text-xs h-7 px-2 flex-1 transition-all duration-200 hover:scale-105"
                            >
                              保存
                            </Button>
                            <Button
                              onClick={() => resetConfig(character.id)}
                              variant="outline"
                              className="text-tavern-text border-tavern-accent hover:bg-tavern-accent/20 text-xs h-7 px-2 flex-1 transition-all duration-200 hover:scale-105"
                            >
                              重置
                            </Button>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
              </Accordion>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelConfigPanel; 