'use client';


import { useState, useEffect } from 'react';
import { paymentApi, authApi, User } from '@/lib/api';
import PixPaymentModal from './PixPaymentModal';

interface BuyQuestionButtonProps {
  balance?: number;
  onBalanceUpdate?: (newBalance: number) => void;
}

export default function BuyQuestionButton({ balance: externalBalance, onBalanceUpdate }: BuyQuestionButtonProps = {}) {

const [internalBalance, setInternalBalance] = useState<number>(0);
  const [user, setUser] = useState<User | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [pixModal, setPixModal] = useState(false);
  const [amount, setAmount] = useState('10.00');

  // Usar balance externo se fornecido, senão usar interno
  const balance = externalBalance !== undefined ? externalBalance : internalBalance;

  useEffect(() => {
    // Só carregar se não tiver balance externo
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
      // Usuário não autenticado
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        setUser(userData);
        setInternalBalance(userData.balance || 0);
      }
    }
  };

  const handleAddCredit = () => {
    setShowModal(false);
    setPixModal(true);
  };

  const handlePixPaymentSuccess = async (amount: number) => {
    const newBalance = await paymentApi.addCredit(amount);
    
    // Usar callback externo se disponível, senão usar estado interno
    if (onBalanceUpdate) {
      onBalanceUpdate(newBalance);
    } else {
      setInternalBalance(newBalance);
    }
    
    if (user) {
      user.balance = newBalance;
      setUser(user);
      localStorage.setItem('user', JSON.stringify(user));
    }
  };


return (
    <>
      <div className="flex items-center gap-4">
        <div className="text-sm">
          <span className="text-gray-600">Saldo: </span>
          <span className="font-bold text-purple-600">R$ {balance.toFixed(2)}</span>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
        >
          Adicionar Crédito
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Adicionar Crédito</h2>
            <p className="text-gray-600 mb-4">
              Cada pergunta custa R$ 1,00. Adicione crédito para continuar usando o serviço.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor (R$ mínimo R$ 2,00)
              </label>
              <input
                type="number"
                step="0.01"
                min="2"
                value="10.00"
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-400"
                placeholder="10.00"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddCredit}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}

      <PixPaymentModal
        isOpen={pixModal}
        onClose={() => setPixModal(false)}
        onPaymentSuccess={handlePixPaymentSuccess}
      />
    </>
  );
}
