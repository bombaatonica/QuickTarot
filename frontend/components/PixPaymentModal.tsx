'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { paymentApi } from '@/lib/api';

interface PixPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: () => void;
}

const POLL_INTERVAL_MS = 5000;
const POLL_TIMEOUT_MS = 10 * 60 * 1000; // 10 min: para de consultar e marca como expirado

export default function PixPaymentModal({
  isOpen,
  onClose,
  onPaymentSuccess,
}: PixPaymentModalProps) {
  const [amount, setAmount] = useState('10.00');
  const [transaction, setTransaction] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid' | 'expired' | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  // Limpa polling ao desmontar ou fechar o modal
  useEffect(() => {
    if (!isOpen) {
      stopPolling();
      setTransaction(null);
      setPaymentStatus(null);
      setErrorMessage(null);
      setCopied(false);
    }
    return stopPolling;
  }, [isOpen, stopPolling]);

  const createPixPayment = async () => {
    const value = parseFloat(amount);
    if (isNaN(value) || value < 2.0) {
      setErrorMessage('Valor mínimo é R$ 2,00');
      return;
    }

    try {
      setErrorMessage(null);
      setIsLoading(true);
      const response = await paymentApi.createPix({ amount: value });
      setTransaction(response);
      setPaymentStatus('pending');
      startPolling(response.transaction_id);
    } catch (error: any) {
      const data = error.response?.data;
      setErrorMessage(data?.detail || data?.error || data?.provider_response?.message || 'Erro ao criar pagamento');
    } finally {
      setIsLoading(false);
    }
  };

  const startPolling = (transactionId: string) => {
    stopPolling();
    const startedAt = Date.now();

    pollRef.current = setInterval(async () => {
      if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
        stopPolling();
        setPaymentStatus('expired');
        return;
      }
      try {
        const response = await paymentApi.checkStatus(transactionId);
        setPaymentStatus(response.status);

        if (response.status === 'paid') {
          stopPolling();
          onPaymentSuccess();
          onClose();
        } else if (response.status === 'expired') {
          stopPolling();
        }
      } catch {
        // Erro transitório de rede: tenta de novo no próximo tick
      }
    }, POLL_INTERVAL_MS);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4">Pagar com Pix</h2>
        
        {transaction ? (
          <>
            <div className="mb-4">
              <p className="text-gray-600 mb-4 text-center">Pague com Pix e ganhe créditos instantaneamente!</p>
              
              <div className="mb-4">
                <img 
                  src={transaction.qr_code.startsWith('data:') ? transaction.qr_code : `data:image/png;base64,${transaction.qr_code}`}
                  alt="QR Code Pix" 
                  className="mx-auto block w-48 h-48 mb-2 border rounded-lg"
                />
                <p className="text-sm text-gray-500 text-center mb-4">
                  Escaneie o QR Code acima para pagar
                </p>
              </div>

              <div className="mb-4">
                <p className="font-mono text-sm text-gray-700 mb-2">Ou copie o código Pix:</p>
                <div className="bg-gray-100 p-3 rounded-lg mb-2">
                  <p className="break-words font-mono text-sm text-gray-900">{transaction.pix_code}</p>
                </div>
                <button 
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                  onClick={() => {
                    navigator.clipboard.writeText(transaction.pix_code);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                >
                  {copied ? 'Copiado ✓' : 'Copiar código'}
                </button>
              </div>
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

        {errorMessage && (
          <p role="alert" className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {errorMessage}
          </p>
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