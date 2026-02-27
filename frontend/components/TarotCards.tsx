'use client';

import { TarotCard } from '@/lib/api';
import AnimatedTarotCard from './AnimatedTarotCard';

interface TarotCardsProps {
  cards: TarotCard[];
}

export default function TarotCards({ cards }: TarotCardsProps) {
  return (
    <div className="grid grid-cols-3 gap-4 mb-4">
      {cards.map((card, index) => (
        <AnimatedTarotCard
          key={index}
          card={card}
          index={index}
          delay={index * 0.5} // 0.5s delay entre cada carta
        />
      ))}
    </div>
  );
}
