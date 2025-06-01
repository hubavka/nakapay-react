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

**Real-time Payment Notifications:**
- `useAbly?` (boolean): Use Ably for real-time updates (recommended)
- `ablyApiKey?` (string): Ably API key for real-time connection
- `useWebhooks?` (boolean): Use WebSocket connection for real-time updates
- `webhookUrl?` (string): WebSocket server URL for webhook-based updates
- `useSSE?` (boolean): Use Server-Sent Events for real-time updates
- `pollInterval?` (number): Polling interval in ms when real-time methods unavailable (default: 2000)
- `statusEndpoint?` (string): Backend endpoint for status polling (default: '/api/payment-status')

### NakaPayModal

A payment modal component for custom implementations.

**Props:**
- `payment` (Payment, required): Payment object from your backend
- `onClose` (function, required): Called when modal is closed
- `onPaymentSuccess?` (function): Called when payment is successful
- `onPaymentError?` (function): Called when payment fails
- `useAbly?` (boolean): Use Ably for real-time updates
- `ablyApiKey?` (string): Ably API key for real-time connection
- `useWebhooks?` (boolean): Use WebSocket connection for updates
- `webhookUrl?` (string): WebSocket server URL
- `useSSE?` (boolean): Use Server-Sent Events for updates
- `pollInterval?` (number): Status polling interval in ms (default: 2000)
- `statusEndpoint?` (string): Backend endpoint for checking status (default: '/api/payment-status')

## Real-time Payment Updates

NakaPay React components support multiple methods for real-time payment status updates, with automatic fallbacks:

### 1. Ably (Recommended)

Ably provides the most reliable real-time updates using cloud infrastructure:

```tsx
<NakaPayButton
  amount={50000}
  description="Product purchase"
  useAbly={true}
  ablyApiKey="your-ably-api-key"
  onPaymentSuccess={(payment) => console.log('Success!', payment)}
/>
```

**Setup:**
1. Sign up for [Ably](https://ably.com)
2. Get your API key
3. Configure webhooks in your NakaPay dashboard to publish to Ably

### 2. WebSocket Connection

Direct WebSocket connection to your webhook server:

```tsx
<NakaPayButton
  amount={50000}
  description="Product purchase"
  useWebhooks={true}
  webhookUrl="ws://localhost:3002"
  onPaymentSuccess={(payment) => console.log('Success!', payment)}
/>
```

**Setup:**
1. Run a WebSocket server (e.g., using Socket.IO)
2. Configure NakaPay webhooks to notify your server
3. Have your server emit WebSocket events to connected clients

### 3. Server-Sent Events (SSE)

HTTP streaming for real-time updates:

```tsx
<NakaPayButton
  amount={50000}
  description="Product purchase"
  useSSE={true}
  onPaymentSuccess={(payment) => console.log('Success!', payment)}
/>
```

**Setup:**
1. Implement `/api/payments/stream` endpoint that streams SSE
2. Configure NakaPay webhooks to trigger SSE updates

### 4. Polling (Automatic Fallback)

If no real-time method is configured, components automatically fall back to polling:

```tsx
<NakaPayButton
  amount={50000}
  description="Product purchase"
  pollInterval={3000} // Check every 3 seconds
  statusEndpoint="/api/payment-status"
  onPaymentSuccess={(payment) => console.log('Success!', payment)}
/>
```

### Priority Order

The components try real-time methods in this order:
1. **Ably** (if `useAbly={true}`)
2. **WebSocket** (if `useWebhooks={true}`)
3. **Server-Sent Events** (if `useSSE={true}`)
4. **Polling** (automatic fallback)

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
