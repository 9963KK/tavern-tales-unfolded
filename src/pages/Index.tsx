
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
  const [speakerHistory, setSpeakerHistory] = useState<string[]>([]);

  const sceneDescription = "你发现自己身处于光线昏暗的"游荡翼龙"酒馆。空气中弥漫着陈年麦酒和木柴烟熏的气味。低语交谈声和酒杯碰撞声充满了整个房间。";

  const addMessage = useCallback((text: string, sender: string, isPlayer: boolean, avatarColor?: string) => {
    const newMessage: Message = {
      id: uuidv4(),
      sender,
      text,
      isPlayer,
      timestamp: new Date(),
      avatarColor,
    };
    setMessages((prevMessages) => [...prevMessages, newMessage]);
  }, []);

  // Helper function to select next speaker to ensure variety
  const selectNextSpeaker = useCallback((currentIndex: number) => {
    // If we've gone through all characters once, reset the history
    if (speakerHistory.length >= aiCharacters.length - 1) {
      setSpeakerHistory([]);
      return currentIndex % aiCharacters.length;
    }
    
    // Try to find a character that hasn't spoken recently
    for (let i = 0; i < aiCharacters.length; i++) {
      const nextIndex = (currentIndex + i) % aiCharacters.length;
      if (!speakerHistory.includes(aiCharacters[nextIndex].id)) {
        return nextIndex;
      }
    }
    
    // Fallback to simple increment if all have spoken
    return (currentIndex + 1) % aiCharacters.length;
  }, [aiCharacters, speakerHistory]);

  const startAutoConversation = useCallback(() => {
    if (!isAutoConversationActive || thinkingCharacterId) return; // Do not start if not active or someone is thinking
    
    const timer = setTimeout(() => {
      // Double check thinkingCharacterId again inside timeout, in case player spoke.
      if (!isAutoConversationActive || thinkingCharacterId) return; 

      // Select next speaker to ensure variety
      const nextAIIndex = selectNextSpeaker(currentTurnAIIndex);
      const nextAI = aiCharacters[nextAIIndex];
      setThinkingCharacterId(nextAI.id);
      
      setTimeout(() => {
        // Check again before sending message
        if (!isAutoConversationActive) {
          setThinkingCharacterId(null); // Clear thinking if auto conversation was stopped
          return;
        }
        const aiResponseText = nextAI.responses[Math.floor(Math.random() * nextAI.responses.length)];
        addMessage(aiResponseText, nextAI.name, false, nextAI.avatarColor);
        setActiveSpeakerId(nextAI.id);
        setThinkingCharacterId(null);
        
        // Update speaker history
        setSpeakerHistory(prev => [...prev, nextAI.id]);
        
        // Update to next speaker
        setCurrentTurnAIIndex(nextAIIndex);
        
        // Schedule next autonomous message
        startAutoConversation();
      }, 1500 + Math.random() * 1000); // Thinking time
    }, 4000 + Math.random() * 6000); // Random delay between 4 and 10 seconds
    
    setAutoConversationTimer(timer);
  }, [
    aiCharacters, 
    currentTurnAIIndex, 
    thinkingCharacterId, 
    isAutoConversationActive, 
    addMessage, 
    selectNextSpeaker,
  ]);


  // Initial greeting from the first AI character
  useEffect(() => {
    if (aiCharacters.length > 0 && messages.length === 0) {
      const firstAI = aiCharacters[0];
      setThinkingCharacterId(firstAI.id);
      setTimeout(() => {
        addMessage(firstAI.greeting, firstAI.name, false, firstAI.avatarColor);
        setActiveSpeakerId(firstAI.id);
        setThinkingCharacterId(null);
        setSpeakerHistory([firstAI.id]); // Initialize speaker history
        setCurrentTurnAIIndex(1 % aiCharacters.length); // Next AI for autonomous conversation
        if (isAutoConversationActive) { // Check before starting
          startAutoConversation();
        }
      }, 1500);
    }
  }, [aiCharacters, messages.length, addMessage, startAutoConversation, isAutoConversationActive]);

  // Cleanup timer on component unmount
  useEffect(() => {
    return () => {
      if (autoConversationTimer) {
        clearTimeout(autoConversationTimer);
      }
    };
  }, [autoConversationTimer]);
  
  const handlePlayerMessage = useCallback((text: string) => {
    if (autoConversationTimer) {
      clearTimeout(autoConversationTimer);
      setAutoConversationTimer(null);
    }
    setIsAutoConversationActive(false); // Pause auto conversation
    // If an AI was thinking, interrupt it
    if (thinkingCharacterId) {
        setThinkingCharacterId(null);
    }
    
    addMessage(text, '玩家', true);
    setActiveSpeakerId(null); 

    // For player responses, always select the next character in sequence
    const respondingAIIndex = currentTurnAIIndex % aiCharacters.length;
    const respondingAI = aiCharacters[respondingAIIndex];
    setThinkingCharacterId(respondingAI.id);

    setTimeout(() => {
      const aiResponseText = respondingAI.responses[Math.floor(Math.random() * respondingAI.responses.length)];
      addMessage(aiResponseText, respondingAI.name, false, respondingAI.avatarColor);
      setActiveSpeakerId(respondingAI.id);
      setThinkingCharacterId(null);
      
      // Update speaker history
      setSpeakerHistory(prev => [...prev, respondingAI.id]);
      
      // Next AI in sequence will speak either in response or autonomously next.
      setCurrentTurnAIIndex((respondingAIIndex + 1) % aiCharacters.length); 
      
      // Resume auto conversation after AI responds to player
      setTimeout(() => {
        setIsAutoConversationActive(true);
        startAutoConversation();
      }, 3000 + Math.random() * 2000); // Delay before resuming auto-chat
    }, 1500 + Math.random() * 1000);
  }, [
    autoConversationTimer, 
    addMessage, 
    aiCharacters, 
    currentTurnAIIndex, 
    startAutoConversation,
    thinkingCharacterId,
  ]);

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
          isAIThinking={!!thinkingCharacterId && !messages.some(m => m.isPlayer && m.id === thinkingCharacterId)} // AI is thinking if thinkingCharacterId is set (unless it's a player message ID, which is not the case here)
        />
      </div>
    </div>
  );
};

export default Index;
