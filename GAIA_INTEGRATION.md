# Gaia Net Integration for Gonana

This document outlines the comprehensive integration of Gaia Net AI services with the Gonana agricultural marketplace platform.

## 🚀 Core Features Implemented

### 1️⃣ AI Chatbot Support
- **Real-time AI assistance** for farmers and traders
- **Specialized agents** for different user types (farmer, trader, DeFi, logistics)
- **Context-aware responses** based on user actions and platform state
- **Session management** with conversation history

### 2️⃣ Custom Knowledge Base
- **Gonana-specific documentation** loaded into Gaia
- **Escrow rules and processes** for secure transactions
- **Crop management tips** for farmers
- **Payment flow guidance** for all users
- **Logistics and shipping** information

### 3️⃣ Gonana AI Domain
- **Branded domain**: `ai.gonana.farm`
- **Load balancing** for high availability
- **Custom branding** with Gonana colors and theme
- **Agent orchestration** and management

### 4️⃣ OpenAI-Compatible API
- **Seamless integration** with existing apps
- **Minimal code changes** required
- **Drop-in replacement** for OpenAI API
- **Enhanced features** with Gaia-specific capabilities

### 5️⃣ DeFi & Marketplace Guidance
- **Staking explanations** and guidance
- **Escrow smart contract** education
- **Cross-border trade** assistance
- **Payment method** guidance

## 📋 Setup Instructions

### Environment Variables

Add these to your `.env` file:

```bash
# Gaia Net Configuration
GAIA_BASE_URL=https://api.gaianet.ai
GAIA_API_KEY=your_gaia_api_key_here
GAIA_DOMAIN=ai.gonana.farm
GAIA_KNOWLEDGE_BASE_ID=your_knowledge_base_id

# Optional: Custom Gaia settings
GAIA_MODEL=gaia-gonana
GAIA_MAX_TOKENS=2048
GAIA_TEMPERATURE=0.7
```

### Installation

1. **Install dependencies** (already included in package.json):
```bash
npm install @nestjs/axios rxjs
```

2. **Initialize Gaia integration**:
```bash
# The Gaia module will be automatically loaded
# Run your NestJS application
npm run start:dev
```

3. **Initialize knowledge base and domain**:
```bash
# Make a POST request to initialize
curl -X POST http://localhost:3000/api/gaia/knowledge-base/initialize \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🔌 API Endpoints

### OpenAI-Compatible Chat Completion

```bash
POST /api/gaia/chat/completions
```

**Request:**
```json
{
  "model": "gaia-gonana",
  "messages": [
    {
      "role": "user",
      "content": "How does the escrow system work?"
    }
  ],
  "agent_type": "farmer",
  "context": "User is asking about payment security"
}
```

**Response:**
```json
{
  "id": "chatcmpl-1234567890",
  "object": "chat.completion",
  "created": 1640995200,
  "model": "gaia-gonana",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Gonana uses a secure escrow system..."
      },
      "finish_reason": "stop",
      "confidence": 0.95
    }
  ],
  "usage": {
    "prompt_tokens": 0,
    "completion_tokens": 0,
    "total_tokens": 0
  },
  "sources": ["escrow-001", "payment-001"],
  "suggested_actions": ["view_order", "contact_support"]
}
```

### Chat Sessions

```bash
# Start a new chat session
POST /api/gaia/chat/sessions
{
  "agentType": "farmer",
  "context": {
    "userType": "farmer",
    "currentOrder": "order_123",
    "location": "Nigeria"
  }
}

# Send message in session
POST /api/gaia/chat/sessions/{sessionId}/messages
{
  "message": "How do I set competitive prices?",
  "agentType": "farmer"
}

# Get session history
GET /api/gaia/chat/sessions/{sessionId}/history

# End session
DELETE /api/gaia/chat/sessions/{sessionId}
```

### Knowledge Base Management

```bash
# Initialize knowledge base
POST /api/gaia/knowledge-base/initialize

# Add knowledge items
POST /api/gaia/knowledge-base/{knowledgeBaseId}/items
{
  "items": [
    {
      "id": "custom-001",
      "title": "Custom Guide",
      "content": "Your custom content here...",
      "category": "onboarding",
      "tags": ["custom", "guide"]
    }
  ]
}

# Search knowledge base
POST /api/gaia/knowledge-base/{knowledgeBaseId}/search
{
  "query": "escrow process",
  "categories": ["escrow", "payment"]
}
```

### Domain Management

```bash
# Create Gonana domain
POST /api/gaia/domains

# Deploy agents to domain
POST /api/gaia/domains/{domainId}/agents

# Configure load balancing
PUT /api/gaia/domains/{domainId}/load-balancing

# Get domain analytics
GET /api/gaia/domains/{domainId}/analytics?period=7d
```

### Specialized Guidance

```bash
# Get DeFi guidance
GET /api/gaia/guidance/defi/staking

# Get farmer guidance
GET /api/gaia/guidance/farmer/pricing

# Get trader guidance
GET /api/gaia/guidance/trader/ordering
```

### Health Check

```bash
GET /api/gaia/health
```

## 🎯 Usage Examples

### 1. Farmer Assistance

```javascript
// Start a farmer chat session
const session = await fetch('/api/gaia/chat/sessions', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({
    agentType: 'farmer',
    context: { userType: 'farmer', currentOrder: 'order_123' }
  })
});

