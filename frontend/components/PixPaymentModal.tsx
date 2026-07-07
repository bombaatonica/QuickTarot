'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
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

  // Portal: o modal é renderizado dentro do header (que tem backdrop-blur e
  // vira containing block/stacking context) — sem portal ele ficaria por
  // baixo do conteúdo da página.
  return createPortal(
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-bordeaux-900/95 border border-gold-400/30 rounded-2xl shadow-gold-glow p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <h2 className="font-display text-xl font-bold text-gold-400 mb-4">
          <span aria-hidden="true" className="mr-2">✦</span>Pagar com Pix
        </h2>

        {transaction ? (
          <>
            <div className="mb-4">
              <p className="text-gold-100/70 mb-4 text-center text-sm">
                Pague com Pix e seus créditos entram assim que o pagamento for confirmado.
              </p>

              <div className="mb-4">
                <img
                  src={transaction.qr_code.startsWith('data:') ? transaction.qr_code : `data:image/png;base64,${transaction.qr_code}`}
                  alt="QR Code Pix"
                  width={192}
                  height={192}
                  className="mx-auto block w-48 h-48 mb-2 border-2 border-gold-400/50 rounded-lg bg-white p-1"
                />
                <p className="text-xs text-gold-100/50 text-center mb-4">
                  Escaneie o QR Code acima para pagar
                </p>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gold-200/80 mb-2">Ou copie o código Pix:</p>
                <div className="bg-bordeaux-950/80 border border-gold-400/20 p-3 rounded-lg mb-2 max-h-24 overflow-y-auto">
                  <p className="break-all font-mono text-xs text-gold-100/80">{transaction.pix_code}</p>
                </div>
                <button
                  className="px-4 py-2 bg-transparent border border-gold-400/60 text-gold-300 text-sm rounded-lg hover:bg-gold-400 hover:text-bordeaux-950 transition-all font-medium"
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
              <p className="text-sm font-medium text-gold-200/80 mb-1.5">Status do pagamento:</p>
              <div
                className={`px-3 py-2 rounded-lg text-sm font-medium border ${
                  paymentStatus === 'paid'
                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-400/40'
                    : paymentStatus === 'expired'
                      ? 'bg-red-950/60 text-red-300 border-red-400/40'
                      : 'bg-gold-900/40 text-gold-300 border-gold-400/40'
                }`}
              >
                {paymentStatus === 'paid' && 'Pago ✓'}
                {(paymentStatus === 'pending' || paymentStatus === null) && 'Aguardando pagamento...'}
                {paymentStatus === 'expired' && 'Expirado — gere uma nova cobrança'}
              </div>
            </div>
          </>
        ) : (
          <div className="mb-4">
            <p className="text-gold-100/60 text-sm mb-4">
              Cada consulta custa R$ 1,00. Adicione crédito para consultar o oráculo.
            </p>
            <label htmlFor="pix-amount" className="block text-sm font-medium text-gold-200/80 mb-2">
              Valor (mínimo R$ 2,00)
            </label>
            <input
              id="pix-amount"
              type="number"
              step="0.01"
              min="2"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-2.5 bg-bordeaux-950/70 text-gold-50 border border-gold-400/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400/70 focus:border-gold-400/60 placeholder:text-gold-100/30 transition-colors"
              placeholder="10.00"
            />
          </div>
        )}

        {errorMessage && (
          <p role="alert" className="mb-4 text-sm text-red-300 bg-red-950/50 border border-red-400/30 rounded-lg px-3 py-2">
            {errorMessage}
          </p>
        )}

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gold-400/30 text-gold-200/80 rounded-lg hover:bg-bordeaux-800 transition-colors"
          >
            {transaction ? 'Fechar' : 'Cancelar'}
          </button>
          {!transaction && (
            <button
              onClick={createPixPayment}
              className="flex-1 px-4 py-2.5 bg-gold-400 text-bordeaux-950 rounded-lg hover:bg-gold-300 hover:shadow-gold-glow disabled:opacity-50 font-display font-semibold tracking-wide transition-all"
              disabled={isLoading}
            >
              {isLoading ? 'Criando...' : 'Pagar com Pix'}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
