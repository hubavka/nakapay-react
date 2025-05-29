import React from 'react';
import { Payment } from './NakaPayButton';
export interface NakaPayModalProps {
    payment: Payment;
    onClose: () => void;
    onPaymentSuccess?: (payment: Payment) => void;
    onPaymentError?: (error: Error) => void;
    pollInterval?: number;
    statusEndpoint?: string;
}
export declare const NakaPayModal: React.FC<NakaPayModalProps>;
