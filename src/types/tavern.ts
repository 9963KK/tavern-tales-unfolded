
export interface AICharacter {
  id: string;
  name: string;
  avatarColor: string; // Tailwind color class, e.g., 'bg-red-500'
  placeholderIcon?: string; // URL or path to an icon if we use images later
  greeting: string;
  responses: string[]; // A list of possible responses
}

export interface Message {
  id: string;
  sender: string; // 'Player' or AICharacter.name
  text: string;
  isPlayer: boolean;
  timestamp: Date;
  avatarColor?: string; // For AI messages
}
