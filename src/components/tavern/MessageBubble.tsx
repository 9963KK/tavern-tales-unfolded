import React from 'react';
import { Message } from '@/types/tavern';
import { User, AtSign } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const alignment = message.isPlayer ? 'justify-end' : 'justify-start';
  const bgColor = message.isPlayer ? 'bg-player-message-bg' : 'bg-ai-message-bg';
  const textColor = message.isPlayer ? 'text-white' : 'text-tavern-text';

  // 处理@提及高亮的文本渲染
  const renderTextWithMentions = (text: string, mentionedCharacters?: string[]) => {
    if (!mentionedCharacters || mentionedCharacters.length === 0) {
      return <span>{text}</span>;
    }

    // 创建正则表达式来匹配@提及
    const mentionRegex = /@([^@\s,，。！？；：\n]+)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      // 添加@符号前的文本
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      // 检查是否是有效的@提及
      const mentionedName = match[1];
      const isValidMention = mentionedCharacters.some(name => 
        name === mentionedName || 
        name.includes(mentionedName) || 
        mentionedName.includes(name.replace(/^(酒保|吟游诗人|神秘的)/, ''))
      );

      if (isValidMention) {
        // 高亮显示有效的@提及
        parts.push(
          <span 
            key={match.index}
            className="bg-blue-500/30 text-blue-200 px-1 rounded font-medium"
          >
            @{mentionedName}
          </span>
        );
      } else {
        // 普通文本显示无效的@提及
        parts.push(`@${mentionedName}`);
      }

      lastIndex = match.index + match[0].length;
    }

    // 添加剩余的文本
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return <span>{parts}</span>;
  };

  return (
    <div className={`flex ${alignment} mb-3`}>
      <div className={`max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-lg shadow ${bgColor} ${textColor} relative`}>
        {/* @提及指示器 */}
        {message.mentionedCharacters && message.mentionedCharacters.length > 0 && (
          <div className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full p-1">
            <AtSign size={12} />
          </div>
        )}
        
        {!message.isPlayer && (
          <div className="flex items-center mb-1">
            <div className={`w-5 h-5 rounded-full ${message.avatarColor} mr-2 flex items-center justify-center`}>
              <User size={14} className="text-white opacity-70" />
            </div>
            <p className="text-xs font-semibold text-tavern-accent">{message.sender}</p>
          </div>
        )}
        
        {/* 玩家消息显示发送者 */}
        {message.isPlayer && (
          <div className="flex items-center justify-end mb-1">
            <p className="text-xs font-semibold text-blue-200">{message.sender}</p>
            <div className="w-5 h-5 rounded-full bg-blue-600 ml-2 flex items-center justify-center">
              <User size={14} className="text-white" />
            </div>
          </div>
        )}
        
        {/* 消息内容 */}
        <p className="text-sm">
          {renderTextWithMentions(message.text, message.mentionedCharacters)}
        </p>
        
        {/* @提及状态显示 */}
        {message.mentionedCharacters && message.mentionedCharacters.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-500/30">
            <div className="flex items-center gap-1 text-xs text-blue-300">
              <AtSign size={10} />
              <span>提及了: {message.mentionedCharacters.join(', ')}</span>
            </div>
          </div>
        )}
        
        <p className="text-xs text-gray-400 mt-1 text-right">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
};

export default MessageBubble;
