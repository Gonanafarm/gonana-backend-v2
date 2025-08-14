import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { GaiaService, GaiaChatRequest, GaiaChatResponse } from './gaia.service';

export interface ChatSession {
  id: string;
  userId: string;
  agentType: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: any;
}

export interface ChatContext {
  userType: 'farmer' | 'trader' | 'customer';
  currentOrder?: string;
  location?: string;
  language?: string;
  preferences?: any;
}

@Injectable()
export class GaiaChatService {
  private readonly logger = new Logger(GaiaChatService.name);
  private readonly sessions: Map<string, ChatSession> = new Map();

  constructor(
    private readonly httpService: HttpService,
    private readonly gaiaService: GaiaService,
  ) {}

  /**
   * Start a new chat session
   */
  async startChatSession(
    userId: string,
    agentType: string = 'general',
    context?: ChatContext
  ): Promise<string> {
    const sessionId = `session_${userId}_${Date.now()}`;
    
    const session: ChatSession = {
      id: sessionId,
      userId,
      agentType,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.sessions.set(sessionId, session);

    // Send welcome message based on agent type
    const welcomeMessage = this.getWelcomeMessage(agentType, context);
    await this.addMessageToSession(sessionId, 'assistant', welcomeMessage);

    return sessionId;
  }

  /**
   * Send a message and get AI response
   */
  async sendMessage(
    sessionId: string,
    message: string,
    context?: ChatContext
  ): Promise<GaiaChatResponse> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Chat session not found');
    }

    // Add user message to session
    await this.addMessageToSession(sessionId, 'user', message);

    // Prepare context for Gaia
    const contextString = this.buildContextString(context, session);

    // Get AI response from Gaia
    const response = await this.gaiaService.chatCompletion({
      message,
      userId: session.userId,
      context: contextString,
      agentType: session.agentType as any,
    });

    // Add AI response to session
    await this.addMessageToSession(sessionId, 'assistant', response.response);

    return response;
  }

  /**
   * Get chat session history
   */
  async getSessionHistory(sessionId: string): Promise<ChatMessage[]> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Chat session not found');
    }

    return session.messages;
  }

  /**
   * Get active sessions for a user
   */
  async getUserSessions(userId: string): Promise<ChatSession[]> {
    const userSessions: ChatSession[] = [];
    
    for (const session of this.sessions.values()) {
      if (session.userId === userId) {
        userSessions.push(session);
      }
    }

    return userSessions;
  }

  /**
   * End a chat session
   */
  async endSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Chat session not found');
    }

    // Send farewell message
    const farewellMessage = this.getFarewellMessage(session.agentType);
    await this.addMessageToSession(sessionId, 'assistant', farewellMessage);

    // Remove session from memory (in production, save to database)
    this.sessions.delete(sessionId);
  }

  /**
   * Get specialized guidance based on user type and context
   */
  async getSpecializedGuidance(
    userType: string,
    topic: string,
    context?: ChatContext
  ): Promise<string> {
    const guidancePrompts = {
      farmer: {
        pricing: 'How can I set competitive prices for my crops on Gonana?',
        logistics: 'What are the best practices for shipping my products?',
        payment: 'How does the escrow system work for farmers?',
        onboarding: 'What steps do I need to complete to start selling?',
      },
      trader: {
        ordering: 'How do I place orders safely on Gonana?',
        tracking: 'How can I track my order shipments?',
        payment: 'What payment methods are available for buyers?',
        verification: 'How do I verify seller credibility?',
      },
      defi: {
        staking: 'How does staking work on Gonana?',
        escrow: 'How do smart contract escrows protect transactions?',
        tokens: 'What are the benefits of holding Gonana tokens?',
        crossBorder: 'How do cross-border DeFi payments work?',
      },
    };

    const prompt = guidancePrompts[userType]?.[topic] || 
      `Tell me about ${topic} on the Gonana platform.`;

    const response = await this.gaiaService.chatCompletion({
      message: prompt,
      userId: 'guidance',
      agentType: userType as any,
      context: this.buildContextString(context),
    });

    return response.response;
  }

  /**
   * Add message to session
   */
  private async addMessageToSession(
    sessionId: string,
    role: 'user' | 'assistant',
    content: string
  ): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Chat session not found');
    }

    const message: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random()}`,
      role,
      content,
      timestamp: new Date(),
    };

    session.messages.push(message);
    session.updatedAt = new Date();
  }

  /**
   * Build context string for AI
   */
  private buildContextString(context?: ChatContext, session?: ChatSession): string {
    let contextString = '';

    if (context) {
      contextString += `User Type: ${context.userType}\n`;
      if (context.currentOrder) {
        contextString += `Current Order: ${context.currentOrder}\n`;
      }
      if (context.location) {
        contextString += `Location: ${context.location}\n`;
      }
      if (context.language) {
        contextString += `Language: ${context.language}\n`;
      }
    }

    if (session && session.messages.length > 0) {
      const recentMessages = session.messages.slice(-5); // Last 5 messages
      contextString += '\nRecent conversation:\n';
      recentMessages.forEach(msg => {
        contextString += `${msg.role}: ${msg.content}\n`;
      });
    }

    return contextString;
  }

  /**
   * Get welcome message based on agent type
   */
  private getWelcomeMessage(agentType: string, context?: ChatContext): string {
    const baseWelcome = 'Hello! I\'m your Gonana AI assistant. How can I help you today?';

    switch (agentType) {
      case 'farmer':
        return `👨‍🌾 Welcome to Gonana Farmer Assistant! I can help you with:
        • Setting competitive prices for your crops
        • Managing orders and fulfillment
        • Understanding payment and escrow processes
        • Shipping and logistics guidance
        • Platform onboarding and account management
        
        ${baseWelcome}`;

      case 'trader':
        return `🛒 Welcome to Gonana Trader Assistant! I can help you with:
        • Finding quality products from verified farmers
        • Placing secure orders with escrow protection
        • Tracking shipments and delivery status
        • Payment methods and security
        • Cross-border trade procedures
        
        ${baseWelcome}`;

      case 'defi':
        return `🔗 Welcome to Gonana DeFi Assistant! I can help you with:
        • Staking mechanisms and rewards
        • Smart contract escrow explanations
        • Cross-border DeFi payments
        • Token economics and governance
        • Wallet security and best practices
        
        ${baseWelcome}`;

      case 'logistics':
        return `🚚 Welcome to Gonana Logistics Assistant! I can help you with:
        • Real-time order tracking
        • Shipping routes and delivery times
        • Customs documentation assistance
        • Insurance and claims processing
        • Delivery confirmation procedures
        
        ${baseWelcome}`;

      default:
        return `🌾 Welcome to Gonana! I can help you with:
        • Platform navigation and features
        • Account setup and verification
        • Payment methods and security
        • Customer support and troubleshooting
        
        ${baseWelcome}`;
    }
  }

  /**
   * Get farewell message
   */
  private getFarewellMessage(agentType: string): string {
    const baseFarewell = 'Thank you for using Gonana! Have a great day! 🌾';

    switch (agentType) {
      case 'farmer':
        return 'Thank you for using Gonana Farmer Assistant! Happy farming! 👨‍🌾';
      case 'trader':
        return 'Thank you for using Gonana Trader Assistant! Happy trading! 🛒';
      case 'defi':
        return 'Thank you for using Gonana DeFi Assistant! Stay secure! 🔗';
      case 'logistics':
        return 'Thank you for using Gonana Logistics Assistant! Safe travels! 🚚';
      default:
        return baseFarewell;
    }
  }
} 