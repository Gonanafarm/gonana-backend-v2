# Frontend Integration Guide: Binance Wallet & Escrow

This guide details how to integrate the Gonana Backpack (Backend) Wallet and Escrow features into the frontend application.

## 🛠 Prerequisites

*   **Auth**: All endpoints require a valid JWT Bearer token in the `Authorization` header.
*   **HTTP Client**: Examples use `axios`, but `fetch` works too.
*   **Network**: The backend connects to **Binance Smart Chain (Testnet)**.

---

## 1. 👛 Wallet Management

### Get or Create Wallet
On user login or profile view, fetch their wallet details. If a wallet doesn't exist, the backend auto-creates one.

*   **Endpoint**: `GET /api/wallet`
*   **Response**:
    ```json
    {
      "address": "0xABC...123",
      "balance": "1.5",       // BNB
      "escrowBalance": "0"
    }
    ```

### Check Balance
You can poll this endpoint or call it before money-sensitive actions.

*   **Endpoint**: `GET /api/wallet/balance`
*   **Response**: `{ "balance": "1.5" }`

### Send BNB (Transfer)
Allow users to withdraw funds or send to others.

*   **Endpoint**: `POST /api/wallet/transfer`
*   **Payload**:
    ```json
    {
      "to": "0xRecipientAddress...",
      "amount": "0.1"
    }
    ```

---

## 2. 🤝 Escrow Flow

### Step A: Create Order (Buyer)
When a buyer initiates a purchase.

> **⚠️ Important UI Note**: This request waits for Blockchain confirmation (approx. 3-10 seconds). Show a **loading spinner** and do **not** let the user close the window.

*   **Endpoint**: `POST /api/wallet/escrow/create`
*   **Payload**:
    ```json
    {
      "seller": "0xSellerAddress...",
      "amount": "0.5" // BNB Amount
    }
    ```
*   **Response**:
    ```json
    {
      "txHash": "0x123...",
      "orderId": "1", // Save this Order ID!
      "status": "created"
    }
    ```

### Step B: Mark as Shipped (Seller)
Seller marks the item as sent.

*   **Endpoint**: `POST /api/wallet/escrow/mark-shipped`
*   **Payload**: `{ "orderId": "1" }`
*   **Response**: `{ "status": "shipped" }`

### Step C: Confirm Delivery (Buyer)
Buyer confirms receipt. This releases funds to the Seller.

*   **Endpoint**: `POST /api/wallet/escrow/confirm-delivery`
*   **Payload**: `{ "orderId": "1" }`
*   **Response**: `{ "status": "completed" }`

### Step D: Refund (Seller)
If the deal is cancelled/disputed, Seller can refund the Buyer.

*   **Endpoint**: `POST /api/wallet/escrow/refund`
*   **Payload**: `{ "orderId": "1" }`

---

## 3. 📋 Viewing Order List
To show all orders for the logged-in user (buyer).

*   **Endpoint**: `GET /api/wallet/escrow/orders`
*   **Response**:
    ```json
    [
      {
        "orderId": "1",
        "buyer": "0x...",
        "seller": "0x...",
        "amount": "0.5",
        "status": "CREATED",
        "createdAt": "...",
        "txHash": "0x..."
      }
    ]
    ```

## 4. 🔍 Viewing Order Details
To show the current status of a single transaction.

*   **Endpoint**: `GET /api/wallet/escrow/:orderId`
*   **Response**:
    ```json
    {
      "orderId": "1",
      "buyer": "0x...",
      "seller": "0x...",
      "amount": "0.5",
      "status": "SHIPPED", // PENDING, SHIPPED, COMPLETED, REFUNDED
      "createdAt": "2023-10-25T10:00:00.000Z",
      "shippedAt": "2023-10-26T12:00:00.000Z" // null if not shipped
    }
    ```

---

## 🧩 UI/UX Implementation Advice

### 1. Handling Latency
Since the backend waits for `tx.wait()`, API calls can take time.
*   **Do**: Show "Processing Transaction..." with a spinner.
*   **Do**: Disable the submit button to prevent double-clicks.
*   **Don't**: Use a short timeout on your HTTP client (set timeout to > 60s).

### 2. Error Handling
Handle the following specific HTTP 400 errors:
*   `"Insufficient balance"`: Prompt user to deposit funds.
*   `"Escrow contract not configured"`: Server-side issue, contact support.

### 3. Gas Fees
Ideally, warn users that a small amount of BNB is needed for gas fees for *every* action (Creating, Shipping, Confirming).

### Example Service Code (React/Axios)

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  timeout: 60000, // Important: Long timeout for Blockchain
});

export const createEscrow = async (sellerAddress, amount) => {
  try {
    const response = await api.post('/wallet/escrow/create', {
      seller: sellerAddress,
      amount: amount.toString()
    });
    return response.data;
  } catch (error) {
    if (error.response?.data?.message === 'Insufficient balance') {
      alert("Please top up your wallet with BNB + Gas fees");
    }
    throw error;
  }
};
```
