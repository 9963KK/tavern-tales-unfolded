
import React, { useState, useEffect, useCallback } from 'react';
import SceneHeader from '@/components/tavern/SceneHeader';
import ChatWindow from '@/components/tavern/ChatWindow';
import AvatarBar from '@/components/tavern/AvatarBar';
import InputArea from '@/components/tavern/InputArea';
import { Message, AICharacter } from '@/types/tavern';
import { initialAICharacters } from '@/data/aiCharacters';
import { v4 as uuidv4 } from 'uuid';

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [aiCharacters] = useState<AICharacter[]>(initialAICharacters);
  const [activeSpeakerId, setActiveSpeakerId] = useState<string | null>(null);
  const [thinkingCharacterId, setThinkingCharacterId] = useState<string | null>(null);
  const [currentTurnAIIndex, setCurrentTurnAIIndex] = useState(0);
  const [autoConversationTimer, setAutoConversationTimer] = useState<NodeJS.Timeout | null>(null);
  const [isAutoConversationActive, setIsAutoConversationActive] = useState<boolean>(true);

  const sceneDescription = "你发现自己身处于光线昏暗的"游荡翼龙"酒馆。空气中弥漫着陈年麦酒和木柴烟熏的气味。低语交谈声和酒杯碰撞声充满了整个房间。";

  // Initial greeting from the first AI character
  useEffect(() => {
    if (aiCharacters.length > 0 && messages.length === 0) {
      const firstAI = aiCharacters[0];
      setThinkingCharacterId(firstAI.id);
      setTimeout(() => {
        setMessages([{
          id: uuidv4(),
          sender: firstAI.name,
          text: firstAI.greeting,
          isPlayer: false,
          timestamp: new Date(),
          avatarColor: firstAI.avatarColor,
        }]);
        setActiveSpeakerId(firstAI.id);
        setThinkingCharacterId(null);
        setCurrentTurnAIIndex(1); // Start with the second AI for autonomous conversation
        startAutoConversation();
      }, 1500);
    }
  }, [aiCharacters, messages.length]);

  // Cleanup timer on component unmount
  useEffect(() => {
    return () => {
      if (autoConversationTimer) {
        clearTimeout(autoConversationTimer);
      }
    };
  }, [autoConversationTimer]);
  
  const addMessage = (text: string, sender: string, isPlayer: boolean, avatarColor?: string) => {
    const newMessage: Message = {
      id: uuidv4(),
      sender,
      text,
      isPlayer,
      timestamp: new Date(),
      avatarColor,
    };
    setMessages((prevMessages) => [...prevMessages, newMessage]);
  };

  const handlePlayerMessage = (text: string) => {
    // Stop auto conversation when player speaks
    if (autoConversationTimer) {
      clearTimeout(autoConversationTimer);
      setAutoConversationTimer(null);
    }
    setIsAutoConversationActive(false);
    
    addMessage(text, '玩家', true);
    setActiveSpeakerId(null); // Player speaks, no AI is "active speaker" for this message

    // Simulate AI response to player
    const respondingAI = aiCharacters[currentTurnAIIndex % aiCharacters.length];
    setThinkingCharacterId(respondingAI.id);

    setTimeout(() => {
      const aiResponseText = respondingAI.responses[Math.floor(Math.random() * respondingAI.responses.length)];
      addMessage(aiResponseText, respondingAI.name, false, respondingAI.avatarColor);
      setActiveSpeakerId(respondingAI.id);
      setThinkingCharacterId(null);
      setCurrentTurnAIIndex(prevIndex => prevIndex + 1); // Next AI takes a turn
      
      // Resume auto conversation after AI responds to player
      setTimeout(() => {
        setIsAutoConversationActive(true);
        startAutoConversation();
      }, 3000 + Math.random() * 2000);
    }, 1500 + Math.random() * 1000);
  };

  const startAutoConversation = useCallback(() => {
    if (!isAutoConversationActive) return;
    
    const timer = setTimeout(() => {
      if (thinkingCharacterId) return; // If someone is already "thinking", wait
      
      const nextAI = aiCharacters[currentTurnAIIndex % aiCharacters.length];
      setThinkingCharacterId(nextAI.id);
      
      setTimeout(() => {
        const aiResponseText = nextAI.responses[Math.floor(Math.random() * nextAI.responses.length)];
        addMessage(aiResponseText, nextAI.name, false, nextAI.avatarColor);
        setActiveSpeakerId(nextAI.id);
        setThinkingCharacterId(null);
        setCurrentTurnAIIndex(prevIndex => prevIndex + 1);
        
        // Schedule next autonomous message
        startAutoConversation();
      }, 1500 + Math.random() * 1000);
    }, 4000 + Math.random() * 6000); // Random delay between 4 and 10 seconds for more natural conversation
    
    setAutoConversationTimer(timer);
  }, [aiCharacters, currentTurnAIIndex, thinkingCharacterId, isAutoConversationActive]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-tavern-bg text-tavern-text">
      <div className="w-full max-w-2xl lg:max-w-3xl bg-tavern-panel-bg rounded-lg shadow-xl flex flex-col h-[90vh]">
        <SceneHeader description={sceneDescription} />
        <ChatWindow messages={messages} />
        <AvatarBar 
          characters={aiCharacters} 
          activeSpeakerId={activeSpeakerId}
          thinkingCharacterId={thinkingCharacterId}
        />
        <InputArea 
          onSendMessage={handlePlayerMessage} 
          isAIThinking={!!thinkingCharacterId} 
        />
      </div>
    </div>
  );
};

export default Index;
