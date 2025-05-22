import React, { useState, useEffect, useCallback } from 'react';
import SceneHeader from '@/components/tavern/SceneHeader';
import ChatWindow from '@/components/tavern/ChatWindow';
import AvatarBar from '@/components/tavern/AvatarBar';
import InputArea from '@/components/tavern/InputArea';
import CharacterConfigDialog from '@/components/tavern/CharacterConfigDialog';
import { Message, AICharacter, ModelConfig } from '@/types/tavern';
import { initialAICharacters } from '@/data/aiCharacters';
import { v4 as uuidv4 } from 'uuid';
import { Play, Pause } from 'lucide-react';

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [aiCharacters, setAiCharacters] = useState<AICharacter[]>(initialAICharacters);
  const [activeSpeakerId, setActiveSpeakerId] = useState<string | null>(null);
  const [thinkingCharacterId, setThinkingCharacterId] = useState<string | null>(null);
  const [currentTurnAIIndex, setCurrentTurnAIIndex] = useState<number>(0);
  const [autoConversationTimer, setAutoConversationTimer] = useState<NodeJS.Timeout | null>(null);
  const [isAutoConversationActive, setIsAutoConversationActive] = useState<boolean>(true);
  const [speakerHistory, setSpeakerHistory] = useState<string[]>([]);

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
    
    let lastSpeakerIndexInCurrentArray = currentTurnAIIndex; 
    if(lastSpeakerId) {
        const idx = aiCharacters.findIndex(c => c.id === lastSpeakerId);
        if(idx !== -1) lastSpeakerIndexInCurrentArray = idx;
    }
    
    const availableCharacters = aiCharacters.filter(char => !speakerHistory.includes(char.id) || speakerHistory.length >= aiCharacters.length);

    if (availableCharacters.length > 0) {
      for (let i = 0; i < aiCharacters.length; i++) {
        const potentialIndex = (lastSpeakerIndexInCurrentArray + 1 + i) % aiCharacters.length;
        const potentialChar = aiCharacters[potentialIndex];
        if (!speakerHistory.includes(potentialChar.id) || speakerHistory.length >= aiCharacters.length) {
          return potentialIndex;
        }
      }
      return aiCharacters.findIndex(c => c.id === availableCharacters[0].id);
    } else {
      return (lastSpeakerIndexInCurrentArray + 1) % aiCharacters.length;
    }

  }, [aiCharacters, speakerHistory, currentTurnAIIndex]);

  const startAutoConversation = useCallback(() => {
    if (!isAutoConversationActive || thinkingCharacterId || aiCharacters.length === 0) return;

    const timer = setTimeout(() => {
      if (!isAutoConversationActive || thinkingCharacterId) { 
        if(autoConversationTimer) clearTimeout(autoConversationTimer); 
        setAutoConversationTimer(null);
        if(thinkingCharacterId) setThinkingCharacterId(null); 
        return;
      }
      
      const nextAIIndex = selectNextSpeakerIndex();
      const nextAI = aiCharacters[nextAIIndex];
      
      if (!nextAI) { 
        if(autoConversationTimer) clearTimeout(autoConversationTimer);
        setAutoConversationTimer(null);
        // Potentially try to restart if state allows, or log this error
        // For now, just return to avoid issues if nextAI is unexpectedly undefined.
        // If isAutoConversationActive is true, the useEffect might try to restart it.
        return;
      }

      setThinkingCharacterId(nextAI.id);

      setTimeout(() => {
        if (!isAutoConversationActive) { 
          setThinkingCharacterId(null);
          return;
        }
        const aiResponseText = nextAI.responses[Math.floor(Math.random() * nextAI.responses.length)];
        console.log(`${nextAI.name} (ID: ${nextAI.id}, Index: ${nextAIIndex}) is speaking. Config:`, nextAI.modelConfig);
        addMessage(aiResponseText, nextAI.name, false, nextAI.avatarColor);
        setActiveSpeakerId(nextAI.id);
        setThinkingCharacterId(null);
        
        setCurrentTurnAIIndex(nextAIIndex); 

        setSpeakerHistory(prev => {
          const newHistory = [...prev, nextAI.id];
          if (new Set(newHistory).size >= aiCharacters.length) {
            return [nextAI.id]; 
          }
          return [...new Set(newHistory)];
        });

        startAutoConversation(); 
      }, 1500 + Math.random() * 1000); 
    }, 4000 + Math.random() * 6000); 

    setAutoConversationTimer(timer);
  }, [
    aiCharacters,
    isAutoConversationActive,
    thinkingCharacterId,
    addMessage,
    selectNextSpeakerIndex,
    autoConversationTimer, 
  ]);

  useEffect(() => {
    if (aiCharacters.length > 0 && messages.length === 0) {
      const firstAI = aiCharacters[0];
      setThinkingCharacterId(firstAI.id);
      setTimeout(() => {
        addMessage(firstAI.greeting, firstAI.name, false, firstAI.avatarColor);
        setActiveSpeakerId(firstAI.id);
        setThinkingCharacterId(null);
        setSpeakerHistory([firstAI.id]); 
        setCurrentTurnAIIndex(0);         
        if (isAutoConversationActive) {
          // startAutoConversation(); // This will be picked up by the effect below
        }
      }, 1500);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps 
  }, [aiCharacters, messages.length, addMessage]); // Removed isAutoConversationActive & startAutoConversation

  useEffect(() => {
    if (isAutoConversationActive && messages.length > 0 && !autoConversationTimer && !thinkingCharacterId) {
        console.log("Effect: Kicking off auto-conversation post-greeting or on resume.");
        startAutoConversation();
    } else if (!isAutoConversationActive) {
        if (autoConversationTimer) {
            clearTimeout(autoConversationTimer);
            setAutoConversationTimer(null);
        }
        if (thinkingCharacterId) { // also clear thinking if we are pausing.
            setThinkingCharacterId(null);
        }
    }

    return () => {
      if (autoConversationTimer) {
        clearTimeout(autoConversationTimer);
        // setAutoConversationTimer(null); // Avoid race condition with setAutoConversationTimer in startAutoConversation
      }
    };
  }, [autoConversationTimer, isAutoConversationActive, messages.length, thinkingCharacterId, startAutoConversation]);

  const handlePlayerMessage = useCallback((text: string) => {
    let wasAutoConversationActiveBeforePlayer = isAutoConversationActive; // Store current state

    if (autoConversationTimer) {
      clearTimeout(autoConversationTimer);
      setAutoConversationTimer(null);
    }
    setIsAutoConversationActive(false); // Pause auto-conversation temporarily
    if (thinkingCharacterId) { 
      setThinkingCharacterId(null); 
    }

    addMessage(text, '玩家', true);
    setActiveSpeakerId(null); 

    const respondingAIIndex = selectNextSpeakerIndex();
    const respondingAI = aiCharacters[respondingAIIndex];

    if (!respondingAI) return; 

    setThinkingCharacterId(respondingAI.id);

    setTimeout(() => {
      const aiResponseText = respondingAI.responses[Math.floor(Math.random() * respondingAI.responses.length)];
      console.log(`${respondingAI.name} (ID: ${respondingAI.id}, Index: ${respondingAIIndex}) is responding to player. Config:`, respondingAI.modelConfig);
      addMessage(aiResponseText, respondingAI.name, false, respondingAI.avatarColor);
      setActiveSpeakerId(respondingAI.id);
      setThinkingCharacterId(null);
      
      setCurrentTurnAIIndex(respondingAIIndex); 

      setSpeakerHistory(prev => { 
        const newHistory = [...prev, respondingAI.id];
        if (new Set(newHistory).size >= aiCharacters.length) {
          return [respondingAI.id]; 
        }
        return [...new Set(newHistory)];
      });
      
      // Only restart auto-conversation if it was active before player message OR if it's globally set to active
      // For simplicity, let's stick to: if it was active OR if the global toggle is active
      // The current `isAutoConversationActive` is false here due to earlier setIsAutoConversationActive(false)
      // We should use the `wasAutoConversationActiveBeforePlayer` or check the desired policy.
      // Let's assume player interaction should resume if the global toggle is on.
      // The global toggle is `isAutoConversationActive` which is currently false.
      // So, we need to set it back to true if we want it to resume.
      
      setTimeout(() => {
        console.log("Player interaction done, potentially restarting auto-conversation.");
        // If it was manually paused by the user, `wasAutoConversationActiveBeforePlayer` might be misleading here.
        // The simplest is to always try to set it true, and the main useEffect will pick it up if conditions are met.
        // Or, better: check if the global toggle `isAutoConversationActive` (which we are about to set) should be true.
        // The pause button controls the *intent* for auto-conversation. Player message temporarily overrides.
        // Let's ensure that if the user explicitly paused, player message doesn't unpause it.
        // No, decided earlier player message *does* unpause unless user re-pauses.
        setIsAutoConversationActive(true); 
        // startAutoConversation(); // The useEffect will handle this.
      }, 3000 + Math.random() * 2000);

    }, 1500 + Math.random() * 1000);
  }, [
    autoConversationTimer,
    addMessage,
    aiCharacters,
    // startAutoConversation, // Removed to break potential loops if it changes too often
    thinkingCharacterId,
    selectNextSpeakerIndex,
    isAutoConversationActive, // Added as it's read
  ]);

  const toggleAutoConversation = () => {
    setIsAutoConversationActive(prevIsActive => {
      const newIsActive = !prevIsActive;
      if (!newIsActive) { // Means we are pausing
        if (autoConversationTimer) {
          clearTimeout(autoConversationTimer);
          setAutoConversationTimer(null);
        }
        setThinkingCharacterId(null); // Clear any thinking AI
      }
      // If newIsActive is true (resuming), the useEffect will handle starting the conversation.
      return newIsActive;
    });
  };

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
          onAvatarClick={handleOpenConfigDialog}
          isAutoConversationActive={isAutoConversationActive}
          onToggleAutoConversation={toggleAutoConversation}
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
