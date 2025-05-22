
import React, { useRef, useEffect } from 'react';
import { Message } from '@/types/tavern';
import MessageBubble from './MessageBubble';

interface ChatWindowProps {
  messages: Message[];
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages }) => {
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-grow bg-tavern-bg p-4 overflow-y-auto h-96 border border-tavern-panel-bg rounded-md shadow-inner">
      {messages.length === 0 && (
        <p className="text-center text-tavern-text opacity-70">酒馆里很安静……暂时是这样。</p>
      )}
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
      <div ref={chatEndRef} />
    </div>
  );
};

export default ChatWindow;

