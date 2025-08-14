import { Injectable, Logger } from '@nestjs/common';
import { GaiaService } from './gaia.service';
import { GaiaChatService } from './gaia-chat.service';
import { GaiaKnowledgeService } from './gaia-knowledge.service';
import { GaiaDomainService } from './gaia-domain.service';
import { UserService } from '../user/user.service';
import { OrderService } from '../order/order.service';
import { MessageService } from '../message/message.service';

export interface IntegrationContext {
  userId: string;
  userType: 'farmer' | 'trader' | 'customer';
  currentOrder?: string;
  location?: string;
  language?: string;
  platformAction?: string;
}

@Injectable()
export class GaiaIntegrationService {
  private readonly logger = new Logger(GaiaIntegrationService.name);

  constructor(
    private readonly gaiaService: GaiaService,
    private readonly gaiaChatService: GaiaChatService,
    private readonly gaiaKnowledgeService: GaiaKnowledgeService,
    private readonly gaiaDomainService: GaiaDomainService,
    private readonly userService: UserService,
    private readonly orderService: OrderService,
    private readonly messageService: MessageService,
  ) {}

  /**
   * Initialize Gaia integration for Gonana
   */
  async initializeGaiaIntegration(): Promise<{
    domainId: string;
    knowledgeBaseId: string;
    status: string;
  }> {
    try {
      this.logger.log('Initializing Gaia integration for Gonana...');

      // 1. Create knowledge base
      const knowledgeBaseId = await this.gaiaKnowledgeService.initializeGonanaKnowledgeBase();
      this.logger.log(`Knowledge base created: ${knowledgeBaseId}`);

      // 2. Create domain
      const domainId = await this.gaiaDomainService.createGonanaDomain();
      this.logger.log(`Domain created: ${domainId}`);

      // 3. Deploy agents
      await this.gaiaDomainService.deployAgents(domainId);
      this.logger.log('Agents deployed successfully');

      // 4. Configure load balancing
      await this.gaiaDomainService.configureLoadBalancing(domainId);
      this.logger.log('Load balancing configured');

      return {
        domainId,
        knowledgeBaseId,
        status: 'initialized',
      };
    } catch (error) {
      this.logger.error('Failed to initialize Gaia integration:', error);
      throw new Error('Failed to initialize Gaia integration');
    }
  }

  /**
   * Provide AI assistance for order-related queries
   */
  async getOrderAssistance(
    userId: string,
    orderId: string,
    query: string,
  ): Promise<string> {
    try {
      // Get order context
      const ordersResponse = await this.orderService.getIncomingOrders(userId);
      const order = ordersResponse.data?.find(o => o.id === orderId);
      const user = await this.userService.findById(userId);

      const context = {
        userId,
        userType: user.account_type as 'farmer' | 'trader' | 'customer',
        currentOrder: orderId,
        location: user.location,
        platformAction: 'order_assistance',
      };

      const response = await this.gaiaService.chatCompletion({
        message: query,
        userId,
        context: this.buildOrderContext(order, user),
        agentType: user.account_type === 'farmer' ? 'farmer' : 'trader',
      });

      return response.response;
    } catch (error) {
      this.logger.error('Failed to get order assistance:', error);
      return 'I apologize, but I encountered an issue while processing your request. Please try again or contact support.';
    }
  }

  /**
   * Provide DeFi guidance for users
   */
  async getDeFiGuidance(
    userId: string,
    topic: string,
    context?: any,
  ): Promise<string> {
    try {
      const user = await this.userService.findById(userId);
      
      const response = await this.gaiaService.chatCompletion({
        message: `Tell me about ${topic} in the context of Gonana's DeFi features`,
        userId,
        context: this.buildDeFiContext(user, context),
        agentType: 'defi',
      });

      return response.response;
    } catch (error) {
      this.logger.error('Failed to get DeFi guidance:', error);
      return 'I apologize, but I encountered an issue while processing your DeFi guidance request. Please try again.';
    }
  }

  /**
   * Provide logistics assistance
   */
  async getLogisticsAssistance(
    userId: string,
    shipmentId: string,
    query: string,
  ): Promise<string> {
    try {
      const user = await this.userService.findById(userId);
      
      const response = await this.gaiaService.chatCompletion({
        message: query,
        userId,
        context: this.buildLogisticsContext(shipmentId, user),
        agentType: 'logistics',
      });

      return response.response;
    } catch (error) {
      this.logger.error('Failed to get logistics assistance:', error);
      return 'I apologize, but I encountered an issue while processing your logistics request. Please try again.';
    }
  }

