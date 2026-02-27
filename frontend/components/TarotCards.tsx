'use client';

import { useState, useEffect } from 'react';
import { TarotCard } from '@/lib/api';
import AnimatedTarotCard from './AnimatedTarotCard';

interface TarotCardsProps {
  cards: TarotCard[];
  onAnimationComplete?: () => void;
}

export default function TarotCards({ cards, onAnimationComplete }: TarotCardsProps) {
  const [revealedCards, setRevealedCards] = useState<Set<number>>(new Set());

  const handleCardRevealed = (index: number) => {
    setRevealedCards(prev => new Set(prev).add(index));
  };

  useEffect(() => {
    if (revealedCards.size === cards.length && cards.length > 0) {
      // Todas as cartas foram reveladas
      setTimeout(() => {
        onAnimationComplete?.();
      }, 500); // Pequeno delay extra antes de iniciar o texto
    }
  }, [revealedCards.size, cards.length, onAnimationComplete]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 lg:gap-4 mb-4">
      {cards.map((card, index) => (
        <AnimatedTarotCard
          key={index}
          card={card}
          index={index}
          delay={0} // Sem delay - todas aparecem de uma vez
          onRevealed={() => handleCardRevealed(index)}
        />
      ))}
    </div>
  );
}
