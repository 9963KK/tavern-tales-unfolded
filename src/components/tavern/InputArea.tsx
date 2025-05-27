import React, { useState, useRef, useEffect } from 'react';
import { Send, AtSign, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AICharacter } from '@/types/tavern';
import { parseMentions, generateMentionHints, MentionParseResult } from '@/lib/mentionParser';

interface InputAreaProps {
  onSendMessage: (message: string, mentionResult?: MentionParseResult) => void;
  isAIThinking: boolean;
  availableCharacters: AICharacter[];
}

const InputArea: React.FC<InputAreaProps> = ({ onSendMessage, isAIThinking, availableCharacters }) => {
  const [inputValue, setInputValue] = useState('');
  const [showMentionHints, setShowMentionHints] = useState(false);
  const [selectedCharacterIndex, setSelectedCharacterIndex] = useState(0); // 当前选中的角色索引
  const inputRef = useRef<HTMLInputElement>(null);

  // 监听输入变化，检测@提及
  useEffect(() => {
    if (inputValue.includes('@')) {
      // 如果正在输入@，显示提示
      if (inputValue.endsWith('@') || /[@][^@\s]*$/.test(inputValue)) {
        setShowMentionHints(true);
        setSelectedCharacterIndex(0); // 重置选中索引
      } else {
        setShowMentionHints(false);
      }
    } else {
      setShowMentionHints(false);
    }
  }, [inputValue, availableCharacters]);

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showMentionHints && availableCharacters.length > 0) {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setSelectedCharacterIndex(prev => 
          prev > 0 ? prev - 1 : availableCharacters.length - 1
        );
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setSelectedCharacterIndex(prev => 
          prev < availableCharacters.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        // 如果在@模式下按回车，插入选中的角色
        if (showMentionHints) {
          insertMention(availableCharacters[selectedCharacterIndex].name);
        } else {
          // 否则提交表单
          handleSubmit(e as any);
        }
      } else if (e.key === 'Escape') {
        // ESC键取消@模式
        setShowMentionHints(false);
        inputRef.current?.focus();
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isAIThinking) {
      const mentionResult = parseMentions(inputValue.trim(), availableCharacters);
      onSendMessage(inputValue.trim(), mentionResult);
      setInputValue('');
      setShowMentionHints(false);
      setSelectedCharacterIndex(0);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const insertMention = (characterName: string) => {
    const currentCursor = inputRef.current?.selectionStart || 0;
    const textBeforeCursor = inputValue.substring(0, currentCursor);
    const textAfterCursor = inputValue.substring(currentCursor);
    
    // 查找最后一个@符号的位置
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      // 替换从@开始到光标位置的文本
      const newValue = textBeforeCursor.substring(0, lastAtIndex) + `@${characterName} ` + textAfterCursor;
      setInputValue(newValue);
      setShowMentionHints(false);
      setSelectedCharacterIndex(0);
      
      // 设置光标位置到插入的mention之后
      setTimeout(() => {
        if (inputRef.current) {
          const newCursorPos = lastAtIndex + characterName.length + 2; // @角色名 
          inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
          inputRef.current.focus();
        }
      }, 0);
    }
  };

  const mentionHints = generateMentionHints(availableCharacters);

  return (
    <div className="relative">
      {/* @提及提示面板 */}
      {showMentionHints && mentionHints.length > 0 && (
        <div className="absolute bottom-full mb-2 left-4 right-4 bg-tavern-panel-bg border border-tavern-accent rounded-lg shadow-lg p-3 z-50">
          <div className="flex items-center gap-2 mb-2">
            <AtSign size={16} className="text-tavern-accent" />
            <span className="text-sm text-tavern-text font-medium">选择角色 (使用←→键导航，回车确认)：</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {mentionHints.map((hint, index) => (
              <button
                key={index}
                onClick={() => insertMention(availableCharacters[index].name)}
                className={`px-2 py-1 text-tavern-text rounded text-sm transition-all duration-200 border-2 ${
                  index === selectedCharacterIndex
                    ? 'bg-tavern-accent text-tavern-bg font-bold shadow-md border-yellow-400'
                    : 'bg-tavern-accent/20 hover:bg-tavern-accent/40 border-transparent'
                }`}
              >
                {hint}
              </button>
            ))}
          </div>
          <div className="mt-2 text-xs text-tavern-text/70">
            💡 提示：使用 ← → 键选择角色，回车确认，ESC 取消
          </div>
        </div>
      )}

      {/* 主输入区域 */}
    <form onSubmit={handleSubmit} className="p-4 bg-tavern-panel-bg flex items-center gap-2 rounded-b-lg shadow-md mt-auto">
        <div className="flex-grow relative">
      <Input
            ref={inputRef}
        type="text"
        value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="说点什么... (使用@提及特定角色)"
            className="bg-tavern-bg text-tavern-text border-tavern-accent focus:ring-tavern-accent placeholder-gray-500 pr-8"
        disabled={isAIThinking}
      />
          {inputValue.includes('@') && (
            <AtSign size={16} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-tavern-accent" />
          )}
        </div>
      <Button 
        type="submit" 
        className="bg-tavern-accent hover:bg-yellow-600 text-tavern-bg font-semibold"
        disabled={isAIThinking || !inputValue.trim()}
      >
        <Send size={18} className="mr-2" /> 发送
      </Button>
    </form>

      {/* 使用说明 */}
      <div className="px-4 py-2 text-xs text-tavern-text/80">
        💡 提示：输入 @ 后使用 ← → 键选择角色，回车确认，被@的角色会优先回应
      </div>
    </div>
  );
};

export default InputArea;

