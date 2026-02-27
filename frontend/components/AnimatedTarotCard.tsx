'use client';

import { useState, useEffect } from 'react';
import { TarotCard } from '@/lib/api';
import { getTarotCardByNamePt } from '@/data/tarot-data';

interface AnimatedTarotCardProps {
  card: TarotCard;
  index: number;
  delay: number;
}

export default function AnimatedTarotCard({ card, index, delay }: AnimatedTarotCardProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  console.log('Card received:', card.name); // Debug log
  
  const cardData = getTarotCardByNamePt(card.name);
  const imageUrl = cardData?.image_url || '';
  
  console.log('Card data found:', cardData?.namePt, 'Image URL:', imageUrl); // Debug log

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsRevealed(true);
    }, delay * 1000);

    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (imageUrl && isRevealed) {
      console.log('Loading image:', imageUrl); // Debug log
      const img = new Image();
      img.onload = () => {
        console.log('Image loaded successfully:', imageUrl);
        setImageLoaded(true);
      };
      img.onerror = () => {
        console.log('Image failed to load:', imageUrl);
        setImageError(true);
      };
      img.src = imageUrl;
    }
  }, [imageUrl, isRevealed]);

  if (!cardData) {
    // Fallback para cards não encontrados
    return (
      <div
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
    );
  }

  return (
    <div className="relative w-full h-48 perspective-1000">
      <div
        className={`relative w-full h-full transition-all duration-700 transform-style-preserve-3d ${
          isRevealed ? 'rotate-y-180' : ''
        }`}
        style={{
          animationDelay: `${index * 0.1}s`,
          transformStyle: 'preserve-3d'
        }}
      >
        {/* Verso da carta (parte de trás) */}
        <div 
          className="absolute inset-0 w-full h-full backface-hidden rounded-lg overflow-hidden"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className="w-full h-full bg-gradient-to-br from-purple-800 to-purple-900 border-2 border-purple-300 rounded-lg flex items-center justify-center">
            <div className="text-white text-center">
              <div className="text-2xl mb-1">🌟</div>
              <div className="text-xs font-medium">Tarot</div>
            </div>
          </div>
        </div>

        {/* Frente da carta (imagem) */}
        <div 
          className={`absolute inset-0 w-full h-full backface-hidden rounded-lg overflow-hidden rotate-y-180 ${
            !imageLoaded && isRevealed ? 'animate-pulse' : ''
          }`}
          style={{ 
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)'
          }}
        >
          {imageError || !imageUrl ? (
            // Fallback se a imagem não carregar
            <div className="w-full h-full bg-gradient-to-br from-purple-100 to-purple-200 border-2 border-purple-300 rounded-lg p-2 flex flex-col items-center justify-center">
              <div className="font-semibold text-purple-900 text-xs text-center mb-1">
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
          ) : (
            <>
              <img 
                src={imageUrl}
                alt={card.name}
                className={`w-full h-full object-cover ${imageLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
              />
              {/* Overlay com informações */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                <div className="text-white text-xs font-medium text-center">
                  {card.name}
                </div>
                {card.suit && (
                  <div className="text-white/80 text-xs text-center">
                    {card.suit}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Loading indicator */}
      {isRevealed && !imageLoaded && !imageError && imageUrl && (
        <div className="absolute inset-0 flex items-center justify-center bg-purple-900/20 rounded-lg">
          <div className="text-purple-600 text-xs">Carregando...</div>
        </div>
      )}
    </div>
  );
}
