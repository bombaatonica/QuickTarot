'use client';

import { useState, useEffect, useCallback } from 'react';
import { TarotCard } from '@/lib/api';
import AnimatedTarotCard from './AnimatedTarotCard';

interface TarotCardsProps {
  cards: TarotCard[];
  onAnimationComplete?: () => void;
}

/** intervalo entre o flip de cada carta */
const STAGGER_MS = 150;

export default function TarotCards({ cards, onAnimationComplete }: TarotCardsProps) {
  const [revealedCount, setRevealedCount] = useState(0);

  const handleCardRevealed = useCallback(() => {
    setRevealedCount((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (cards.length > 0 && revealedCount >= cards.length) {
      const timer = setTimeout(() => {
        onAnimationComplete?.();
      }, 400); // respiro entre a última carta e o início do texto
      return () => clearTimeout(timer);
    }
  }, [revealedCount, cards.length, onAnimationComplete]);

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:gap-4 mb-4">
      {cards.map((card, index) => (
        <AnimatedTarotCard
          key={`${card.name}-${index}`}
          card={card}
          index={index}
          delay={index * STAGGER_MS}
          onRevealed={handleCardRevealed}
        />
      ))}
    </div>
  );
}
