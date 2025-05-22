import React from 'react';
import { AICharacter } from '@/types/tavern';
import CharacterAvatar from './CharacterAvatar';
import { Button } from '@/components/ui/button'; // Shadcn Button
import { Play, Pause } from 'lucide-react'; // Icons

interface AvatarBarProps {
  characters: AICharacter[];
  activeSpeakerId: string | null;
  thinkingCharacterId: string | null;
  onAvatarClick?: (characterId: string) => void;
  isAutoConversationActive: boolean; // New prop for pause state
  onToggleAutoConversation: () => void; // New prop for toggling pause
}

const AvatarBar: React.FC<AvatarBarProps> = ({
  characters,
  activeSpeakerId,
  thinkingCharacterId,
  onAvatarClick,
  isAutoConversationActive,
  onToggleAutoConversation,
}) => {
  return (
    <div className="bg-tavern-panel-bg p-3 flex items-center justify-between rounded-b-lg shadow-md mt-2">
      <div className="avatar-bar flex justify-center items-center flex-grow space-x-2 overflow-x-auto pr-2"> {/* Added overflow for many characters and padding for button */}
        {characters.map((char) => (
          <CharacterAvatar
            key={char.id}
            character={char}
            isActive={activeSpeakerId === char.id}
            isThinking={thinkingCharacterId === char.id}
            onAvatarClick={onAvatarClick}
          />
        ))}
      </div>
      <div className="ml-2 flex-shrink-0"> {/* Ensure button does not cause overflow if avatars take full width */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleAutoConversation}
          aria-label={isAutoConversationActive ? "暂停自动对话" : "恢复自动对话"}
          className="text-tavern-accent hover:text-yellow-400"
        >
          {isAutoConversationActive ? <Pause size={20} /> : <Play size={20} />}
        </Button>
      </div>
    </div>
  );
};

export default AvatarBar;

