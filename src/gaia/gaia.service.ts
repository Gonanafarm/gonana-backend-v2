import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

export interface GaiaConfig {
  baseUrl: string;
  apiKey: string;
  domain: string;
  knowledgeBaseId: string;
}

export interface GaiaChatRequest {
  message: string;
  userId: string;
  context?: string;
  agentType?: 'farmer' | 'trader' | 'defi' | 'logistics' | 'general';
}

export interface GaiaChatResponse {
  response: string;
  agentType: string;
  confidence: number;
  sources?: string[];
  suggestedActions?: string[];
}

export interface GaiaKnowledgeItem {
  id: string;
  title: string;
  content: string;
  category: 'escrow' | 'crop-tips' | 'payment' | 'logistics' | 'defi' | 'onboarding';
  tags: string[];
}

@Injectable()
export class GaiaService {
  private readonly logger = new Logger(GaiaService.name);
  private readonly config: GaiaConfig;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.config = {
      baseUrl: this.configService.get<string>('GAIA_BASE_URL') || 'https://api.gaianet.ai',
      apiKey: this.configService.get<string>('GAIA_API_KEY'),
      domain: this.configService.get<string>('GAIA_DOMAIN') || 'ai.gonana.farm',
      knowledgeBaseId: this.configService.get<string>('GAIA_KNOWLEDGE_BASE_ID'),
    };
  }

  /**
   * OpenAI-compatible API endpoint for seamless integration
   */
  async chatCompletion(request: GaiaChatRequest): Promise<GaiaChatResponse> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.config.baseUrl}/v1/chat/completions`,
          {
            model: 'gaia-gonana',
            messages: [
              {
                role: 'system',
                content: this.getSystemPrompt(request.agentType),
              },
              {
                role: 'user',
                content: request.message,
              },
            ],
            context: request.context,
            domain: this.config.domain,
            knowledge_base_id: this.config.knowledgeBaseId,
          },
          {
            headers: {
              'Authorization': `Bearer ${this.config.apiKey}`,
              'Content-Type': 'application/json',
            },
          }
        )
      );

      return {
        response: response.data.choices[0].message.content,
        agentType: request.agentType || 'general',
        confidence: response.data.choices[0].confidence || 0.8,
        sources: response.data.sources,
        suggestedActions: response.data.suggested_actions,
      };
    } catch (error) {
      this.logger.error('Gaia chat completion error:', error);
      throw new Error('Failed to get response from Gaia AI');
    }
  }

  /**
   * Get system prompt based on agent type
   */
  private getSystemPrompt(agentType?: string): string {
    const basePrompt = `You are a helpful AI assistant for Gonana, an agricultural marketplace platform. 
    You help farmers, traders, and customers with various aspects of the platform.`;

    switch (agentType) {
      case 'farmer':
        return `${basePrompt} You specialize in helping farmers with:
        - Crop management and best practices
        - Pricing strategies for their products
        - Order fulfillment and logistics
        - Payment and escrow processes
        - Platform onboarding and account management`;
      
      case 'trader':
        return `${basePrompt} You specialize in helping traders with:
        - Market analysis and pricing
        - Order management and tracking
        - Payment processing and escrow
        - Cross-border trade procedures
        - Customer relationship management`;
      
      case 'defi':
        return `${basePrompt} You specialize in DeFi and blockchain features:
        - Staking mechanisms and rewards
        - Escrow smart contracts
        - Cross-border payments
        - Token economics
        - Wallet management and security`;
      
      case 'logistics':
        return `${basePrompt} You specialize in logistics and shipping:
        - Order tracking and status updates
        - Shipping routes and delivery times
        - Customs and documentation
        - Insurance and claims
        - Real-time tracking integration`;
      
      default:
        return `${basePrompt} You can help with general questions about:
        - Platform features and navigation
        - Account setup and verification
        - Payment methods and security
        - Customer support and troubleshooting`;
    }
  }

  /**
   * Health check for Gaia services
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.config.baseUrl}/health`)
      );
      return response.status === 200;
    } catch (error) {
      this.logger.error('Gaia health check failed:', error);
      return false;
    }
  }

  /**
   * Get Gaia configuration
   */
  getConfig(): GaiaConfig {
    return { ...this.config };
  }
} 