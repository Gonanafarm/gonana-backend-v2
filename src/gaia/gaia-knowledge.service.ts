import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { GaiaKnowledgeItem } from './gaia.service';

export interface KnowledgeBaseConfig {
  name: string;
  description: string;
  categories: string[];
}

@Injectable()
export class GaiaKnowledgeService {
  private readonly logger = new Logger(GaiaKnowledgeService.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(private readonly httpService: HttpService) {
    this.baseUrl = process.env.GAIA_BASE_URL || 'https://api.gaianet.ai';
    this.apiKey = process.env.GAIA_API_KEY;
  }

  /**
   * Create a new knowledge base for Gonana
   */
  async createKnowledgeBase(config: KnowledgeBaseConfig): Promise<string> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/knowledge-bases`,
          {
            name: config.name,
            description: config.description,
            categories: config.categories,
            metadata: {
              platform: 'gonana',
              version: '1.0.0',
            },
          },
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
          }
        )
      );

      return response.data.id;
    } catch (error) {
      this.logger.error('Failed to create knowledge base:', error);
      throw new Error('Failed to create knowledge base');
    }
  }

  /**
   * Add knowledge items to the base
   */
  async addKnowledgeItems(knowledgeBaseId: string, items: GaiaKnowledgeItem[]): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/knowledge-bases/${knowledgeBaseId}/items`,
          {
            items: items.map(item => ({
              id: item.id,
              title: item.title,
              content: item.content,
              category: item.category,
              tags: item.tags,
              metadata: {
                platform: 'gonana',
                created_at: new Date().toISOString(),
              },
            })),
          },
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
          }
        )
      );
    } catch (error) {
      this.logger.error('Failed to add knowledge items:', error);
      throw new Error('Failed to add knowledge items');
    }
  }

  /**
   * Initialize Gonana's knowledge base with core documentation
   */
  async initializeGonanaKnowledgeBase(): Promise<string> {
    const knowledgeBaseId = await this.createKnowledgeBase({
      name: 'Gonana Platform Knowledge Base',
      description: 'Comprehensive knowledge base for Gonana agricultural marketplace',
      categories: ['escrow', 'crop-tips', 'payment', 'logistics', 'defi', 'onboarding'],
    });

    const coreKnowledgeItems: GaiaKnowledgeItem[] = [
      {
        id: 'escrow-001',
        title: 'Escrow System Overview',
        content: `Gonana uses a secure escrow system to protect both buyers and sellers. 
        When an order is placed, funds are held in escrow until the buyer confirms receipt. 
        The escrow smart contract automatically releases funds to the seller after delivery confirmation.`,
        category: 'escrow',
        tags: ['escrow', 'payment', 'security', 'smart-contract'],
      },
      {
        id: 'escrow-002',
        title: 'Escrow Release Process',
        content: `To release escrow funds: 1) Buyer receives order and confirms delivery, 
        2) Smart contract automatically releases funds to seller, 3) 5% platform fee is deducted, 
        4) Remaining 95% is transferred to seller's wallet.`,
        category: 'escrow',
        tags: ['escrow', 'release', 'fees', 'wallet'],
      },
      {
        id: 'payment-001',
        title: 'Payment Methods',
        content: `Gonana supports multiple payment methods: 
        - Traditional bank transfers
        - Cryptocurrency payments (ETH, CCD)
        - Mobile money transfers
        - Cross-border payment solutions`,
        category: 'payment',
        tags: ['payment', 'bank', 'crypto', 'mobile-money'],
      },
      {
        id: 'crop-tips-001',
        title: 'Crop Management Best Practices',
        content: `Essential crop management tips: 
        - Regular soil testing and fertilization
        - Proper irrigation scheduling
        - Pest and disease monitoring
        - Harvest timing optimization
        - Post-harvest storage techniques`,
        category: 'crop-tips',
        tags: ['crops', 'management', 'soil', 'irrigation', 'harvest'],
      },
      {
        id: 'logistics-001',
        title: 'Shipping and Logistics',
        content: `Gonana logistics process: 
        - Order confirmation triggers shipping
        - Real-time tracking via Shipbubble integration
        - Customs documentation assistance
        - Insurance coverage for shipments
        - Delivery confirmation required for payment release`,
        category: 'logistics',
        tags: ['shipping', 'tracking', 'customs', 'insurance', 'delivery'],
      },
      {
        id: 'defi-001',
        title: 'DeFi Features on Gonana',
        content: `Gonana's DeFi features include: 
        - Staking rewards for active users
        - Governance tokens for platform decisions
        - Yield farming opportunities
        - Cross-border DeFi payments
        - Smart contract automation`,
        category: 'defi',
        tags: ['defi', 'staking', 'governance', 'yield', 'smart-contracts'],
      },
      {
        id: 'onboarding-001',
        title: 'Farmer Onboarding Process',
        content: `Steps to become a Gonana farmer: 
        1) Complete profile verification
        2) Upload product photos and descriptions
        3) Set competitive pricing
        4) Configure shipping options
        5) Start receiving orders`,
        category: 'onboarding',
        tags: ['onboarding', 'verification', 'profile', 'products', 'pricing'],
      },
      {
        id: 'onboarding-002',
        title: 'Trader Onboarding Process',
        content: `Steps to become a Gonana trader: 
        1) Complete KYC verification
        2) Add payment methods
        3) Browse and select products
        4) Place orders with escrow protection
        5) Track shipments and confirm delivery`,
        category: 'onboarding',
        tags: ['onboarding', 'kyc', 'payment', 'orders', 'tracking'],
      },
    ];

    await this.addKnowledgeItems(knowledgeBaseId, coreKnowledgeItems);
    return knowledgeBaseId;
  }

  /**
   * Search knowledge base for relevant information
   */
  async searchKnowledgeBase(
    knowledgeBaseId: string,
    query: string,
    categories?: string[]
  ): Promise<GaiaKnowledgeItem[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/knowledge-bases/${knowledgeBaseId}/search`,
          {
            query,
            categories,
            limit: 10,
          },
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
          }
        )
      );

      return response.data.results.map((item: any) => ({
        id: item.id,
        title: item.title,
        content: item.content,
        category: item.category,
        tags: item.tags,
      }));
    } catch (error) {
      this.logger.error('Failed to search knowledge base:', error);
      throw new Error('Failed to search knowledge base');
    }
  }

  /**
   * Update knowledge base item
   */
  async updateKnowledgeItem(
    knowledgeBaseId: string,
    itemId: string,
    updates: Partial<GaiaKnowledgeItem>
  ): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.put(
          `${this.baseUrl}/knowledge-bases/${knowledgeBaseId}/items/${itemId}`,
          updates,
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
          }
        )
      );
    } catch (error) {
      this.logger.error('Failed to update knowledge item:', error);
      throw new Error('Failed to update knowledge item');
    }
  }

  /**
   * Delete knowledge base item
   */
  async deleteKnowledgeItem(knowledgeBaseId: string, itemId: string): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.delete(
          `${this.baseUrl}/knowledge-bases/${knowledgeBaseId}/items/${itemId}`,
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
            },
          }
        )
      );
    } catch (error) {
      this.logger.error('Failed to delete knowledge item:', error);
      throw new Error('Failed to delete knowledge item');
    }
  }
} 