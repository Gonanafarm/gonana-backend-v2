#!/usr/bin/env node

/**
 * Test script for Gaia Net integration with Gonana
 * Run with: node test-gaia-integration.js
 */

const axios = require('axios');

// Configuration
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const JWT_TOKEN = process.env.JWT_TOKEN || 'your_jwt_token_here';

// Test data
const testUser = {
  id: 'test_user_123',
  account_type: 'farmer',
  name: 'Test Farmer',
  location: 'Nigeria'
};

const testOrder = {
  id: 'order_123',
  status: 'pending',
  amount: 50000,
  products: [{ name: 'Cassava' }],
  shipping_address: 'Lagos, Nigeria',
  payment_method: 'WEB2'
};

async function testGaiaIntegration() {
  console.log('🧪 Testing Gaia Net Integration for Gonana\n');

  try {
    // Test 1: Health Check
    console.log('1️⃣ Testing Health Check...');
    const healthResponse = await axios.get(`${BASE_URL}/api/gaia/health`, {
      headers: { 'Authorization': `Bearer ${JWT_TOKEN}` }
    });
    console.log('✅ Health Check:', healthResponse.data);
    console.log('');

    // Test 2: OpenAI-Compatible Chat
    console.log('2️⃣ Testing OpenAI-Compatible Chat...');
    const chatResponse = await axios.post(`${BASE_URL}/api/gaia/chat/completions`, {
      model: 'gaia-gonana',
      messages: [
        { role: 'user', content: 'How does the escrow system work on Gonana?' }
      ],
      agent_type: 'farmer'
    }, {
      headers: { 
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Chat Response:', chatResponse.data.choices[0].message.content);
    console.log('');

    // Test 3: Chat Session
    console.log('3️⃣ Testing Chat Session...');
    const sessionResponse = await axios.post(`${BASE_URL}/api/gaia/chat/sessions`, {
      agentType: 'farmer',
      context: {
        userType: 'farmer',
        currentOrder: 'order_123',
        location: 'Nigeria'
      }
    }, {
      headers: { 'Authorization': `Bearer ${JWT_TOKEN}` }
    });
    const sessionId = sessionResponse.data.sessionId;
    console.log('✅ Session Created:', sessionId);

    // Send message in session
    const messageResponse = await axios.post(`${BASE_URL}/api/gaia/chat/sessions/${sessionId}/messages`, {
      message: 'How should I price my cassava?',
      agentType: 'farmer'
    }, {
      headers: { 'Authorization': `Bearer ${JWT_TOKEN}` }
    });
    console.log('✅ Message Response:', messageResponse.data.response);
    console.log('');

    // Test 4: Knowledge Base Search
    console.log('4️⃣ Testing Knowledge Base Search...');
    const searchResponse = await axios.post(`${BASE_URL}/api/gaia/knowledge-base/test-kb/search`, {
      query: 'escrow process',
      categories: ['escrow', 'payment']
    }, {
      headers: { 'Authorization': `Bearer ${JWT_TOKEN}` }
    });
    console.log('✅ Search Results:', searchResponse.data.results.length, 'items found');
    console.log('');

    // Test 5: Specialized Guidance
    console.log('5️⃣ Testing DeFi Guidance...');
    const guidanceResponse = await axios.get(`${BASE_URL}/api/gaia/guidance/defi/staking`, {
      headers: { 'Authorization': `Bearer ${JWT_TOKEN}` }
    });
    console.log('✅ DeFi Guidance:', guidanceResponse.data.guidance.substring(0, 100) + '...');
    console.log('');

    // Test 6: Domain Analytics
    console.log('6️⃣ Testing Domain Analytics...');
    try {
      const analyticsResponse = await axios.get(`${BASE_URL}/api/gaia/domains/test-domain/analytics?period=7d`, {
        headers: { 'Authorization': `Bearer ${JWT_TOKEN}` }
      });
      console.log('✅ Analytics:', analyticsResponse.data);
    } catch (error) {
      console.log('⚠️ Analytics not available (domain may not exist)');
    }
    console.log('');

    console.log('🎉 All tests completed successfully!');
    console.log('\n📊 Integration Summary:');
    console.log('✅ OpenAI-compatible API working');
    console.log('✅ Chat sessions functional');
    console.log('✅ Knowledge base search operational');
    console.log('✅ Specialized guidance available');
    console.log('✅ Health monitoring active');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check if the server is running on', BASE_URL);
    console.log('2. Verify JWT_TOKEN is valid');
    console.log('3. Ensure Gaia API key is configured');
    console.log('4. Check environment variables');
  }
}

// Mock Gaia API responses for testing without actual Gaia API
function mockGaiaResponses() {
  console.log('🔧 Setting up mock responses for testing...\n');
  
  // Mock health check
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ status: 'healthy', services: { gaia: true } })
    })
  );

  // Mock chat completion
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        choices: [{
          message: { content: 'Gonana uses a secure escrow system to protect both buyers and sellers...' }
        }]
      })
    })
  );
}

// Run tests
if (require.main === module) {
  // Check if we're in test mode
  if (process.env.NODE_ENV === 'test') {
    mockGaiaResponses();
  }
  
  testGaiaIntegration();
}

module.exports = { testGaiaIntegration }; 