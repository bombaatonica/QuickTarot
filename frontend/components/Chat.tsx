'use client';

import { useState, useEffect, useRef } from 'react';
import Message from './Message';
import BuyQuestionButton from './BuyQuestionButton';
import { chatApi, authApi, TarotResponse } from '@/lib/api';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  cards?: TarotResponse['cards'];
  isError?: boolean;
}

const formatBRL = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [balance, setBalance] = useState<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadBalance();
  }, []);

  const loadBalance = async () => {
    try {
      const userData = await authApi.getMe();
      setBalance(userData.balance);
    } catch (error) {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        setBalance(userData.balance || 0);
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await chatApi.askTarotQuestion(userMessage.content);

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.interpretation,
        cards: response.cards,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (response.balance !== undefined) {
        setBalance(response.balance);
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const userData = JSON.parse(userStr);
          userData.balance = response.balance;
          localStorage.setItem('user', JSON.stringify(userData));
        }
      } else {
        await loadBalance();
      }
    } catch (error: any) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: error.response?.data?.detail || 'Erro ao processar pergunta. Verifique seu saldo.',
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="bg-bordeaux-950/80 backdrop-blur border-b border-gold-400/25 p-3 sm:p-4 flex justify-between items-center">
        <h1 className="font-display text-lg sm:text-2xl font-bold text-gold-400 text-gold-glow tracking-wide">
          <span aria-hidden="true" className="mr-2">✦</span>QuickTarot
        </h1>
        <BuyQuestionButton balance={balance} onBalanceUpdate={setBalance} />
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
        {messages.length === 0 && (
          <div className="text-center mt-12 sm:mt-24 animate-fade-in px-4">
            <div className="text-gold-400/70 text-2xl mb-4 tracking-[0.6em]" aria-hidden="true">✦ ✦ ✦</div>
            <p className="font-display text-xl sm:text-3xl text-gold-300 text-gold-glow mb-3">
              Bem-vindo ao QuickTarot
            </p>
            <p className="text-gold-100/70 text-base sm:text-lg max-w-xl mx-auto">
              Concentre-se na sua pergunta e o oráculo revelará uma tiragem de 9 cartas,
              interpretadas para você.
            </p>
            <p className="mt-5 text-sm text-gold-200/50 italic">Cada consulta custa {formatBRL(1)}</p>
          </div>
        )}
        {messages.map((message) => (
          <Message key={message.id} message={message} />
        ))}
        {isLoading && (
          <div className="flex justify-start px-2 sm:px-0 animate-fade-in">
            <div className="bg-bordeaux-900/80 border border-gold-400/20 rounded-2xl rounded-bl-sm p-4 shadow-gold-glow max-w-full sm:max-w-2xl lg:max-w-3xl">
              <div className="flex items-center gap-3">
                <div className="flex space-x-2" aria-hidden="true">
                  <div className="w-2.5 h-2.5 bg-gold-400 rounded-full animate-orb-pulse" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2.5 h-2.5 bg-gold-400 rounded-full animate-orb-pulse" style={{ animationDelay: '200ms' }}></div>
                  <div className="w-2.5 h-2.5 bg-gold-400 rounded-full animate-orb-pulse" style={{ animationDelay: '400ms' }}></div>
                </div>
                <span className="text-gold-200/60 text-sm italic">Consultando as cartas...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-bordeaux-950/80 backdrop-blur border-t border-gold-400/25 p-3 sm:p-4">
        <div className="max-w-3xl mx-auto flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Faça sua pergunta ao oráculo..."
            className="flex-1 px-4 py-2.5 bg-bordeaux-900/70 text-gold-50 border border-gold-400/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400/70 focus:border-gold-400/60 placeholder:text-gold-100/30 text-sm sm:text-base transition-colors"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="px-4 sm:px-6 py-2.5 bg-gold-400 text-bordeaux-950 rounded-lg hover:bg-gold-300 hover:shadow-gold-glow disabled:opacity-40 disabled:hover:shadow-none text-sm sm:text-base font-display font-semibold tracking-wide transition-all"
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}
