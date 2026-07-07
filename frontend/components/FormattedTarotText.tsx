'use client';

import { useState, useEffect, useMemo, useRef } from 'react';

interface FormattedTarotTextProps {
  text: string;
  /** ms entre cada tick do typewriter */
  speed?: number;
  /** caracteres revelados por tick (reduz re-renders) */
  charsPerTick?: number;
  onComplete?: () => void;
  className?: string;
}

// Escapa HTML antes de qualquer processamento — o texto vem do LLM
// (que ecoa a pergunta do usuário) e é renderizado via dangerouslySetInnerHTML.
const escapeHtml = (raw: string) =>
  raw.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const processMarkdown = (rawText: string) => {
  const safeText = escapeHtml(rawText);

  // Headers **Título** em linha própria → <h3>
  let processed = safeText.replace(/^\*\*(.*?)\*\*\s*$/gm,
    '<h3 class="font-display text-base sm:text-lg font-bold text-gold-400 mb-2 sm:mb-3 mt-3 sm:mt-4">$1</h3>');

  // Itens numerados "1. **Carta**: texto"
  processed = processed.replace(/(\d+)\.\s*\*\*([\s\S]*?)\*\*:\s*([\s\S]*?)(?=\n\d+\.|\n\n|\n\*\*|$)/g,
    '<div class="mb-2 sm:mb-3"><span class="font-semibold text-gold-300">$1.</span> <strong class="font-bold text-gold-300">$2</strong>: <span class="text-gold-50/90">$3</span></div>');

  // Negrito restante
  processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gold-300">$1</strong>');

  // Bullet points
  processed = processed.replace(/•\s*([\s\S]*?)(?=\n•|\n\n|$)/g,
    '<li class="text-gold-50/90 ml-4 mb-1 list-none">• $1</li>');

  // Parágrafos
  processed = processed.replace(/\n\n/g, '</p><p class="mb-2 sm:mb-3 text-gold-50/90">');
  processed = `<p class="mb-2 sm:mb-3 text-gold-50/90">${processed}</p>`;

  return processed;
};

export default function FormattedTarotText({
  text,
  speed = 12,
  charsPerTick = 4,
  onComplete,
  className = '',
}: FormattedTarotTextProps) {
  const [visibleChars, setVisibleChars] = useState(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const isComplete = visibleChars >= text.length;

  useEffect(() => {
    setVisibleChars(0);
    if (!text) return;

    // Usuários com preferência por menos movimento veem o texto direto
    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      setVisibleChars(text.length);
      onCompleteRef.current?.();
      return;
    }

    const interval = setInterval(() => {
      setVisibleChars((prev) => {
        const next = Math.min(prev + charsPerTick, text.length);
        if (next >= text.length) {
          clearInterval(interval);
          onCompleteRef.current?.();
        }
        return next;
      });
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed, charsPerTick]);

  const processedText = useMemo(
    () => processMarkdown(text.slice(0, visibleChars)),
    [text, visibleChars]
  );

  return (
    <div className={`max-w-none leading-relaxed ${className}`}>
      <div dangerouslySetInnerHTML={{ __html: processedText }} />
      {!isComplete && <span className="typewriter-cursor" aria-hidden="true" />}
    </div>
  );
}
