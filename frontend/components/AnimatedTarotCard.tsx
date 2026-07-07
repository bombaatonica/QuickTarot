'use client';

import { memo, useState, useEffect, useRef } from 'react';
import { TarotCard } from '@/lib/api';
import { getTarotCardByNamePt } from '@/data/tarot-data';

interface AnimatedTarotCardProps {
  card: TarotCard;
  index: number;
  /** atraso em ms antes desta carta virar (stagger da tiragem) */
  delay: number;
  onRevealed?: () => void;
}

const FLIP_DURATION_MS = 700;

function AnimatedTarotCard({ card, index, delay, onRevealed }: AnimatedTarotCardProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const onRevealedRef = useRef(onRevealed);
  onRevealedRef.current = onRevealed;

  const cardData = getTarotCardByNamePt(card.name);
  const imageUrl = cardData?.image_url || '';

  // Pré-carrega a imagem enquanto a carta ainda está de costas
  useEffect(() => {
    if (!imageUrl) {
      setImageError(true);
      return;
    }
    const img = new Image();
    img.onload = () => setImageLoaded(true);
    img.onerror = () => setImageError(true);
    img.src = imageUrl;
  }, [imageUrl]);

  // Vira a carta após o delay; dispara onRevealed quando o flip termina
  useEffect(() => {
    const flipTimer = setTimeout(() => setIsRevealed(true), delay);
    const doneTimer = setTimeout(() => {
      onRevealedRef.current?.();
    }, delay + FLIP_DURATION_MS);
    return () => {
      clearTimeout(flipTimer);
      clearTimeout(doneTimer);
    };
  }, [delay]);

  const cardInfoFallback = (
    <div className="w-full h-full bg-gradient-to-br from-bordeaux-800 to-bordeaux-900 border-2 border-gold-400/50 rounded-lg p-2 flex flex-col items-center justify-center">
      <div className="text-gold-400 text-lg mb-2" aria-hidden="true">✦</div>
      <div className="font-display font-semibold text-gold-200 text-xs text-center mb-1">
        {card.name}
      </div>
      {card.suit && (
        <div className="text-xs text-gold-100/60 mb-1">{card.suit}</div>
      )}
      {card.is_major && (
        <div className="text-xs text-gold-300/80 font-medium">Arcano Maior</div>
      )}
    </div>
  );

  return (
    <div className="relative w-full aspect-[3/5] perspective-1000 group">
      <div
        className={`relative w-full h-full transition-transform duration-700 transform-style-preserve-3d ${
          isRevealed ? 'rotate-y-180' : ''
        }`}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Verso da carta */}
        <div
          className="absolute inset-0 w-full h-full backface-hidden rounded-lg overflow-hidden"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className="w-full h-full bg-gradient-to-br from-bordeaux-800 via-bordeaux-900 to-bordeaux-950 border-2 border-gold-400/60 rounded-lg flex items-center justify-center shadow-gold-glow">
            <div className="text-center border border-gold-400/40 rounded-md px-4 py-6 m-3">
              <div className="text-gold-400 text-3xl mb-2 animate-shimmer" aria-hidden="true">✦</div>
              <div className="font-display text-gold-300/90 text-xs tracking-[0.35em] uppercase">Tarot</div>
            </div>
          </div>
        </div>

        {/* Frente da carta */}
        <div
          className="absolute inset-0 w-full h-full backface-hidden rounded-lg overflow-hidden rotate-y-180 border-2 border-gold-400/60 group-hover:shadow-gold-glow-lg transition-shadow"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          {imageError || !imageUrl || !cardData ? (
            cardInfoFallback
          ) : (
            <>
              <img
                src={imageUrl}
                alt={card.name}
                width={300}
                height={527}
                loading="lazy"
                decoding="async"
                className={`w-full h-full object-cover ${imageLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
              />
              {!imageLoaded && (
                <div className="absolute inset-0 bg-gradient-to-br from-bordeaux-800 to-bordeaux-900 animate-pulse" />
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 pt-6">
                <div className="text-gold-200 text-xs font-display font-semibold text-center">
                  {card.name}
                </div>
                {card.suit && (
                  <div className="text-gold-100/70 text-xs text-center">{card.suit}</div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(AnimatedTarotCard);