// Ask about pricing
const response = await fetch(`/api/gaia/chat/sessions/${session.id}/messages`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({
    message: 'How should I price my cassava?',
    agentType: 'farmer'
  })
});
```

### 2. DeFi Guidance

```javascript
// Get staking guidance
const guidance = await fetch('/api/gaia/guidance/defi/staking', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### 3. OpenAI-Compatible Integration

```javascript
// Replace OpenAI with Gaia
const response = await fetch('/api/gaia/chat/completions', {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'gaia-gonana',
    messages: [
      { role: 'user', content: 'Explain escrow' }
    ],
    agent_type: 'general'
  })
});
```

## 🔧 Integration with Existing Services

### Message Service Integration

The Gaia integration extends the existing message service:

```typescript
// Enhanced message service with AI assistance
const messageService = new MessageService();
const gaiaService = new GaiaService();

// Send message with AI assistance
await messageService.sendMessage(
  senderId,
  receiverId,
  message,
  channel,
  isUrl
);

// Get AI assistance for order-related queries
const aiResponse = await gaiaIntegrationService.getOrderAssistance(
  userId,
  orderId,
  query
);
```

### User Service Integration

```typescript
// AI-powered notifications
await gaiaIntegrationService.sendAINotification(
  userId,
  'order_completed',
  { orderId: 'order_123' }
);

// Personalized recommendations
const recommendations = await gaiaIntegrationService.getPersonalizedRecommendations(
  userId,
  'pricing'
);
```

## 🏗️ Architecture

### Service Structure

```
src/gaia/
├── gaia.module.ts              # Main module
├── gaia.service.ts             # Core Gaia service
├── gaia-chat.service.ts        # Chat session management
├── gaia-knowledge.service.ts   # Knowledge base management
├── gaia-domain.service.ts      # Domain and agent management
├── gaia-integration.service.ts # Integration with existing services
├── gaia.controller.ts          # REST API endpoints
└── gaia.config.ts             # Configuration
```

### Data Flow

1. **User Request** → Gaia Controller
2. **Authentication** → JWT Guard
3. **Service Routing** → Appropriate Gaia Service
4. **AI Processing** → Gaia Net API
5. **Response** → User with context and suggestions

## 🔒 Security

- **JWT Authentication** required for all endpoints
- **API Key validation** for Gaia Net API calls
- **Session isolation** between users
- **Context sanitization** before AI processing

## 📊 Monitoring

### Health Check Endpoint

```bash
GET /api/gaia/health
```

Returns:
```json
{
  "status": "healthy",
  "services": {
    "gaia": true,
    "domain": "ai.gonana.farm",
    "knowledgeBase": "configured"
  }
}
```

### Analytics

- **Domain analytics** via Gaia dashboard
- **Chat session metrics** for user engagement
- **Knowledge base usage** statistics
- **Agent performance** monitoring

## 🚀 Deployment

### Production Setup

1. **Set environment variables**:
```bash
GAIA_BASE_URL=https://api.gaianet.ai
GAIA_API_KEY=your_production_key
GAIA_DOMAIN=ai.gonana.farm
```

2. **Initialize services**:
```bash
# Initialize knowledge base
curl -X POST /api/gaia/knowledge-base/initialize

# Create domain
curl -X POST /api/gaia/domains

# Deploy agents
curl -X POST /api/gaia/domains/{domainId}/agents
```

3. **Monitor health**:
```bash
curl /api/gaia/health
```

## 🔄 Migration from OpenAI

### Step 1: Update API Endpoints

Replace OpenAI endpoints with Gaia endpoints:

```javascript
// Before (OpenAI)
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${openaiKey}` },
  body: JSON.stringify({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: message }]
  })
});

// After (Gaia)
const response = await fetch('/api/gaia/chat/completions', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${jwtToken}` },
  body: JSON.stringify({
    model: 'gaia-gonana',
    messages: [{ role: 'user', content: message }],
    agent_type: 'farmer'
  })
});
```

### Step 2: Update Configuration

```javascript
// Update your app configuration
const config = {
  ai: {
    provider: 'gaia',
    baseUrl: '/api/gaia',
    model: 'gaia-gonana'
  }
};
```

### Step 3: Test Integration

```bash
# Test health
curl /api/gaia/health

# Test chat
curl -X POST /api/gaia/chat/completions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gaia-gonana",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

## 📈 Benefits

### For Farmers
- **Pricing guidance** based on market data
- **Crop management tips** and best practices
- **Order fulfillment** assistance
- **Payment security** explanations

### For Traders
- **Market analysis** and insights
- **Order tracking** assistance
- **Payment method** guidance
- **Cross-border trade** support

### For Platform
- **Reduced support tickets** through AI assistance
- **Improved user engagement** with personalized help
- **Enhanced security** through educational content
- **Scalable support** without human intervention

## 🎯 Next Steps

1. **Deploy to staging** and test with real users
2. **Monitor performance** and user feedback
3. **Expand knowledge base** with more specific content
4. **Add more specialized agents** for different use cases
5. **Integrate with mobile app** for on-the-go assistance

## 📞 Support

For issues with Gaia integration:

1. Check the health endpoint: `/api/gaia/health`
2. Review logs for error messages
3. Verify environment variables are set correctly
4. Contact the development team with specific error details

---

**Note**: This integration provides a foundation for AI-powered assistance throughout the Gonana platform. The system is designed to be extensible and can be enhanced with additional features as needed. 