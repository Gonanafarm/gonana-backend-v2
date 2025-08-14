export const GaiaConfig = {
  // Gaia Net API Configuration
  GAIA_BASE_URL: process.env.GAIA_BASE_URL || 'https://api.gaianet.ai',
  GAIA_API_KEY: process.env.GAIA_API_KEY,
  GAIA_DOMAIN: process.env.GAIA_DOMAIN || 'ai.gonana.farm',
  GAIA_KNOWLEDGE_BASE_ID: process.env.GAIA_KNOWLEDGE_BASE_ID,

  // OpenAI-compatible API settings
  OPENAI_COMPATIBLE: {
    model: 'gaia-gonana',
    maxTokens: 2048,
    temperature: 0.7,
  },

  // Chat session settings
  CHAT: {
    maxSessionDuration: 24 * 60 * 60 * 1000, // 24 hours
    maxMessagesPerSession: 100,
    sessionCleanupInterval: 60 * 60 * 1000, // 1 hour
  },

  // Knowledge base categories
  KNOWLEDGE_CATEGORIES: [
    'escrow',
    'crop-tips', 
    'payment',
    'logistics',
    'defi',
    'onboarding',
  ],

  // Agent types and capabilities
  AGENT_TYPES: {
    farmer: {
      name: 'Farmer Assistant',
      capabilities: [
        'crop-management',
        'pricing-strategy',
        'order-fulfillment',
        'payment-guidance',
        'onboarding-support',
      ],
    },
    trader: {
      name: 'Trader Assistant',
      capabilities: [
        'market-analysis',
        'order-tracking',
        'payment-processing',
        'cross-border-trade',
        'customer-support',
      ],
    },
    defi: {
      name: 'DeFi Assistant',
      capabilities: [
        'staking-guidance',
        'escrow-explanation',
        'cross-border-payments',
        'token-economics',
        'wallet-security',
      ],
    },
    logistics: {
      name: 'Logistics Assistant',
      capabilities: [
        'order-tracking',
        'shipping-routes',
        'customs-documentation',
        'insurance-claims',
        'delivery-confirmation',
      ],
    },
    general: {
      name: 'General Assistant',
      capabilities: [
        'platform-navigation',
        'account-setup',
        'payment-methods',
        'customer-support',
        'troubleshooting',
      ],
    },
  },

  // Domain configuration
  DOMAIN: {
    name: 'Gonana AI Domain',
    subdomain: 'ai.gonana.farm',
    description: 'Official AI assistant domain for Gonana agricultural marketplace',
    features: ['chat', 'knowledge-base', 'load-balancing', 'analytics'],
    branding: {
      logo: 'https://gonana.farm/logo.png',
      primaryColor: '#4CAF50',
      secondaryColor: '#8BC34A',
      theme: 'agricultural',
    },
    loadBalancing: {
      enabled: true,
      strategy: 'round-robin',
      healthChecks: true,
      failover: true,
      scaling: {
        autoScaling: true,
        minInstances: 2,
        maxInstances: 10,
        targetCPUUtilization: 70,
      },
    },
  },

  // Core knowledge base content
  CORE_KNOWLEDGE: [
    {
      id: 'escrow-001',
      title: 'Escrow System Overview',
      content: `Gonana uses a secure escrow system to protect both buyers and sellers. When an order is placed, funds are held in escrow until the buyer confirms receipt. The escrow smart contract automatically releases funds to the seller after delivery confirmation.`,
      category: 'escrow',
      tags: ['escrow', 'payment', 'security', 'smart-contract'],
    },
    {
      id: 'escrow-002',
      title: 'Escrow Release Process',
      content: `To release escrow funds: 1) Buyer receives order and confirms delivery, 2) Smart contract automatically releases funds to seller, 3) 5% platform fee is deducted, 4) Remaining 95% is transferred to seller's wallet.`,
      category: 'escrow',
      tags: ['escrow', 'release', 'fees', 'wallet'],
    },
    {
      id: 'payment-001',
      title: 'Payment Methods',
      content: `Gonana supports multiple payment methods: Traditional bank transfers, Cryptocurrency payments (ETH, CCD), Mobile money transfers, Cross-border payment solutions`,
      category: 'payment',
      tags: ['payment', 'bank', 'crypto', 'mobile-money'],
    },
    {
      id: 'crop-tips-001',
      title: 'Crop Management Best Practices',
      content: `Essential crop management tips: Regular soil testing and fertilization, Proper irrigation scheduling, Pest and disease monitoring, Harvest timing optimization, Post-harvest storage techniques`,
      category: 'crop-tips',
      tags: ['crops', 'management', 'soil', 'irrigation', 'harvest'],
    },
    {
      id: 'logistics-001',
      title: 'Shipping and Logistics',
      content: `Gonana logistics process: Order confirmation triggers shipping, Real-time tracking via Shipbubble integration, Customs documentation assistance, Insurance coverage for shipments, Delivery confirmation required for payment release`,
      category: 'logistics',
      tags: ['shipping', 'tracking', 'customs', 'insurance', 'delivery'],
    },
    {
      id: 'defi-001',
      title: 'DeFi Features on Gonana',
      content: `Gonana's DeFi features include: Staking rewards for active users, Governance tokens for platform decisions, Yield farming opportunities, Cross-border DeFi payments, Smart contract automation`,
      category: 'defi',
      tags: ['defi', 'staking', 'governance', 'yield', 'smart-contracts'],
    },
    {
      id: 'onboarding-001',
      title: 'Farmer Onboarding Process',
      content: `Steps to become a Gonana farmer: 1) Complete profile verification, 2) Upload product photos and descriptions, 3) Set competitive pricing, 4) Configure shipping options, 5) Start receiving orders`,
      category: 'onboarding',
      tags: ['onboarding', 'verification', 'profile', 'products', 'pricing'],
    },
    {
      id: 'onboarding-002',
      title: 'Trader Onboarding Process',
      content: `Steps to become a Gonana trader: 1) Complete KYC verification, 2) Add payment methods, 3) Browse and select products, 4) Place orders with escrow protection, 5) Track shipments and confirm delivery`,
      category: 'onboarding',
      tags: ['onboarding', 'kyc', 'payment', 'orders', 'tracking'],
    },
  ],
}; 