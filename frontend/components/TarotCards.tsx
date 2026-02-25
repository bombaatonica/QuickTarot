'use client';

import { TarotCard } from '@/lib/api';

interface TarotCardsProps {
  cards: TarotCard[];
}

export default function TarotCards({ cards }: TarotCardsProps) {
  return (
    <div className="grid grid-cols-3 gap-2 mb-4">
      {cards.map((card, index) => (
        <div
          key={index}
          className="bg-gradient-to-br from-purple-100 to-purple-200 border-2 border-purple-300 rounded-lg p-3 text-center animate-fade-in"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <div className="font-semibold text-purple-900 text-sm mb-1">
            {card.name}
          </div>
          {card.suit && (
            <div className="text-xs text-purple-700 mb-1">
              {card.suit}
            </div>
          )}
          {card.is_major && (
            <div className="text-xs text-purple-600 font-medium">
              Arcano Maior
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
