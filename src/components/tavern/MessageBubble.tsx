
import React from 'react';
import { Message } from '@/types/tavern';
import { User } from 'lucide-react'; // Placeholder for AI icon

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const alignment = message.isPlayer ? 'justify-end' : 'justify-start';
  const bgColor = message.isPlayer ? 'bg-player-message-bg' : 'bg-ai-message-bg';
  const textColor = message.isPlayer ? 'text-white' : 'text-tavern-text';

  return (
    <div className={`flex ${alignment} mb-3`}>
      <div className={`max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-lg shadow ${bgColor} ${textColor}`}>
        {!message.isPlayer && (
          <div className="flex items-center mb-1">
            <div className={`w-5 h-5 rounded-full ${message.avatarColor} mr-2 flex items-center justify-center`}>
              <User size={14} className="text-white opacity-70" />
            </div>
            <p className="text-xs font-semibold text-tavern-accent">{message.sender}</p>
          </div>
        )}
        <p className="text-sm">{message.text}</p>
        <p className="text-xs text-gray-400 mt-1 text-right">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
};

export default MessageBubble;
