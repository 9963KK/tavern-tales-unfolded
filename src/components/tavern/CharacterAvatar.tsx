
import React from 'react';
import { AICharacter } from '@/types/tavern';
import { User, Loader2 } from 'lucide-react'; // User for generic, Loader2 for thinking

interface CharacterAvatarProps {
  character: AICharacter;
  isActive: boolean;
  isThinking: boolean;
  onAvatarClick?: (characterId: string) => void; // New prop
}

const CharacterAvatar: React.FC<CharacterAvatarProps> = ({ character, isActive, isThinking, onAvatarClick }) => {
  const handleClick = () => {
    if (onAvatarClick) {
      onAvatarClick(character.id);
    }
  };

  return (
    <div className="flex flex-col items-center mx-2" onClick={handleClick} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && handleClick()}>
      <div
        className={`w-16 h-16 rounded-full ${character.avatarColor} flex items-center justify-center mb-1 border-2
                    ${isActive && !isThinking ? 'border-tavern-accent ring-2 ring-tavern-accent shadow-lg' : 'border-transparent'}
                    ${isThinking ? 'border-blue-400 ring-2 ring-blue-400 animate-pulse' : ''}
                    transition-all duration-300 transform hover:scale-105 ${onAvatarClick ? 'cursor-pointer' : 'cursor-default'}`}
        title={character.name}
      >
        {isThinking ? (
          <Loader2 size={32} className="text-white animate-spin" />
        ) : (
          <User size={32} className="text-white opacity-80" />
        )}
      </div>
      <p className={`text-xs ${isActive || isThinking ? 'text-tavern-accent font-semibold' : 'text-tavern-text'}`}>
        {character.name.split(' ')[0]} {/* Show first part of name, for Chinese names this might just be the full name if no space */}
      </p>
      {isThinking && <p className="text-xs text-blue-400 italic">思考中...</p>}
    </div>
  );
};

export default CharacterAvatar;
