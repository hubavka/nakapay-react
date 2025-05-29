import React from 'react';
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
}
export declare const NakaPayButton: React.FC<NakaPayButtonProps>;
