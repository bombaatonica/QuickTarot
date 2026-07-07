'use client';

import { memo, useState, useCallback } from 'react';
import TarotCards from './TarotCards';
import FormattedTarotText from './FormattedTarotText';
import { TarotCard } from '@/lib/api';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  cards?: TarotCard[];
  isError?: boolean;
}

interface MessageProps {
  message: ChatMessage;
}

function Message({ message }: MessageProps) {
  const isUser = message.role === 'user';
  const hasCards = !isUser && !!message.cards && message.cards.length > 0;
  // Com cartas: interpretação só aparece depois da revelação das cartas
  const [showInterpretation, setShowInterpretation] = useState(!hasCards);

  const handleAnimationComplete = useCallback(() => {
    setShowInterpretation(true);
  }, []);

  const bubbleClasses = isUser
    ? 'bg-bordeaux-700 text-gold-50 border border-gold-400/20 rounded-2xl rounded-br-sm'
    : message.isError
      ? 'bg-red-950/60 text-red-200 border border-red-400/30 rounded-2xl rounded-bl-sm'
      : 'bg-bordeaux-900/80 text-gold-50 border border-gold-400/20 rounded-2xl rounded-bl-sm shadow-gold-glow';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} px-2 sm:px-0 animate-fade-in`}>
      <div className={`max-w-full sm:max-w-2xl lg:max-w-3xl p-3 sm:p-5 ${bubbleClasses}`}>
        {hasCards && (
          <div className="mb-4">
            <TarotCards
              cards={message.cards!}
              onAnimationComplete={handleAnimationComplete}
            />
          </div>
        )}
        {hasCards ? (
          showInterpretation ? (
            <FormattedTarotText text={message.content} />
          ) : (
            <div className="text-gold-200/50 italic text-sm">
              As cartas estão sendo reveladas...
            </div>
          )
        ) : (
          <div className="whitespace-pre-wrap">{message.content}</div>
        )}
      </div>
    </div>
  );
}

export default memo(Message);
