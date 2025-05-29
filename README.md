# NakaPay React Components

React components for integrating Bitcoin Lightning payments with NakaPay.

## Installation

```bash
npm install nakapay-react
# or
yarn add nakapay-react
```

## Quick Start

### 1. Set up your backend

First, ensure your backend has endpoints to create payments and check status using the `nakapay-sdk`:

```javascript
// Backend example (Express.js)
const express = require('express');
const { NakaPay } = require('nakapay-sdk');

const app = express();
const nakaPay = new NakaPay(process.env.NAKAPAY_API_KEY);

app.post('/api/create-payment', async (req, res) => {
  try {
    const payment = await nakaPay.createPaymentRequest(req.body);
    res.json(payment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/payment-status/:id', async (req, res) => {
  try {
    const status = await nakaPay.getPaymentStatus(req.params.id);
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 2. Use React components

```tsx
import React from 'react';
import { NakaPayButton } from 'nakapay-react';

function CheckoutPage() {
  return (
    <div>
      <h2>Complete Your Purchase</h2>
      <NakaPayButton
        amount={50000} // Amount in satoshis
        description="Product purchase"
        onPaymentSuccess={(payment) => {
          console.log('Payment successful!', payment);
          // Redirect to success page or update UI
        }}
        onPaymentError={(error) => {
          console.error('Payment failed:', error);
          // Handle error
        }}
      />
    </div>
  );
}
```

## Components

### NakaPayButton

A complete payment button that handles the entire payment flow.

**Props:**
- `amount` (number, required): Payment amount in satoshis
- `description` (string, required): Payment description
- `metadata?` (object): Additional metadata for the payment
- `text?` (string): Custom button text (defaults to "Pay {amount} sats")
- `className?` (string): Additional CSS classes
- `style?` (CSSProperties): Custom styles
- `disabled?` (boolean): Disable the button
- `apiEndpoint?` (string): Backend endpoint for creating payments (default: '/api/create-payment')
- `onPaymentCreated?` (function): Called when payment is created
- `onPaymentSuccess?` (function): Called when payment is successful
- `onPaymentError?` (function): Called when payment fails

### NakaPayModal

A payment modal component for custom implementations.

**Props:**
- `payment` (Payment, required): Payment object from your backend
- `onClose` (function, required): Called when modal is closed
- `onPaymentSuccess?` (function): Called when payment is successful
- `onPaymentError?` (function): Called when payment fails
- `pollInterval?` (number): Status polling interval in ms (default: 2000)
- `statusEndpoint?` (string): Backend endpoint for checking status (default: '/api/payment-status')

## Advanced Usage

### Custom Payment Flow

```tsx
import React, { useState } from 'react';
import { NakaPayModal, Payment } from 'nakapay-react';

function CustomCheckout() {
  const [showModal, setShowModal] = useState(false);
  const [payment, setPayment] = useState<Payment | null>(null);

  const handleCustomPayment = async () => {
    try {
      const response = await fetch('/api/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 25000,
          description: 'Custom payment',
          metadata: { orderId: '12345' }
        })
      });
      
      const paymentData = await response.json();
      setPayment(paymentData);
      setShowModal(true);
    } catch (error) {
      console.error('Failed to create payment:', error);
    }
  };

  return (
    <div>
      <button onClick={handleCustomPayment}>
        Custom Pay Button
      </button>
      
      {showModal && payment && (
        <NakaPayModal
          payment={payment}
          onClose={() => setShowModal(false)}
          onPaymentSuccess={(payment) => {
            console.log('Success!', payment);
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
}
```

## Styling

Import the default styles:

```tsx
import 'nakapay-react/dist/styles.css';
```

Or provide your own custom styles using the provided CSS classes:
- `.nakapay-button` - Button component
- `.nakapay-modal-overlay` - Modal overlay
- `.nakapay-modal` - Modal content

## TypeScript Support

This package includes TypeScript definitions. All components are fully typed.

## License

MIT
