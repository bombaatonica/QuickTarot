'use client';

import TarotCards from './TarotCards';
import { TarotCard } from '@/lib/api';
import useTypewriter from './useTypewriter';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  cards?: TarotCard[];
}

interface MessageProps {
  message: Message;
}

export default function Message({ message }: MessageProps) {
  const isUser = message.role === 'user';
const { displayedText, isTyping, isFinished, handleUserInteraction } = useTypewriter(message.content);

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`} onClick={handleUserInteraction}>
      <div className={`max-w-3xl ${isUser ? 'bg-purple-600 text-white' : 'bg-white text-gray-900'} rounded-lg p-4 shadow-sm`}>
        {!isUser && message.cards && (
          <div className="mb-4">
            <TarotCards cards={message.cards} />
          </div>
        )}
        <div className="whitespace-pre-wrap">{displayedText}</div>
        {!isFinished && (
          <div className="mt-2 text-sm text-gray-500 animate-pulse">
            digitando...
          </div>
        )}
      </div>
    </div>
  );
}
