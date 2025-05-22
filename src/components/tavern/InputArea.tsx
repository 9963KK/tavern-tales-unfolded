
import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button'; // Using shadcn button
import { Input } from '@/components/ui/input'; // Using shadcn input

interface InputAreaProps {
  onSendMessage: (message: string) => void;
  isAIThinking: boolean;
}

const InputArea: React.FC<InputAreaProps> = ({ onSendMessage, isAIThinking }) => {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isAIThinking) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-tavern-panel-bg flex items-center gap-2 rounded-b-lg shadow-md mt-auto">
      <Input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="Say something..."
        className="flex-grow bg-tavern-bg text-tavern-text border-tavern-accent focus:ring-tavern-accent placeholder-gray-500"
        disabled={isAIThinking}
      />
      <Button 
        type="submit" 
        className="bg-tavern-accent hover:bg-yellow-600 text-tavern-bg font-semibold"
        disabled={isAIThinking || !inputValue.trim()}
      >
        <Send size={18} className="mr-2" /> Send
      </Button>
    </form>
  );
};

export default InputArea;
