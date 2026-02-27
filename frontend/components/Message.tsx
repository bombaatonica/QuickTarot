'use client';

import { useState } from 'react';
import TarotCards from './TarotCards';
import FormattedTarotText from './FormattedTarotText';
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
  const [showInterpretation, setShowInterpretation] = useState(true); // Começa já mostrando
  const isUser = message.role === 'user';

  const handleAnimationComplete = () => {
    setShowInterpretation(true);
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} px-2 sm:px-0`}>
      <div className={`max-w-full sm:max-w-2xl lg:max-w-3xl ${isUser ? 'bg-purple-600 text-white' : 'bg-white text-gray-900'} rounded-lg p-3 sm:p-4 shadow-sm`}>
        {!isUser && message.cards && (
          <div className="mb-4">
            <TarotCards 
              cards={message.cards} 
              onAnimationComplete={handleAnimationComplete}
            />
          </div>
        )}
        {!isUser && message.cards ? (
          showInterpretation ? (
            <div>
              <FormattedTarotText 
                text={message.content} 
                speed={3} // velocidade 3x mais rápida
              />
            </div>
          ) : (
            <div className="text-gray-400 italic">
              Aguardando revelação das cartas...
            </div>
          )
        ) : (
          <div className="whitespace-pre-wrap">{message.content}</div>
        )}
      </div>
    </div>
  );
}
