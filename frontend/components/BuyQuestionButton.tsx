'use client';

import { useState, useEffect } from 'react';
import { authApi, User } from '@/lib/api';
import PixPaymentModal from './PixPaymentModal';

interface BuyQuestionButtonProps {
  balance?: number;
  onBalanceUpdate?: (newBalance: number) => void;
}

const formatBRL = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function BuyQuestionButton({ balance: externalBalance, onBalanceUpdate }: BuyQuestionButtonProps = {}) {
  const [internalBalance, setInternalBalance] = useState<number>(0);
  const [user, setUser] = useState<User | null>(null);
  const [pixModal, setPixModal] = useState(false);

  const balance = externalBalance !== undefined ? externalBalance : internalBalance;

  useEffect(() => {
    if (externalBalance === undefined) {
      loadUser();
    }
  }, [externalBalance]);

  const loadUser = async () => {
    try {
      const userData = await authApi.getMe();
      setUser(userData);
      setInternalBalance(userData.balance);
    } catch (error) {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        setUser(userData);
        setInternalBalance(userData.balance || 0);
      }
    }
  };

  const handlePixPaymentSuccess = async () => {
    // O webhook do gateway já creditou o saldo no servidor;
    // aqui apenas recarregamos o valor atualizado.
    try {
      const userData = await authApi.getMe();
      if (onBalanceUpdate) {
        onBalanceUpdate(userData.balance);
      } else {
        setInternalBalance(userData.balance);
      }
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch {
      // Saldo será atualizado na próxima interação
    }
  };

  return (
    <>
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="text-xs sm:text-sm">
          <span className="text-gold-100/60">Saldo: </span>
          <span className="font-bold text-gold-300" data-testid="balance">{formatBRL(balance)}</span>
        </div>
        <button
          onClick={() => setPixModal(true)}
          className="px-3 sm:px-4 py-2 bg-transparent border border-gold-400/60 text-gold-300 rounded-lg hover:bg-gold-400 hover:text-bordeaux-950 hover:shadow-gold-glow text-xs sm:text-sm font-display font-semibold tracking-wide transition-all"
        >
          Adicionar Crédito
        </button>
      </div>

      <PixPaymentModal
        isOpen={pixModal}
        onClose={() => setPixModal(false)}
        onPaymentSuccess={handlePixPaymentSuccess}
      />
    </>
  );
}
