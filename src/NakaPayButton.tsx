import React, { useState, useEffect } from 'react';
import { NakaPayModal } from './NakaPayModal';

export interface Payment {
  id: string;
  amount: number;
  description: string;
  invoice: string;
  status: 'pending' | 'completed' | 'failed' | 'expired';
  metadata?: Record<string, any>;
}

export interface NakaPayButtonProps {
  amount: number;
  description: string;
  metadata?: Record<string, any>;
  apiEndpoint?: string;
  text?: string;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
  onPaymentCreated?: (payment: Payment) => void;
  onPaymentSuccess?: (payment: Payment) => void;
  onPaymentError?: (error: Error) => void;
  // Webhook support options
  webhookUrl?: string;
  useWebhooks?: boolean;
  useSSE?: boolean; // Server-Sent Events support for Vercel
  useAbly?: boolean; // New: Ably real-time support
  ablyApiKey?: string; // Ably API key
  pollInterval?: number;
  statusEndpoint?: string;
}

export const NakaPayButton: React.FC<NakaPayButtonProps> = ({
  amount,
  description,
  metadata,
  apiEndpoint = '/api/create-payment',
  text,
  className = '',
  style = {},
  disabled = false,
  onPaymentCreated,
  onPaymentSuccess,
  onPaymentError,
  webhookUrl,
  useWebhooks = false,
  useSSE = false,
  useAbly = false,
  ablyApiKey,
  pollInterval = 2000,
  statusEndpoint = '/api/payment-status'
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [payment, setPayment] = useState<Payment | null>(null);

  const handleClick = async () => {
    if (disabled || isLoading) return;

    setIsLoading(true);
    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          description,
          metadata
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create payment');
      }

      const paymentData = await response.json();
      setPayment(paymentData);
      setShowModal(true);

      if (onPaymentCreated) {
        onPaymentCreated(paymentData);
      }
    } catch (error) {
      console.error('NakaPay: Payment creation failed:', error);
      if (onPaymentError && error instanceof Error) {
        onPaymentError(error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const defaultStyle: React.CSSProperties = {
    padding: '12px 24px',
    backgroundColor: '#F7931A',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
    opacity: disabled || isLoading ? 0.6 : 1,
    transition: 'all 0.2s ease',
    fontSize: '16px',
    ...style
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={disabled || isLoading}
        className={`nakapay-button ${className}`}
        style={defaultStyle}
      >
        {isLoading ? 'Creating Payment...' : text || `Pay ${amount} sats`}
      </button>

      {showModal && payment && (
        <NakaPayModal
          payment={payment}
          onClose={() => setShowModal(false)}
          onPaymentSuccess={onPaymentSuccess}
          onPaymentError={onPaymentError}
          webhookUrl={webhookUrl}
          useWebhooks={useWebhooks}
          useSSE={useSSE}
          useAbly={useAbly}
          ablyApiKey={ablyApiKey}
          pollInterval={pollInterval}
          statusEndpoint={statusEndpoint}
        />
      )}
    </>
  );
};