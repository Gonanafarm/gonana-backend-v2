// Wallet Integration Test Script
// Run with: node test-wallet.js

const axios = require('axios');

const BASE_URL = process.env.API_URL || 'http://localhost:3000';
const JWT_TOKEN = process.env.JWT_TOKEN || 'YOUR_JWT_TOKEN_HERE';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Authorization': `Bearer ${JWT_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

async function runTests() {
  console.log('🧪 Starting Wallet Integration Tests\n');

  try {
    // Test 1: Get/Create Wallet
    console.log('1️⃣ Testing wallet creation...');
    const walletRes = await api.get('/wallet');
    console.log('✅ Wallet:', walletRes.data);
    console.log(`   Address: ${walletRes.data.address}`);
    console.log(`   Balance: ${walletRes.data.balance} BNB\n`);

    // Test 2: Get Balance
    console.log('2️⃣ Testing balance retrieval...');
    const balanceRes = await api.get('/wallet/balance');
    console.log('✅ Balance:', balanceRes.data.balance, 'BNB\n');

    // Test 3: Transfer (will fail if no balance - that's expected)
    console.log('3️⃣ Testing transfer (may fail if no balance)...');
    try {
      const transferRes = await api.post('/wallet/transfer', {
        to: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        amount: '0.001'
      });
      console.log('✅ Transfer successful:', transferRes.data.txHash, '\n');
    } catch (error) {
      if (error.response?.data?.message?.includes('Insufficient balance')) {
        console.log('⚠️  Insufficient balance (expected for new wallet)');
        console.log(`   Fund wallet at: https://testnet.binance.org/faucet-smart`);
        console.log(`   Your address: ${walletRes.data.address}\n`);
      } else {
        throw error;
      }
    }

    // Test 4: Create Escrow (will also fail if no balance)
    console.log('4️⃣ Testing escrow creation (may fail if no balance)...');
    try {
      const escrowRes = await api.post('/wallet/escrow/create', {
        seller: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        amount: '0.01'
      });
      console.log('✅ Escrow created:', escrowRes.data);
      console.log(`   Order ID: ${escrowRes.data.orderId}\n`);

      // Test 5: Get Escrow Order
      if (escrowRes.data.orderId) {
        console.log('5️⃣ Testing get escrow order...');
        const orderRes = await api.get(`/wallet/escrow/${escrowRes.data.orderId}`);
        console.log('✅ Order details:', orderRes.data, '\n');
      }
    } catch (error) {
      if (error.response?.data?.message?.includes('Insufficient balance')) {
        console.log('⚠️  Insufficient balance for escrow (expected)');
        console.log(`   Fund your wallet first\n`);
      } else if (error.response?.data?.message?.includes('not configured')) {
        console.log('⚠️  Escrow contract not configured');
        console.log('   Set ESCROW_CONTRACT_ADDRESS in .env\n');
      } else {
        throw error;
      }
    }

    console.log('\n✅ All tests completed!\n');
    console.log('Next steps:');
    console.log('1. Fund your wallet if needed');
    console.log('2. Deploy escrow contract if not done');
    console.log('3. Test full escrow flow\n');

  } catch (error) {
    console.error('\n❌ Test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Message:', error.response.data.message || error.response.data);
    } else {
      console.error(error.message);
    }
    console.error('\nTroubleshooting:');
    console.error('- Is the server running? (yarn start:dev)');
    console.error('- Is JWT_TOKEN valid?');
    console.error('- Are environment variables set?\n');
  }
}

// Usage instructions
if (process.argv.includes('--help')) {
  console.log(`
Wallet Integration Test Script

Usage:
  node test-wallet.js

Environment Variables:
  API_URL      - Base URL (default: http://localhost:3000)
  JWT_TOKEN    - Valid JWT token from login

Example:
  JWT_TOKEN=eyJhbGc... node test-wallet.js

Get JWT Token:
  1. Login via /auth/login
  2. Copy access_token
  3. Export: export JWT_TOKEN=your_token
  `);
  process.exit(0);
}

// Run tests
runTests();
