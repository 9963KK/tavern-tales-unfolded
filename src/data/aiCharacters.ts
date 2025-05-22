
import { AICharacter } from '@/types/tavern';
import { User } from 'lucide-react'; // Using a generic user icon

export const initialAICharacters: AICharacter[] = [
  {
    id: 'thorgar',
    name: 'Barkeep Thorgar',
    avatarColor: 'bg-red-700', // Earthy red
    greeting: "Welcome, traveler. What can I get for ye?",
    responses: [
      "Aye, that's an interesting tale.",
      "The usual, then?",
      "Heard any news from the road?",
      "Another round? Or perhaps something stronger?",
      "Careful now, don't want no trouble in my establishment."
    ],
  },
  {
    id: 'elara',
    name: 'Elara the Bard',
    avatarColor: 'bg-yellow-500', // Bright yellow for a bard
    greeting: "Greetings! Care for a song, or perhaps a story?",
    responses: [
      "Ah, a classic choice!",
      "That reminds me of a lay about a dragon...",
      "Music soothes the soul, wouldn't you agree?",
      "I've traveled far and wide, seen many things.",
      "Perhaps your adventures would make a fine ballad!"
    ],
  },
  {
    id: 'mysteriousStranger',
    name: 'Mysterious Stranger',
    avatarColor: 'bg-indigo-700', // Deep, mysterious color
    greeting: "...",
    responses: [
      "Hmph.",
      "Some secrets are best left buried.",
      "The shadows hold many truths.",
      "I'm listening.",
      "We all have our reasons for being here."
    ],
  },
];
