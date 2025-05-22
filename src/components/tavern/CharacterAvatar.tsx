
import React from 'react';
import { AICharacter } from '@/types/tavern';
import { User, Loader2 } from 'lucide-react'; // User for generic, Loader2 for thinking

interface CharacterAvatarProps {
  character: AICharacter;
  isActive: boolean;
  isThinking: boolean;
}

const CharacterAvatar: React.FC<CharacterAvatarProps> = ({ character, isActive, isThinking }) => {
  return (
    <div className="flex flex-col items-center mx-2">
      <div
        className={`w-16 h-16 rounded-full ${character.avatarColor} flex items-center justify-center mb-1 border-2
                    ${isActive && !isThinking ? 'border-tavern-accent ring-2 ring-tavern-accent shadow-lg' : 'border-transparent'}
                    ${isThinking ? 'border-blue-400 ring-2 ring-blue-400 animate-pulse' : ''}
                    transition-all duration-300 transform hover:scale-105 cursor-pointer`}
        title={character.name}
      >
        {isThinking ? (
          <Loader2 size={32} className="text-white animate-spin" />
        ) : (
          <User size={32} className="text-white opacity-80" />
        )}
      </div>
      <p className={`text-xs ${isActive || isThinking ? 'text-tavern-accent font-semibold' : 'text-tavern-text'}`}>
        {character.name.split(' ')[0]} {/* Show first name */}
      </p>
      {isThinking && <p className="text-xs text-blue-400 italic">Thinking...</p>}
    </div>
  );
};

export default CharacterAvatar;
