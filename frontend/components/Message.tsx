'use client';

import TarotCards from './TarotCards';
import { TarotCard } from '@/lib/api';

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

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-3xl ${isUser ? 'bg-purple-600 text-white' : 'bg-white text-gray-900'} rounded-lg p-4 shadow-sm`}>
        {!isUser && message.cards && (
          <div className="mb-4">
            <TarotCards cards={message.cards} />
          </div>
        )}
        <div className="whitespace-pre-wrap">{message.content}</div>
      </div>
    </div>
  );
}
