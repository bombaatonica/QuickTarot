'use client';

import { useState, useEffect } from 'react';

interface FormattedTarotTextProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
  className?: string;
}

export default function FormattedTarotText({ 
  text, 
  speed = 3,
  onComplete,
  className = ''
}: FormattedTarotTextProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  // Escapa HTML antes de qualquer processamento — o texto vem do LLM
  // (que ecoa a pergunta do usuário) e é renderizado via dangerouslySetInnerHTML.
  const escapeHtml = (raw: string) =>
    raw.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Função para processar markdown simples
  const processMarkdown = (rawText: string) => {
    const safeText = escapeHtml(rawText);
    // Processar **negrito** → <strong>
    let processed = safeText.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-purple-700">$1</strong>');
    
    // Processar headers → <h3>
    processed = processed.replace(/\*\*(.*?)\*\*\n/g, '<h3 class="tarot-header text-base sm:text-lg font-bold text-purple-600 mb-2 sm:mb-3 mt-3 sm:mt-4">$1</h3>');
    
    // Processar itens numerados → <div class="tarot-card-item">
    processed = processed.replace(/(\d+)\.\s*\*\*(.*?)\*\*:\s*(.*?)(?=\n\d+\.|\n\n|\n\*\*|$)/g, 
      '<div class="tarot-card-item mb-2 sm:mb-3"><span class="font-semibold text-purple-600 text-sm sm:text-base">$1.</span> <strong class="font-bold text-purple-700 text-sm sm:text-base">$2</strong>: <span class="text-gray-700 text-sm sm:text-base">$3</span></div>');
    
    // Processar bullet points → <li>
    processed = processed.replace(/•\s*(.*?)(?=\n•|\n\n|$)/g, 
      '<li class="tarot-insight-item text-gray-700 ml-4 mb-1 text-sm sm:text-base">• $1</li>');
    
    // Processar parágrafos normais
    processed = processed.replace(/\n\n/g, '</p><p class="mb-2 sm:mb-3 text-gray-700 text-sm sm:text-base">');
    processed = `<p class="mb-2 sm:mb-3 text-gray-700 text-sm sm:text-base">${processed}</p>`;
    
    return processed;
  };

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

  const processedText = processMarkdown(displayedText);

  return (
    <div 
      className={`prose prose-sm max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: processedText }}
    />
  );
}