  /**
   * Send AI-powered notification to user
   */
  async sendAINotification(
    userId: string,
    notificationType: string,
    context?: any,
  ): Promise<void> {
    try {
      const user = await this.userService.findById(userId);
      
      const notificationMessage = await this.generateNotificationMessage(
        notificationType,
        user,
        context,
      );

      // Send notification via existing notification system
      await this.userService.sendNotificationToDevice(
        {
          app_id: process.env.ONESIGNAL_APP_ID,
          contents: { en: notificationMessage },
          headings: { en: 'Gonana AI Assistant' },
          included_segments: ['include_player_ids'],
          include_player_ids: [user.onesignal_id],
        },
        userId,
      );
    } catch (error) {
      this.logger.error('Failed to send AI notification:', error);
    }
  }

  /**
   * Get personalized recommendations for user
   */
  async getPersonalizedRecommendations(
    userId: string,
    recommendationType: 'products' | 'pricing' | 'logistics' | 'defi',
  ): Promise<string[]> {
    try {
      const user = await this.userService.findById(userId);
      
      const response = await this.gaiaService.chatCompletion({
        message: `Provide personalized ${recommendationType} recommendations for this user`,
        userId,
        context: this.buildUserContext(user),
        agentType: user.account_type === 'farmer' ? 'farmer' : 'trader',
      });

      // Parse recommendations from AI response
      return this.parseRecommendations(response.response);
    } catch (error) {
      this.logger.error('Failed to get personalized recommendations:', error);
      return [];
    }
  }

  /**
   * Build order context for AI
   */
  private buildOrderContext(order: any, user: any): string {
    return `
User: ${user.name} (${user.role})
Order ID: ${order.id}
Order Status: ${order.status}
Order Amount: ${order.amount}
Products: ${order.products?.map((p: any) => p.name).join(', ')}
Shipping Address: ${order.shipping_address}
Payment Method: ${order.payment_method}
    `.trim();
  }

  /**
   * Build DeFi context for AI
   */
  private buildDeFiContext(user: any, context?: any): string {
    return `
User: ${user.name}
User Type: ${user.role}
Wallet Address: ${user.fiat_wallet_address}
Balance: ${user.balance}
DeFi Context: ${context || 'general inquiry'}
    `.trim();
  }

  /**
   * Build logistics context for AI
   */
  private buildLogisticsContext(shipmentId: string, user: any): string {
    return `
User: ${user.name}
Shipment ID: ${shipmentId}
User Type: ${user.role}
Location: ${user.location}
    `.trim();
  }

  /**
   * Build user context for AI
   */
  private buildUserContext(user: any): string {
    return `
User: ${user.name}
Role: ${user.role}
Location: ${user.location}
Balance: ${user.balance}
Registration Date: ${user.created_at}
    `.trim();
  }

  /**
   * Generate notification message based on type
   */
  private async generateNotificationMessage(
    notificationType: string,
    user: any,
    context?: any,
  ): Promise<string> {
    const basePrompt = `Generate a friendly, helpful notification message for a ${user.role} about ${notificationType}`;
    
    const response = await this.gaiaService.chatCompletion({
      message: basePrompt,
      userId: 'notification',
      context: this.buildUserContext(user),
      agentType: 'general',
    });

    return response.response;
  }

  /**
   * Parse recommendations from AI response
   */
  private parseRecommendations(response: string): string[] {
    // Simple parsing - in production, use more sophisticated parsing
    const lines = response.split('\n');
    return lines
      .filter(line => line.trim().startsWith('•') || line.trim().startsWith('-'))
      .map(line => line.replace(/^[•\-]\s*/, '').trim())
      .filter(line => line.length > 0);
  }

  /**
   * Get integration status
   */
  async getIntegrationStatus(): Promise<{
    domain: boolean;
    knowledgeBase: boolean;
    agents: boolean;
    loadBalancing: boolean;
  }> {
    try {
      const health = await this.gaiaService.healthCheck();
      const config = this.gaiaService.getConfig();

      return {
        domain: !!config.domain,
        knowledgeBase: !!config.knowledgeBaseId,
        agents: health,
        loadBalancing: health,
      };
    } catch (error) {
      this.logger.error('Failed to get integration status:', error);
      return {
        domain: false,
        knowledgeBase: false,
        agents: false,
        loadBalancing: false,
      };
    }
  }
} 