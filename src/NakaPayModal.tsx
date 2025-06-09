import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode.react';
import { io, Socket } from 'socket.io-client';
import Ably from 'ably';
import { Payment } from './NakaPayButton';

export interface NakaPayModalProps {
  payment: Payment;
  onClose: () => void;
  onPaymentSuccess?: (payment: Payment) => void;
  onPaymentError?: (error: Error) => void;
  webhookUrl?: string;
  useWebhooks?: boolean;
  useSSE?: boolean;
  useAbly?: boolean; // New: Ably support
  ablyApiKey?: string; // Not recommended for client-side
  ablyAuthUrl?: string; // Recommended: secure token authentication
  ablyAuthMethod?: 'GET' | 'POST';
  ablyAuthHeaders?: Record<string, string>;
  ablyAuthParams?: Record<string, any>;
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
  useSSE = false,
  useAbly = false,
  ablyApiKey,
  ablyAuthUrl,
  ablyAuthMethod = 'POST',
  ablyAuthHeaders = { 'Content-Type': 'application/json' },
  ablyAuthParams,
  pollInterval = 2000,
  statusEndpoint = '/api/payment-status'
}) => {
  const [currentStatus, setCurrentStatus] = useState(payment.status);
  const [timeLeft, setTimeLeft] = useState(3600);
  const [copySuccess, setCopySuccess] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [sseConnected, setSSEConnected] = useState(false);
  const [ablyConnected, setAblyConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const ablyRef = useRef<Ably.Realtime | null>(null);

  // Setup Ably connection for real-time updates
  useEffect(() => {
    if (!useAbly || currentStatus !== 'pending') return;
    
    // Check if we have either API key or auth URL
    if (!ablyApiKey && !ablyAuthUrl) {
      console.warn('Ably enabled but no authentication method provided');
      return;
    }

    let ably: Ably.Realtime;
    
    if (ablyAuthUrl) {
      // Use secure token authentication (recommended)
      ably = new Ably.Realtime({
        authUrl: ablyAuthUrl,
        authMethod: ablyAuthMethod,
        authHeaders: ablyAuthHeaders,
        authParams: {
          paymentId: payment.id,
          ...ablyAuthParams
        }
      });
    } else {
      // Fallback to API key (not recommended for client-side)
      console.warn('Using Ably API key directly in client-side code is not recommended. Use ablyAuthUrl instead.');
      ably = new Ably.Realtime(ablyApiKey!);
    }
    
    ablyRef.current = ably;
    
    ably.connection.on('connected', () => {
      setAblyConnected(true);
    });
    
    ably.connection.on('disconnected', () => {
      setAblyConnected(false);
    });
    
    const channel = ably.channels.get(`payment-${payment.id}`);
    
    // Subscribe to payment-success event (sent by business webhooks)
    channel.subscribe('payment-success', (message) => {
      const data = message.data;
      if (data.paymentId === payment.id) {
        if (data.event === 'payment.completed') {
          setCurrentStatus('completed');
          if (onPaymentSuccess) {
            onPaymentSuccess({ ...payment, status: 'completed' });
          }
          // Auto-close modal after 3 seconds
          setTimeout(() => {
            onClose();
          }, 3000);
        } else if (data.event === 'payment.failed') {
          setCurrentStatus('failed');
          if (onPaymentError) {
            onPaymentError(new Error(data.reason || 'Payment failed'));
          }
        } else if (data.event === 'payment.expired') {
          setCurrentStatus('expired');
          if (onPaymentError) {
            onPaymentError(new Error('Payment expired'));
          }
        }
      }
    });
    
    return () => {
      if (ablyRef.current) {
        ablyRef.current.connection.close();
        ablyRef.current = null;
      }
    };
  }, [payment.id, useAbly, ablyApiKey, currentStatus, onPaymentSuccess, onPaymentError]);
  // Fallback: WebSocket connection for non-Vercel environments  
  useEffect(() => {
    if (!useWebhooks || useAbly || useSSE || !webhookUrl || currentStatus !== 'pending') return;

    const socket = io(webhookUrl);
    socketRef.current = socket;
    
    socket.on('connect', () => {
      setSocketConnected(true);
      socket.emit('join-payment-room', payment.id);
    });
    
    socket.on('disconnect', () => setSocketConnected(false));
    
    socket.on('payment-completed', (data: any) => {
      if (data.paymentId === payment.id) {
        setCurrentStatus('completed');
        if (onPaymentSuccess) onPaymentSuccess({ ...payment, status: 'completed' });
        // Auto-close modal after 3 seconds
        setTimeout(() => {
          onClose();
        }, 3000);
      }
    });
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [payment.id, useWebhooks, useAbly, useSSE, webhookUrl, currentStatus]);

  // Fallback: Server-Sent Events
  useEffect(() => {
    if (!useSSE || useAbly || currentStatus !== 'pending') return;

    const eventSource = new EventSource(`/api/payments/stream?paymentId=${payment.id}`);
    eventSourceRef.current = eventSource;
    
    eventSource.onopen = () => setSSEConnected(true);
    eventSource.onerror = () => setSSEConnected(false);
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'payment-update' && data.paymentId === payment.id) {
          if (data.event === 'payment.completed') {
            setCurrentStatus('completed');
            if (onPaymentSuccess) onPaymentSuccess({ ...payment, status: 'completed' });
            // Auto-close modal after 3 seconds
            setTimeout(() => {
              onClose();
            }, 3000);
          }
        }
      } catch (error) {
        console.error('SSE parsing error:', error);
      }
    };
    
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [payment.id, useSSE, useAbly, currentStatus]);

  // Final fallback: Polling
  useEffect(() => {
    if (useWebhooks || useSSE || useAbly || currentStatus !== 'pending') return;

    const pollStatus = async () => {
      try {
        const response = await fetch(`${statusEndpoint}/${payment.id}`);
        if (response.ok) {
          const statusData = await response.json();
          setCurrentStatus(statusData.status);
          if (statusData.status === 'completed' && onPaymentSuccess) {
            onPaymentSuccess(statusData);
            // Auto-close modal after 3 seconds
            setTimeout(() => {
              onClose();
            }, 3000);
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    };

    const interval = setInterval(pollStatus, pollInterval);
    return () => clearInterval(interval);
  }, [payment.id, currentStatus, useWebhooks, useSSE, useAbly]);
  // Countdown timer
  useEffect(() => {
    if (currentStatus !== 'pending') return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setCurrentStatus('expired');
          if (onPaymentError) onPaymentError(new Error('Payment expired'));
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
      console.error('Copy failed:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const overlayStyle: React.CSSProperties = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', zIndex: 10000, backdropFilter: 'blur(4px)'
  };

  const modalStyle: React.CSSProperties = {
    backgroundColor: 'white', borderRadius: '12px', padding: '32px',
    maxWidth: '400px', width: '90%', textAlign: 'center',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)', position: 'relative'
  };

  return (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
      
      <div className="nakapay-modal-overlay" style={overlayStyle} onClick={onClose}>
        <div className="nakapay-modal" style={modalStyle} onClick={e => e.stopPropagation()}>
          <button onClick={onClose} style={{
            position: 'absolute', top: '16px', right: '16px', background: 'none',
            border: 'none', fontSize: '24px', cursor: 'pointer', color: '#666'
          }}>×</button>

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
              <div style={{
                margin: '24px 0', padding: '16px', borderRadius: '8px',
                background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                border: '2px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                {(() => {
                  try {
                    return <QRCode value={payment.invoice} size={200} style={{ borderRadius: '8px' }} />;
                  } catch (error) {
                    console.error('QR Code generation failed:', error);
                    // Fallback: show invoice text with instruction to copy
                    return (
                      <div style={{ 
                        padding: '20px', 
                        textAlign: 'center',
                        background: '#f0f0f0',
                        borderRadius: '8px',
                        width: '100%'
                      }}>
                        <div style={{ marginBottom: '10px', fontSize: '14px', color: '#666' }}>
                          QR code unavailable - copy invoice below
                        </div>
                        <div style={{ 
                          fontSize: '12px', 
                          fontFamily: 'monospace', 
                          wordBreak: 'break-all',
                          background: 'white',
                          padding: '10px',
                          borderRadius: '4px',
                          border: '1px solid #ddd'
                        }}>
                          {payment.invoice}
                        </div>
                      </div>
                    );
                  }
                })()}
              </div>

              <div style={{
                margin: '16px 0', padding: '12px', background: '#f5f5f5', borderRadius: '6px',
                fontFamily: 'monospace', fontSize: '10px', wordBreak: 'break-all',
                color: '#333', maxHeight: '60px', overflowY: 'auto'
              }}>
                {payment.invoice}
              </div>

              <button onClick={handleCopyInvoice} style={{
                width: '100%', padding: '12px', margin: '16px 0',
                background: copySuccess ? '#10B981' : '#F7931A', color: 'white',
                border: 'none', borderRadius: '6px', fontWeight: '600',
                cursor: 'pointer', transition: 'background 0.2s ease'
              }}>
                {copySuccess ? 'Copied!' : 'Copy Invoice'}
              </button>

              <div style={{
                margin: '16px 0', padding: '12px', background: '#EBF8FF',
                border: '1px solid #BEE3F8', borderRadius: '6px', color: '#2B6CB0', fontSize: '14px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{
                    width: '8px', height: '8px', borderRadius: '50%', marginRight: '8px',
                    background: ablyConnected ? '#10B981' : socketConnected ? '#10B981' : sseConnected ? '#10B981' : '#F59E0B',
                    animation: 'pulse 2s infinite'
                  }}></div>
                  {useAbly ? (
                    ablyConnected ? `⚡ Real-time connected (${formatTime(timeLeft)})` : 'Connecting to Ably...'
                  ) : useWebhooks ? (
                    socketConnected ? `Waiting for payment... (${formatTime(timeLeft)})` : 'Connecting...'
                  ) : useSSE ? (
                    sseConnected ? `Waiting for payment... (${formatTime(timeLeft)})` : 'Connecting...'
                  ) : `Checking payment... (${formatTime(timeLeft)})`}
                </div>
              </div>
            </>
          )}

          {currentStatus === 'completed' && (
            <div style={{
              background: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)',
              border: '2px solid #10B981', borderRadius: '12px', padding: '32px',
              margin: '16px 0', animation: 'fadeIn 0.5s ease-out'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
              <h3 style={{ color: '#065F46', fontSize: '24px', marginBottom: '12px' }}>Payment Successful!</h3>
              <p style={{ color: '#047857', fontSize: '16px', margin: '0' }}>
                Your payment of {payment.amount} sats has been confirmed.
              </p>
              <p style={{ color: '#047857', fontSize: '14px', margin: '12px 0 0 0', opacity: 0.8 }}>
                This modal will close automatically in 3 seconds...
              </p>
            </div>
          )}

          {(currentStatus === 'failed' || currentStatus === 'expired') && (
            <div style={{
              background: 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)',
              border: '2px solid #EF4444', borderRadius: '12px', padding: '32px',
              margin: '16px 0', animation: 'fadeIn 0.5s ease-out'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
              <h3 style={{ color: '#7F1D1D', fontSize: '24px', marginBottom: '12px' }}>
                Payment {currentStatus === 'failed' ? 'Failed' : 'Expired'}
              </h3>
              <p style={{ color: '#991B1B', fontSize: '16px', margin: '0' }}>
                {currentStatus === 'failed' ? 'The payment could not be completed.' : 'The payment request has expired.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
