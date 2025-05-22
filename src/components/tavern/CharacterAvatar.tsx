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
    <div
      className="flex flex-col items-center mx-2 mt-3 transition-transform duration-200 hover:scale-105 active:scale-95 select-none cursor-pointer"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      title={character.name}
    >
      {/* 头像+光环 */}
      <div className="relative mb-1 flex items-center justify-center">
        {(isActive || isThinking) && (
          <div className="absolute inset-0 z-0 halo-animate halo-gradient rounded-full" style={{width: 64, height: 64}} />
        )}
        <div
          className={`relative z-10 w-16 h-16 rounded-full ${character.avatarColor} flex items-center justify-center border-2
            ${isActive && !isThinking ? 'border-tavern-accent' : 'border-transparent'}
            ${isThinking ? 'border-blue-400' : ''}
            transition-all duration-300`}
        >
          {isThinking ? (
            <Loader2 size={32} className="text-white animate-spin" />
          ) : (
            <User size={32} className="text-white opacity-80" />
          )}
        </div>
      </div>
      {/* 角色名 */}
      <p className={`text-xs text-center w-full truncate px-1 ${isActive || isThinking ? 'text-tavern-accent font-semibold' : 'text-tavern-text'}`}>
        {character.name}
      </p>
      {/* 状态栏（高度固定，始终占位） */}
      <div className="h-5 flex items-center justify-center w-full mt-0.5">
        <span className={`text-xs italic transition-all duration-200 ${isThinking ? 'text-blue-400 opacity-100' : 'opacity-0'}`}>思考中...</span>
      </div>
      {/* 动态光环动画样式 */}
      <style jsx>{`
        .halo-animate {
          animation: halo-spin 1.2s linear infinite;
        }
        .halo-gradient {
          background: conic-gradient(rgba(255, 215, 0, 0.5), rgba(255, 215, 0, 0.1) 60%, rgba(255, 215, 0, 0.5) 100%);
          filter: blur(2px);
          opacity: 0.7;
          transform: scale(1.10);
        }
        @keyframes halo-spin {
          0% { transform: scale(1.10) rotate(0deg); opacity: 0.7; }
          50% { transform: scale(1.18) rotate(180deg); opacity: 1; }
          100% { transform: scale(1.10) rotate(360deg); opacity: 0.7; }
        }
      `}</style>
    </div>
  );
};

export default CharacterAvatar;
