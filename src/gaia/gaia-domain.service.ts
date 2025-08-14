import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface DomainConfig {
  name: string;
  subdomain: string;
  description: string;
  features: string[];
  loadBalancing: boolean;
  customBranding: boolean;
}

export interface AgentConfig {
  id: string;
  name: string;
  type: 'farmer' | 'trader' | 'defi' | 'logistics' | 'general';
  description: string;
  capabilities: string[];
  isActive: boolean;
}

@Injectable()
export class GaiaDomainService {
  private readonly logger = new Logger(GaiaDomainService.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(private readonly httpService: HttpService) {
    this.baseUrl = process.env.GAIA_BASE_URL || 'https://api.gaianet.ai';
    this.apiKey = process.env.GAIA_API_KEY;
  }

  /**
   * Create Gonana's branded AI domain
   */
  async createGonanaDomain(): Promise<string> {
    try {
      const domainConfig: DomainConfig = {
        name: 'Gonana AI Domain',
        subdomain: 'ai.gonana.farm',
        description: 'Official AI assistant domain for Gonana agricultural marketplace',
        features: ['chat', 'knowledge-base', 'load-balancing', 'analytics'],
        loadBalancing: true,
        customBranding: true,
      };

      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/domains`,
          {
            ...domainConfig,
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
      this.logger.error('Failed to create Gonana domain:', error);
      throw new Error('Failed to create Gonana domain');
    }
  }

  /**
   * Deploy AI agents to the domain
   */
  async deployAgents(domainId: string): Promise<void> {
    const agents: AgentConfig[] = [
      {
        id: 'farmer-assistant',
        name: 'Farmer Assistant',
        type: 'farmer',
        description: 'Specialized AI assistant for farmers',
        capabilities: [
          'crop-management',
          'pricing-strategy',
          'order-fulfillment',
          'payment-guidance',
          'onboarding-support',
        ],
        isActive: true,
      },
      {
        id: 'trader-assistant',
        name: 'Trader Assistant',
        type: 'trader',
        description: 'Specialized AI assistant for traders',
        capabilities: [
          'market-analysis',
          'order-tracking',
          'payment-processing',
          'cross-border-trade',
          'customer-support',
        ],
        isActive: true,
      },
      {
        id: 'defi-assistant',
        name: 'DeFi Assistant',
        type: 'defi',
        description: 'Specialized AI assistant for DeFi features',
        capabilities: [
          'staking-guidance',
          'escrow-explanation',
          'cross-border-payments',
          'token-economics',
          'wallet-security',
        ],
        isActive: true,
      },
      {
        id: 'logistics-assistant',
        name: 'Logistics Assistant',
        type: 'logistics',
        description: 'Specialized AI assistant for shipping and logistics',
        capabilities: [
          'order-tracking',
          'shipping-routes',
          'customs-documentation',
          'insurance-claims',
          'delivery-confirmation',
        ],
        isActive: true,
      },
      {
        id: 'general-assistant',
        name: 'General Assistant',
        type: 'general',
        description: 'General AI assistant for platform support',
        capabilities: [
          'platform-navigation',
          'account-setup',
          'payment-methods',
          'customer-support',
          'troubleshooting',
        ],
        isActive: true,
      },
    ];

    try {
      await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/domains/${domainId}/agents`,
          { agents },
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
          }
        )
      );
    } catch (error) {
      this.logger.error('Failed to deploy agents:', error);
      throw new Error('Failed to deploy agents');
    }
  }

  /**
   * Configure load balancing for the domain
   */
  async configureLoadBalancing(domainId: string): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.put(
          `${this.baseUrl}/domains/${domainId}/load-balancing`,
          {
            strategy: 'round-robin',
            healthChecks: {
              enabled: true,
              interval: 30,
              timeout: 5,
              unhealthyThreshold: 3,
              healthyThreshold: 2,
            },
            failover: {
              enabled: true,
              backupAgents: ['general-assistant'],
            },
            scaling: {
              autoScaling: true,
              minInstances: 2,
              maxInstances: 10,
              targetCPUUtilization: 70,
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
    } catch (error) {
      this.logger.error('Failed to configure load balancing:', error);
      throw new Error('Failed to configure load balancing');
    }
  }

  /**
   * Get domain analytics
   */
  async getDomainAnalytics(domainId: string, period: string = '7d'): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.baseUrl}/domains/${domainId}/analytics?period=${period}`,
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
            },
          }
        )
      );

      return response.data;
    } catch (error) {
      this.logger.error('Failed to get domain analytics:', error);
      throw new Error('Failed to get domain analytics');
    }
  }

  /**
   * Update agent configuration
   */
  async updateAgent(
    domainId: string,
    agentId: string,
    updates: Partial<AgentConfig>
  ): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.put(
          `${this.baseUrl}/domains/${domainId}/agents/${agentId}`,
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
      this.logger.error('Failed to update agent:', error);
      throw new Error('Failed to update agent');
    }
  }

  /**
   * Get domain health status
   */
  async getDomainHealth(domainId: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.baseUrl}/domains/${domainId}/health`,
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
            },
          }
        )
      );

      return response.data;
    } catch (error) {
      this.logger.error('Failed to get domain health:', error);
      throw new Error('Failed to get domain health');
    }
  }

  /**
   * Scale domain resources
   */
  async scaleDomain(domainId: string, scalingConfig: any): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/domains/${domainId}/scale`,
          scalingConfig,
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
          }
        )
      );
    } catch (error) {
      this.logger.error('Failed to scale domain:', error);
      throw new Error('Failed to scale domain');
    }
  }
} 