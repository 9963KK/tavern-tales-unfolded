import React, { useState, useEffect, useCallback } from 'react';
import SceneHeader from '@/components/tavern/SceneHeader';
import ChatWindow from '@/components/tavern/ChatWindow';
import AvatarBar from '@/components/tavern/AvatarBar';
import InputArea from '@/components/tavern/InputArea';
import CharacterConfigDialog from '@/components/tavern/CharacterConfigDialog'; // Import the new dialog
import { Message, AICharacter, ModelConfig } from '@/types/tavern'; // Import ModelConfig
import { initialAICharacters } from '@/data/aiCharacters';
import { v4 as uuidv4 } from 'uuid';

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [aiCharacters, setAiCharacters] = useState<AICharacter[]>(initialAICharacters); // Make it updatable
  const [activeSpeakerId, setActiveSpeakerId] = useState<string | null>(null);
  const [thinkingCharacterId, setThinkingCharacterId] = useState<string | null>(null);
  const [currentTurnAIIndex, setCurrentTurnAIIndex] = useState<number>(0); 
  const [autoConversationTimer, setAutoConversationTimer] = useState<NodeJS.Timeout | null>(null);
  const [isAutoConversationActive, setIsAutoConversationActive] = useState<boolean>(true);
  const [speakerHistory, setSpeakerHistory] = useState<string[]>([]);

  // State for config dialog
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState<boolean>(false);
  const [configuringCharacter, setConfiguringCharacter] = useState<AICharacter | null>(null);

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

  const selectNextSpeakerIndex = useCallback(() => {
    if (aiCharacters.length === 0) return 0;
    if (aiCharacters.length === 1) return currentTurnAIIndex; // If only one, it's always their turn

    let lastSpeakerId = "";
    if (speakerHistory.length > 0) {
      lastSpeakerId = speakerHistory[speakerHistory.length - 1];
    }
    
    let lastSpeakerIndexInCurrentArray = currentTurnAIIndex; // Default to currentTurnAIIndex
    if(lastSpeakerId) {
        const idx = aiCharacters.findIndex(c => c.id === lastSpeakerId);
        if(idx !== -1) lastSpeakerIndexInCurrentArray = idx;
    }

    // If all characters have spoken in the current cycle, clear history to start a new cycle
    const currentCycleSpeakerIds = new Set(speakerHistory);
    if (currentCycleSpeakerIds.size >= aiCharacters.length) {
      // If next speaker logic is based on cleared history, this needs to be handled
      // For now, let's assume if history is full, we can pick anyone not the last one.
      // Or, more simply, we just ensure we pick the one after lastSpeakerIndexInCurrentArray.
      // The speakerHistory update logic itself handles the "new cycle" concept.
    }
    
    const availableCharacters = aiCharacters.filter(char => !speakerHistory.includes(char.id) || speakerHistory.length >= aiCharacters.length);

    if (availableCharacters.length > 0) {
      // Prefer someone who hasn't spoken yet in this cycle
      // Find the first available character after the last speaker
      for (let i = 0; i < aiCharacters.length; i++) {
        const potentialIndex = (lastSpeakerIndexInCurrentArray + 1 + i) % aiCharacters.length;
        const potentialChar = aiCharacters[potentialIndex];
        if (!speakerHistory.includes(potentialChar.id) || speakerHistory.length >= aiCharacters.length) {
           // if history is full, anyone can speak again.
           // if not full, only pick someone not in history.
          return potentialIndex;
        }
      }
      // Fallback: if logic above fails (e.g. history logic is complex) pick first available from a fresh start
      return aiCharacters.findIndex(c => c.id === availableCharacters[0].id);
    } else {
      // Everyone has spoken, start a new cycle. The actual 'next' will be handled by history clearing.
      // The immediate next should be the one after the last speaker.
      return (lastSpeakerIndexInCurrentArray + 1) % aiCharacters.length;
    }

  }, [aiCharacters, speakerHistory, currentTurnAIIndex]);
  
  const startAutoConversation = useCallback(() => {
    if (!isAutoConversationActive || thinkingCharacterId || aiCharacters.length === 0) return;

    const timer = setTimeout(() => {
      if (!isAutoConversationActive || thinkingCharacterId) { // Re-check before proceeding
        if(autoConversationTimer) clearTimeout(autoConversationTimer); // Clear if was set
        setAutoConversationTimer(null);
        if(thinkingCharacterId) setThinkingCharacterId(null); // Clear thinking state if conversation stopped
        return;
      }
      
      const nextAIIndex = selectNextSpeakerIndex();
      const nextAI = aiCharacters[nextAIIndex];
      
      if (!nextAI) { // Should ideally not happen if aiCharacters is not empty
        if(autoConversationTimer) clearTimeout(autoConversationTimer);
        setAutoConversationTimer(null);
        startAutoConversation(); // Attempt to restart to recover, or log error
        return;
      }

      setThinkingCharacterId(nextAI.id);

      setTimeout(() => {
        if (!isAutoConversationActive) { // Re-check, player might have interjected
          setThinkingCharacterId(null);
          // Do not schedule next if auto convo is off
          return;
        }
        // Simulate API call or use modelConfig if available
        const aiResponseText = nextAI.responses[Math.floor(Math.random() * nextAI.responses.length)];
        console.log(`${nextAI.name} (ID: ${nextAI.id}, Index: ${nextAIIndex}) is speaking. Config:`, nextAI.modelConfig);
        addMessage(aiResponseText, nextAI.name, false, nextAI.avatarColor);
        setActiveSpeakerId(nextAI.id);
        setThinkingCharacterId(null);
        
        setCurrentTurnAIIndex(nextAIIndex); // This AI just spoke

        setSpeakerHistory(prev => {
          const newHistory = [...prev, nextAI.id];
          // If all characters have spoken, clear history for a new round, but keep the current speaker as the start of new history
          if (new Set(newHistory).size >= aiCharacters.length) {
            return [nextAI.id];
          }
          return [...new Set(newHistory)]; // Keep unique, in order
        });

        startAutoConversation(); // Schedule next
      }, 1500 + Math.random() * 1000); // Thinking time
    }, 4000 + Math.random() * 6000); // Delay

    setAutoConversationTimer(timer);
  }, [
    aiCharacters,
    isAutoConversationActive,
    thinkingCharacterId,
    addMessage,
    selectNextSpeakerIndex,
    autoConversationTimer, // Added to deps to ensure clearTimeout has the correct timer instance
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
  // eslint-disable-next-line react-hooks/exhaustive-deps 
  }, [aiCharacters, messages.length, addMessage, isAutoConversationActive]); // Removed startAutoConversation from here to avoid loop with its own timer logic. Initial call is fine.


  useEffect(() => {
    // Start conversation if active and not already started by greeting
    if (isAutoConversationActive && messages.length > 0 && !autoConversationTimer && !thinkingCharacterId) {
        console.log("Effect: Kicking off auto-conversation post-greeting or on resume.");
        startAutoConversation();
    }

    return () => {
      if (autoConversationTimer) {
        clearTimeout(autoConversationTimer);
        setAutoConversationTimer(null); // Ensure timer ID is cleared on unmount/change
      }
    };
  }, [autoConversationTimer, isAutoConversationActive, messages.length, thinkingCharacterId, startAutoConversation]);


  const handlePlayerMessage = useCallback((text: string) => {
    if (autoConversationTimer) {
      clearTimeout(autoConversationTimer);
      setAutoConversationTimer(null);
    }
    setIsAutoConversationActive(false); // Pause auto-conversation
    if (thinkingCharacterId) { // If an AI was about to speak, cancel it
      setThinkingCharacterId(null); 
    }

    addMessage(text, '玩家', true);
    setActiveSpeakerId(null); // Player is speaking

    const respondingAIIndex = selectNextSpeakerIndex();
    const respondingAI = aiCharacters[respondingAIIndex];

    if (!respondingAI) return; // Should not happen

    setThinkingCharacterId(respondingAI.id);

    setTimeout(() => {
      // Simulate API call or use modelConfig if available
      const aiResponseText = respondingAI.responses[Math.floor(Math.random() * respondingAI.responses.length)];
      console.log(`${respondingAI.name} (ID: ${respondingAI.id}, Index: ${respondingAIIndex}) is responding to player. Config:`, respondingAI.modelConfig);
      addMessage(aiResponseText, respondingAI.name, false, respondingAI.avatarColor);
      setActiveSpeakerId(respondingAI.id);
      setThinkingCharacterId(null);
      
      setCurrentTurnAIIndex(respondingAIIndex); // This AI just spoke

      setSpeakerHistory(prev => { // Update speaker history after AI responds
        const newHistory = [...prev, respondingAI.id];
        if (new Set(newHistory).size >= aiCharacters.length) {
          return [respondingAI.id]; // Start new cycle with current speaker
        }
        return [...new Set(newHistory)];
      });
      
      // Delay before restarting auto-conversation
      setTimeout(() => {
        console.log("Player interaction done, restarting auto-conversation.");
        setIsAutoConversationActive(true);
        // startAutoConversation() will be picked up by the useEffect dependency change on isAutoConversationActive or manually called
        // No, better to call it explicitly to ensure it restarts.
        startAutoConversation(); 
      }, 3000 + Math.random() * 2000);

    }, 1500 + Math.random() * 1000);
  }, [
    autoConversationTimer,
    addMessage,
    aiCharacters,
    startAutoConversation,
    thinkingCharacterId,
    selectNextSpeakerIndex,
  ]);


  const handleOpenConfigDialog = (characterId: string) => {
    const charToConfig = aiCharacters.find(char => char.id === characterId);
    if (charToConfig) {
      setConfiguringCharacter(charToConfig);
      setIsConfigDialogOpen(true);
    }
  };

  const handleCloseConfigDialog = () => {
    setIsConfigDialogOpen(false);
    setConfiguringCharacter(null);
  };

  const handleSaveConfig = (characterId: string, config: ModelConfig) => {
    setAiCharacters(prevChars =>
      prevChars.map(char =>
        char.id === characterId ? { ...char, modelConfig: config } : char
      )
    );
    handleCloseConfigDialog();
    // Potentially use a toast to confirm save
    console.log(`Configuration saved for ${characterId}:`, config);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-tavern-bg text-tavern-text">
      <div className="w-full max-w-2xl lg:max-w-3xl bg-tavern-panel-bg rounded-lg shadow-xl flex flex-col h-[90vh]">
        <SceneHeader description={sceneDescription} />
        <ChatWindow messages={messages} />
        <AvatarBar
          characters={aiCharacters}
          activeSpeakerId={activeSpeakerId}
          thinkingCharacterId={thinkingCharacterId}
          onAvatarClick={handleOpenConfigDialog} // Pass the handler
        />
        <InputArea
          onSendMessage={handlePlayerMessage}
          isAIThinking={!!thinkingCharacterId}
        />
      </div>
      {configuringCharacter && (
        <CharacterConfigDialog
          character={configuringCharacter}
          isOpen={isConfigDialogOpen}
          onClose={handleCloseConfigDialog}
          onSave={handleSaveConfig}
        />
      )}
    </div>
  );
};

export default Index;
