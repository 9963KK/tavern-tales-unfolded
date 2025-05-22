
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
  // currentTurnAIIndex: Index of the AI character that last took a turn (spoke or was involved in player interaction)
  const [currentTurnAIIndex, setCurrentTurnAIIndex] = useState<number>(0); 
  const [autoConversationTimer, setAutoConversationTimer] = useState<NodeJS.Timeout | null>(null);
  const [isAutoConversationActive, setIsAutoConversationActive] = useState<boolean>(true);
  // speakerHistory: Stores IDs of AI characters who have spoken in the current "round" or cycle.
  const [speakerHistory, setSpeakerHistory] = useState<string[]>([]);

  const sceneDescription = "你发现自己身处于光线昏暗的“游荡翼龙”酒馆。空气中弥漫着陈年麦酒和木柴烟熏的气味。低语交谈声和酒杯碰撞声充满了整个房间。";

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

  // Selects the index of the next AI character to speak.
  const selectNextSpeakerIndex = useCallback(() => {
    if (aiCharacters.length === 0) return 0;
    if (aiCharacters.length === 1) return 0;

    // Determine the starting point for searching for the next speaker.
    // This should be the AI after the one who last spoke.
    const searchStartIndex = (currentTurnAIIndex + 1) % aiCharacters.length;

    // If speakerHistory includes everyone, this means we are starting a new round.
    // The history used for selection logic will be empty in this case.
    const historyForSelection = speakerHistory.length >= aiCharacters.length ? [] : speakerHistory;

    for (let i = 0; i < aiCharacters.length; i++) {
      const potentialIndex = (searchStartIndex + i) % aiCharacters.length;
      if (!historyForSelection.includes(aiCharacters[potentialIndex].id)) {
        return potentialIndex;
      }
    }
    // Fallback: Should ideally not be reached if history logic is correct.
    // If all are in historyForSelection (e.g. single character), or some other edge case.
    return searchStartIndex;
  }, [aiCharacters, currentTurnAIIndex, speakerHistory]);

  const startAutoConversation = useCallback(() => {
    if (!isAutoConversationActive || thinkingCharacterId || aiCharacters.length === 0) return;

    const timer = setTimeout(() => {
      if (!isAutoConversationActive || thinkingCharacterId) return;

      const nextAIIndex = selectNextSpeakerIndex();
      const nextAI = aiCharacters[nextAIIndex];
      
      if (!nextAI) return; // Should not happen if aiCharacters is not empty

      setThinkingCharacterId(nextAI.id);

      setTimeout(() => {
        if (!isAutoConversationActive) {
          setThinkingCharacterId(null);
          return;
        }
        const aiResponseText = nextAI.responses[Math.floor(Math.random() * nextAI.responses.length)];
        addMessage(aiResponseText, nextAI.name, false, nextAI.avatarColor);
        setActiveSpeakerId(nextAI.id);
        setThinkingCharacterId(null);

        setSpeakerHistory(prev => {
          const isNewCycle = prev.length >= aiCharacters.length;
          return isNewCycle ? [nextAI.id] : [...new Set([...prev, nextAI.id])];
        });
        setCurrentTurnAIIndex(nextAIIndex); // This AI just spoke

        startAutoConversation(); // Schedule next
      }, 1500 + Math.random() * 1000); // Thinking time
    }, 4000 + Math.random() * 6000); // Delay

    setAutoConversationTimer(timer);
  }, [
    aiCharacters,
    isAutoConversationActive,
    thinkingCharacterId,
    addMessage,
    selectNextSpeakerIndex, // Changed from direct currentTurnAIIndex/speakerHistory
  ]);

  // Initial greeting
  useEffect(() => {
    if (aiCharacters.length > 0 && messages.length === 0) {
      const firstAI = aiCharacters[0];
      setThinkingCharacterId(firstAI.id);
      setTimeout(() => {
        addMessage(firstAI.greeting, firstAI.name, false, firstAI.avatarColor);
        setActiveSpeakerId(firstAI.id);
        setThinkingCharacterId(null);
        setSpeakerHistory([firstAI.id]); // First AI spoke
        setCurrentTurnAIIndex(0);         // Index of the AI that just spoke
        if (isAutoConversationActive) {
          startAutoConversation();
        }
      }, 1500);
    }
  }, [aiCharacters, messages.length, addMessage, startAutoConversation, isAutoConversationActive]);


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
    setIsAutoConversationActive(false);
    if (thinkingCharacterId) {
      setThinkingCharacterId(null);
    }

    addMessage(text, '玩家', true);
    setActiveSpeakerId(null);

    // AI responds. The AI to respond can be the one "next in line" based on currentTurnAIIndex.
    // Or, a more sophisticated logic could be used here.
    // For now, let's use a similar logic to auto-conversation for who responds,
    // effectively the next character in the sequence considering the last speaker.
    const respondingAIIndex = selectNextSpeakerIndex(); // This will use currentTurnAIIndex and speakerHistory
    const respondingAI = aiCharacters[respondingAIIndex];

    if (!respondingAI) return;

    setThinkingCharacterId(respondingAI.id);

    setTimeout(() => {
      const aiResponseText = respondingAI.responses[Math.floor(Math.random() * respondingAI.responses.length)];
      addMessage(aiResponseText, respondingAI.name, false, respondingAI.avatarColor);
      setActiveSpeakerId(respondingAI.id);
      setThinkingCharacterId(null);

      setSpeakerHistory(prev => {
        const isNewCycle = prev.length >= aiCharacters.length;
        return isNewCycle ? [respondingAI.id] : [...new Set([...prev, respondingAI.id])];
      });
      setCurrentTurnAIIndex(respondingAIIndex); // This AI just spoke

      setTimeout(() => {
        setIsAutoConversationActive(true);
        startAutoConversation();
      }, 3000 + Math.random() * 2000);
    }, 1500 + Math.random() * 1000);
  }, [
    autoConversationTimer,
    addMessage,
    aiCharacters,
    startAutoConversation,
    thinkingCharacterId,
    selectNextSpeakerIndex, // Added
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
          isAIThinking={!!thinkingCharacterId}
        />
      </div>
    </div>
  );
};

export default Index;
