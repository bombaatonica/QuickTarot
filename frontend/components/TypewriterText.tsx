'use client';

import { useState, useEffect } from 'react';

interface TypewriterTextProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
  className?: string;
}

export default function TypewriterText({ 
  text, 
  speed = 30, // velocidade em ms (padrão rápido)
  onComplete,
  className = ''
}: TypewriterTextProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    let currentIndex = 0;
    let timeout: NodeJS.Timeout;

    const typeNextChar = () => {
      if (currentIndex < text.length) {
        setDisplayedText(text.slice(0, currentIndex + 1));
        currentIndex++;
        timeout = setTimeout(typeNextChar, speed);
      } else {
        setIsComplete(true);
        onComplete?.();
      }
    };

    // Reset quando o texto mudar
    setDisplayedText('');
    setIsComplete(false);
    currentIndex = 0;
    
    // Começar a digitação
    timeout = setTimeout(typeNextChar, 100);

    return () => clearTimeout(timeout);
  }, [text, speed, onComplete]);

  return (
    <span className={className}>
      {displayedText}
      {!isComplete && <span className="animate-pulse">|</span>}
    </span>
  );
}
