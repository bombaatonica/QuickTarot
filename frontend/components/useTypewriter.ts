import { useState, useEffect, useRef } from 'react';

interface UseTypewriterOptions {
  delay?: number;
  cursor?: string;
  onFinish?: () => void;
}

export default function useTypewriter(
  text: string,
  options: UseTypewriterOptions = {}
) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const textRef = useRef(text);
  const optionsRef = useRef(options);
  const lineIndex = useRef(0);
  const charIndex = useRef(0);
  const timerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (text !== textRef.current) {
      textRef.current = text;
      reset();
    }
  }, [text]);

  useEffect(() => {
    if (options !== optionsRef.current) {
      optionsRef.current = options;
    }
  }, [options]);

const splitIntoSentences = (text: string) => {
    return text.split('\n').filter(line => line.trim() !== '');
  };

  const typeLine = (line: string) => {
    const chars = line.split('');
    const typeChar = () => {
      if (charIndex.current < chars.length) {
        setDisplayedText(prev => prev + chars[charIndex.current]);
        charIndex.current++;
        timerRef.current = setTimeout(typeChar, 30);
      } else {
        setDisplayedText(prev => prev + '\n');
        lineIndex.current++;
        charIndex.current = 0;
        if (lineIndex.current < sentencesRef.current.length) {
          typeLine(sentencesRef.current[lineIndex.current]);
        } else {
          setIsFinished(true);
          if (optionsRef.current.onFinish) {
            optionsRef.current.onFinish();
          }
        }
      }
    };

    typeChar();
  };

  const sentencesRef = useRef(splitIntoSentences(text));

  const startTyping = () => {
    if (!isTyping && !isFinished) {
      setIsTyping(true);
      if (sentencesRef.current.length > 0) {
        typeLine(sentencesRef.current[lineIndex.current]);
      }
    }
  };

  const pauseTyping = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setIsTyping(false);
  };

  const reset = () => {
    pauseTyping();
    setDisplayedText('');
    setIsFinished(false);
    lineIndex.current = 0;
    charIndex.current = 0;
    sentencesRef.current = splitIntoSentences(text);
  };

  const skipTyping = () => {
    pauseTyping();
    setDisplayedText(text);
    setIsFinished(true);
    if (optionsRef.current.onFinish) {
      optionsRef.current.onFinish();
    }
  };

  const handleUserInteraction = () => {
    if (isTyping && !isFinished) {
      skipTyping();
    }
  };

  useEffect(() => {
    startTyping();
    return () => {
      pauseTyping();
    };
  }, []);

  return {
    displayedText,
    isTyping,
    isFinished,
    startTyping,
    pauseTyping,
    reset,
    skipTyping,
    handleUserInteraction,
  };
}