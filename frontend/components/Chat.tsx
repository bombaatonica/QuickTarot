'use client';

import { useState, useEffect, useRef } from 'react';
import Message from './Message';
import BuyQuestionButton from './BuyQuestionButton';
import { chatApi, TarotResponse } from '@/lib/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  cards?: TarotResponse['cards'];
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await chatApi.askTarotQuestion(userMessage.content);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.interpretation,
        cards: response.cards,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: error.response?.data?.detail || 'Erro ao processar pergunta. Verifique seu saldo.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-3 sm:p-4 flex justify-between items-center">
        <h1 className="text-lg sm:text-xl font-bold text-gray-800">QuickTarot</h1>
        <BuyQuestionButton />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-12 sm:mt-20">
            <p className="text-lg sm:text-xl mb-2">🔮 Bem-vindo ao QuickTarot!</p>
            <p className="text-sm sm:text-base">Faça uma pergunta e receba uma tiragem de 9 cartas interpretadas por IA.</p>
            <p className="mt-4 text-xs sm:text-sm">Cada pergunta custa R$ 1,00</p>
          </div>
        )}
        {messages.map((message) => (
          <Message key={message.id} message={message} />
        ))}
        {isLoading && (
          <div className="flex justify-start px-2 sm:px-0">
            <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm max-w-full sm:max-w-2xl lg:max-w-3xl">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 p-3 sm:p-4">
        <div className="max-w-3xl mx-auto flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua pergunta..."
            className="flex-1 px-3 sm:px-4 py-2 sm:py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-400 text-sm sm:text-base"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="px-4 sm:px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm sm:text-base font-medium"
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}
