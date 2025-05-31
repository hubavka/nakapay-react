import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode.react';
import { io, Socket } from 'socket.io-client';
import { Payment } from './NakaPayButton';

export interface NakaPayModalProps {
  payment: Payment;
  onClose: () => void;
  onPaymentSuccess?: (payment: Payment) => void;
  onPaymentError?: (error: Error) => void;
  webhookUrl?: string;
  useWebhooks?: boolean;
  pollInterval?: number;
  statusEndpoint?: string;
}

export const NakaPayModal: React.FC<NakaPayModalProps> = ({
  payment,
  onClose,
  onPaymentSuccess,
  onPaymentError,
  webhookUrl,
  useWebhooks = false,
  pollInterval = 2000,
  statusEndpoint = '/api/payment-status'
}) => {
  const [currentStatus, setCurrentStatus] = useState(payment.status);
  const [timeLeft, setTimeLeft] = useState(3600); // 1 hour default
  const [copySuccess, setCopySuccess] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  // Setup WebSocket connection for webhook support
  useEffect(() => {
    if (!useWebhooks || !webhookUrl || currentStatus !== 'pending') return;

    console.log(`NakaPay: Connecting to WebSocket at ${webhookUrl}`);
    
    const socket = io(webhookUrl);
    socketRef.current = socket;
    
    socket.on('connect', () => {
      console.log('NakaPay: Connected to WebSocket server');
      setSocketConnected(true);
      
      // Join the room for this specific payment
      socket.emit('join-payment-room', payment.id);
      console.log(`NakaPay: Joined room for payment ${payment.id}`);
    });
    
    socket.on('disconnect', () => {
      console.log('NakaPay: Disconnected from WebSocket server');
      setSocketConnected(false);
    });
    
    socket.on('payment-completed', (data: {
      paymentId: string;
      status: string;
      amount: number;
      description: string;
      timestamp: string;
    }) => {
      console.log('NakaPay: Received payment-completed event:', data);
      if (data.paymentId === payment.id) {
        console.log(`NakaPay: Payment ${payment.id} completed via webhook!`);
        setCurrentStatus('completed');
        if (onPaymentSuccess) {
          onPaymentSuccess({ ...payment, status: 'completed' });
        }
      }
    });
    
    socket.on('payment-failed', (data: {
      paymentId: string;
      status: string;
      reason?: string;
    }) => {
      console.log('NakaPay: Received payment-failed event:', data);
      if (data.paymentId === payment.id) {
        console.log(`NakaPay: Payment ${payment.id} failed via webhook!`);
        setCurrentStatus('failed');
        if (onPaymentError) {
          onPaymentError(new Error(data.reason || 'Payment failed'));
        }
      }
    });
    
    socket.on('payment-expired', (data: {
      paymentId: string;
      status: string;
    }) => {
      console.log('NakaPay: Received payment-expired event:', data);
      if (data.paymentId === payment.id) {
        console.log(`NakaPay: Payment ${payment.id} expired via webhook!`);
        setCurrentStatus('expired');
        if (onPaymentError) {
          onPaymentError(new Error('Payment expired'));
        }
      }
    });
    
    return () => {
      console.log('NakaPay: Cleaning up WebSocket connection');
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [payment.id, useWebhooks, webhookUrl, currentStatus, onPaymentSuccess, onPaymentError]);

  // Fallback polling when webhooks are not used
  useEffect(() => {
    if (useWebhooks || currentStatus !== 'pending') return;

    console.log('NakaPay: Using polling for payment status (webhooks disabled)');

    const pollStatus = async () => {
      try {
        const response = await fetch(`${statusEndpoint}/${payment.id}`);
        if (response.ok) {
          const statusData = await response.json();
          setCurrentStatus(statusData.status);

          if (statusData.status === 'completed' && onPaymentSuccess) {
            onPaymentSuccess(statusData);
          } else if ((statusData.status === 'failed' || statusData.status === 'expired') && onPaymentError) {
            onPaymentError(new Error(`Payment ${statusData.status}`));
          }
        }
      } catch (error) {
        console.error('NakaPay: Error polling payment status:', error);
      }
    };

    const interval = setInterval(pollStatus, pollInterval);
    return () => clearInterval(interval);
  }, [payment.id, currentStatus, onPaymentSuccess, onPaymentError, pollInterval, statusEndpoint, useWebhooks]);

  // Countdown timer
  useEffect(() => {
    if (currentStatus !== 'pending') return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setCurrentStatus('expired');
          if (onPaymentError) {
            onPaymentError(new Error('Payment expired'));
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentStatus, onPaymentError]);

  const handleCopyInvoice = async () => {
    try {
      await navigator.clipboard.writeText(payment.invoice);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('NakaPay: Failed to copy invoice:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
    backdropFilter: 'blur(4px)'
  };

  const modalStyle: React.CSSProperties = {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '32px',
    maxWidth: '400px',
    width: '90%',
    textAlign: 'center',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    position: 'relative'
  };

  return (
    <>
      {/* Add CSS keyframes for animations */}
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}
      </style>

      <div className="nakapay-modal-overlay" style={overlayStyle} onClick={onClose}>
        <div className="nakapay-modal" style={modalStyle} onClick={e => e.stopPropagation()}>
          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer'
            }}
          >
            ×
          </button>

          {/* Header */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: '600', color: '#1a1a1a' }}>
              Lightning Payment
            </h3>
            <p style={{ margin: '0', color: '#666', fontSize: '16px' }}>
              {payment.amount} sats (~${(payment.amount * 0.0005).toFixed(2)})
            </p>
            <p style={{ margin: '8px 0 0 0', color: '#888', fontSize: '14px' }}>
              {payment.description}
            </p>
          </div>

          {currentStatus === 'pending' && (
            <>
              {/* QR Code using qrcode.react */}
              <div style={{
                margin: '24px 0',
                padding: '16px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                border: '2px solid #e2e8f0'
              }}>
                <QRCode 
                  value={payment.invoice} 
                  size={200}
                  style={{ borderRadius: '8px' }}
                />
              </div>

              {/* Invoice text */}
              <div style={{
                margin: '16px 0',
                padding: '12px',
                background: '#f5f5f5',
                borderRadius: '6px',
                fontFamily: 'monospace',
                fontSize: '10px',
                wordBreak: 'break-all',
                color: '#333',
                maxHeight: '60px',
                overflowY: 'auto'
              }}>
                {payment.invoice}
              </div>

              {/* Copy button */}
              <button
                onClick={handleCopyInvoice}
                style={{
                  width: '100%',
                  padding: '12px',
                  margin: '16px 0',
                  background: copySuccess ? '#10B981' : '#F7931A',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease'
                }}
              >
                {copySuccess ? 'Copied!' : 'Copy Invoice'}
              </button>

              {/* Status and timer */}
              <div style={{
                margin: '16px 0',
                padding: '12px',
                background: '#EBF8FF',
                border: '1px solid #BEE3F8',
                borderRadius: '6px',
                color: '#2B6CB0',
                fontSize: '14px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    background: useWebhooks && socketConnected ? '#10B981' : '#F59E0B',
                    borderRadius: '50%',
                    marginRight: '8px',
                    animation: 'pulse 2s infinite'
                  }}></div>
                  {useWebhooks ? (
                    socketConnected ? 
                      `Waiting for payment... (${formatTime(timeLeft)})` :
                      'Connecting to webhook server...'
                  ) : (
                    `Polling for payment... (${formatTime(timeLeft)})`
                  )}
                </div>
              </div>
            </>
          )}

          {currentStatus === 'completed' && (
            <div style={{
              background: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)',
              border: '2px solid #10B981',
              borderRadius: '12px',
              padding: '32px',
              margin: '16px 0',
              animation: 'fadeIn 0.5s ease-out'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
              <h3 style={{ color: '#065F46', fontSize: '24px', marginBottom: '12px' }}>
                Payment Successful!
              </h3>
              <p style={{ color: '#047857', fontSize: '16px', margin: '0' }}>
                Your payment of {payment.amount} sats has been confirmed.
              </p>
            </div>
          )}

          {(currentStatus === 'failed' || currentStatus === 'expired') && (
            <div style={{
              background: 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)',
              border: '2px solid #EF4444',
              borderRadius: '12px',
              padding: '32px',
              margin: '16px 0',
              animation: 'fadeIn 0.5s ease-out'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
              <h3 style={{ color: '#7F1D1D', fontSize: '24px', marginBottom: '12px' }}>
                Payment {currentStatus === 'failed' ? 'Failed' : 'Expired'}
              </h3>
              <p style={{ color: '#991B1B', fontSize: '16px', margin: '0' }}>
                {currentStatus === 'failed' 
                  ? 'The payment could not be completed.' 
                  : 'The payment request has expired.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
