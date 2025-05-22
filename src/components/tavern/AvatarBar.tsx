
import React from 'react';
import { AICharacter } from '@/types/tavern';
import CharacterAvatar from './CharacterAvatar';

interface AvatarBarProps {
  characters: AICharacter[];
  activeSpeakerId: string | null;
  thinkingCharacterId: string | null;
}

const AvatarBar: React.FC<AvatarBarProps> = ({ characters, activeSpeakerId, thinkingCharacterId }) => {
  return (
    <div className="bg-tavern-panel-bg p-3 flex justify-center items-center rounded-b-lg shadow-md mt-2">
      {characters.map((char) => (
        <CharacterAvatar
          key={char.id}
          character={char}
          isActive={activeSpeakerId === char.id}
          isThinking={thinkingCharacterId === char.id}
        />
      ))}
    </div>
  );
};

export default AvatarBar;
