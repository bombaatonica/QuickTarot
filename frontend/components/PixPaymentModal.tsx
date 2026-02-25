'use client';

import { useState, useEffect } from 'react';
import { paymentApi } from '@/lib/api';

interface PixPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (amount: number) => void;
}

export default function PixPaymentModal({
  isOpen,
  onClose,
  onPaymentSuccess,
}: PixPaymentModalProps) {
  const [amount, setAmount] = useState('10.00');
  const [transaction, setTransaction] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid' | 'expired' | null>(null);

  const createPixPayment = async () => {
    try {
      const value = parseFloat(amount);
      if (isNaN(value) || value < 2.0) {
        alert('Valor mínimo é R$ 2,00');
        return;
      }

      setIsLoading(true);
      const response = await paymentApi.createPix({ amount: value });
      setTransaction(response);
      checkPaymentStatus(response.transaction_id);
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Erro ao criar pagamento');
    } finally {
      setIsLoading(false);
    }
  };

  const checkPaymentStatus = async (transactionId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await paymentApi.checkStatus(transactionId);
        setPaymentStatus(response.status);

        if (response.status === 'paid') {
          clearInterval(interval);
          onPaymentSuccess(response.amount);
          onClose();
        } else if (response.status === 'expired') {
          clearInterval(interval);
          alert('Pagamento expirado');
          onClose();
        }
      } catch (error) {
        console.error('Erro ao verificar status:', error);
      }
    }, 5000); // Verificar a cada 5 segundos
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4">Pagar com Pix</h2>
        
        {transaction ? (
          <>
            <div className="mb-4">
              <p className="text-gray-600 mb-2">Pague com Pix e ganhe créditos instantaneamente!</p>
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <p className="font-mono text-sm text-blue-900 mb-2">Código Pix:</p>
                <p className="font-bold text-lg text-blue-900 mb-2">{transaction.pix_code}</p>
                <button 
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  onClick={() => navigator.clipboard.writeText(transaction.pix_code)}
                >
                  Copiar código
                </button>
              </div>
              <img 
                src={transaction.qr_code} 
                alt="QR Code Pix" 
                className="w-full mb-4"
              />
              <p className="text-sm text-gray-500 text-center">
                Escaneie o QR Code ou use o código acima para pagar
              </p>
            </div>

            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700">Status do pagamento:</p>
              <div className={`px-3 py-2 rounded-lg text-white text-sm font-medium ${
                paymentStatus === 'paid' ? 'bg-green-500' :
                paymentStatus === 'expired' ? 'bg-red-500' :
                'bg-yellow-500'
              }`}>
                {paymentStatus === 'paid' && 'Pago ✓'}
                {paymentStatus === 'pending' && 'Aguardando pagamento...'}
                {paymentStatus === 'expired' && 'Expirado'}
              </div>
            </div>
          </>
        ) : (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Valor (R$ mínimo R$ 2,00)
            </label>
            <input
              type="number"
              step="0.01"
              min="2"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-400"
              placeholder="10.00"
            />
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          {transaction ? (
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Fechar
            </button>
          ) : (
            <button
              onClick={createPixPayment}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              disabled={isLoading}
            >
              {isLoading ? 'Criando...' : 'Pagar com Pix'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}