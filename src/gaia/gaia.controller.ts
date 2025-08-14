import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';
import { GaiaService, GaiaChatRequest, GaiaChatResponse } from './gaia.service';
import { GaiaKnowledgeService } from './gaia-knowledge.service';
import { GaiaDomainService } from './gaia-domain.service';
import { GaiaChatService, ChatContext } from './gaia-chat.service';

export class ChatRequestDto {
  message: string;
  agentType?: 'farmer' | 'trader' | 'defi' | 'logistics' | 'general';
  context?: ChatContext;
}

export class StartSessionDto {
  agentType?: string;
  context?: ChatContext;
}

export class KnowledgeItemDto {
  id: string;
  title: string;
  content: string;
  category: 'escrow' | 'crop-tips' | 'payment' | 'logistics' | 'defi' | 'onboarding';
  tags: string[];
}

export class DomainConfigDto {
  name: string;
  subdomain: string;
  description: string;
  features: string[];
  loadBalancing: boolean;
  customBranding: boolean;
}

@Controller('api/gaia')
export class GaiaController {
  constructor(
    private readonly gaiaService: GaiaService,
    private readonly gaiaKnowledgeService: GaiaKnowledgeService,
    private readonly gaiaDomainService: GaiaDomainService,
    private readonly gaiaChatService: GaiaChatService,
  ) {}

  /**
   * OpenAI-compatible chat completion endpoint
   */
  // Public: OpenAI-compatible chat completion
  @Post('chat/completions')
  async chatCompletion(@Body() request: any): Promise<any> {
    try {
      const response = await this.gaiaService.chatCompletion({
        message: request.messages[request.messages.length - 1].content,
        userId: 'api-user',
        agentType: request.agent_type || 'general',
        context: request.context,
      });

      return {
        id: `chatcmpl-${Date.now()}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: 'gaia-gonana',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: response.response,
            },
            finish_reason: 'stop',
            confidence: response.confidence,
          },
        ],
        usage: {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0,
        },
        sources: response.sources,
        suggested_actions: response.suggestedActions,
      };
    } catch (error) {
      throw new HttpException(
        {
          error: {
            message: error.message,
            type: 'gaia_error',
          },
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Start a new chat session
   */
  // Protected: start a new authenticated chat session
  @UseGuards(JwtAuthGuard)
  @Post('chat/sessions')
  async startChatSession(
    @Req() req: Request,
    @Body() data: StartSessionDto,
  ): Promise<{ sessionId: string }> {
    try {
      // @ts-ignore
      const userId = req.user.id;
      const sessionId = await this.gaiaChatService.startChatSession(
        userId,
        data.agentType,
        data.context,
      );

      return { sessionId };
    } catch (error) {
      throw new HttpException(
        {
          error: {
            message: error.message,
            type: 'session_error',
          },
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Send message in a chat session
   */
  // Protected: send message in authenticated chat session
  @UseGuards(JwtAuthGuard)
  @Post('chat/sessions/:sessionId/messages')
  async sendMessage(
    @Param('sessionId') sessionId: string,
    @Body() data: ChatRequestDto,
  ): Promise<GaiaChatResponse> {
    try {
      return await this.gaiaChatService.sendMessage(
        sessionId,
        data.message,
        data.context,
      );
    } catch (error) {
      throw new HttpException(
        {
          error: {
            message: error.message,
            type: 'message_error',
          },
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Get chat session history
   */
  // Protected: get authenticated chat session history
  @UseGuards(JwtAuthGuard)
  @Get('chat/sessions/:sessionId/history')
  async getSessionHistory(@Param('sessionId') sessionId: string): Promise<any> {
    try {
      const messages = await this.gaiaChatService.getSessionHistory(sessionId);
      return { messages };
    } catch (error) {
      throw new HttpException(
        {
          error: {
            message: error.message,
            type: 'history_error',
          },
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * End a chat session
   */
  // Protected: end authenticated chat session
  @UseGuards(JwtAuthGuard)
  @Delete('chat/sessions/:sessionId')
  async endSession(@Param('sessionId') sessionId: string): Promise<{ success: boolean }> {
    try {
      await this.gaiaChatService.endSession(sessionId);
      return { success: true };
    } catch (error) {
      throw new HttpException(
        {
          error: {
            message: error.message,
            type: 'session_error',
          },
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Get specialized guidance
   */
  // Public: specialized guidance
  @Get('guidance/:userType/:topic')
  async getSpecializedGuidance(
    @Param('userType') userType: string,
    @Param('topic') topic: string,
    @Query() context: any,
  ): Promise<{ guidance: string }> {
    try {
      const guidance = await this.gaiaChatService.getSpecializedGuidance(
        userType,
        topic,
        context,
      );
      return { guidance };
    } catch (error) {
      throw new HttpException(
        {
          error: {
            message: error.message,
            type: 'guidance_error',
          },
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Initialize Gonana knowledge base
   */
  // Protected: knowledge base initialization
  @UseGuards(JwtAuthGuard)
  @Post('knowledge-base/initialize')
  async initializeKnowledgeBase(): Promise<{ knowledgeBaseId: string }> {
    try {
      const knowledgeBaseId = await this.gaiaKnowledgeService.initializeGonanaKnowledgeBase();
      return { knowledgeBaseId };
    } catch (error) {
      throw new HttpException(
        {
          error: {
            message: error.message,
            type: 'knowledge_base_error',
          },
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Add knowledge items
   */
  // Protected: add KB items
  @UseGuards(JwtAuthGuard)
  @Post('knowledge-base/:knowledgeBaseId/items')
  async addKnowledgeItems(
    @Param('knowledgeBaseId') knowledgeBaseId: string,
    @Body() data: { items: KnowledgeItemDto[] },
  ): Promise<{ success: boolean }> {
    try {
      await this.gaiaKnowledgeService.addKnowledgeItems(knowledgeBaseId, data.items);
      return { success: true };
    } catch (error) {
      throw new HttpException(
        {
          error: {
            message: error.message,
            type: 'knowledge_base_error',
          },
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Search knowledge base
   */
  // Protected: KB search
  @UseGuards(JwtAuthGuard)
  @Post('knowledge-base/:knowledgeBaseId/search')
  async searchKnowledgeBase(
    @Param('knowledgeBaseId') knowledgeBaseId: string,
    @Body() data: { query: string; categories?: string[] },
  ): Promise<{ results: any[] }> {
    try {
      const results = await this.gaiaKnowledgeService.searchKnowledgeBase(
        knowledgeBaseId,
        data.query,
        data.categories,
      );
      return { results };
    } catch (error) {
      throw new HttpException(
        {
          error: {
            message: error.message,
            type: 'search_error',
          },
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Create Gonana domain
   */
  // Protected: domain creation
  @UseGuards(JwtAuthGuard)
  @Post('domains')
  async createGonanaDomain(): Promise<{ domainId: string }> {
    try {
      const domainId = await this.gaiaDomainService.createGonanaDomain();
      return { domainId };
    } catch (error) {
      throw new HttpException(
        {
          error: {
            message: error.message,
            type: 'domain_error',
          },
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Deploy agents to domain
   */
  // Protected: deploy agents
  @UseGuards(JwtAuthGuard)
  @Post('domains/:domainId/agents')
  async deployAgents(@Param('domainId') domainId: string): Promise<{ success: boolean }> {
    try {
      await this.gaiaDomainService.deployAgents(domainId);
      return { success: true };
    } catch (error) {
      throw new HttpException(
        {
          error: {
            message: error.message,
            type: 'agent_error',
          },
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Configure load balancing
   */
  // Protected: configure load balancing
  @UseGuards(JwtAuthGuard)
  @Put('domains/:domainId/load-balancing')
  async configureLoadBalancing(@Param('domainId') domainId: string): Promise<{ success: boolean }> {
    try {
      await this.gaiaDomainService.configureLoadBalancing(domainId);
      return { success: true };
    } catch (error) {
      throw new HttpException(
        {
          error: {
            message: error.message,
            type: 'load_balancing_error',
          },
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get domain analytics
   */
  // Protected: domain analytics
  @UseGuards(JwtAuthGuard)
  @Get('domains/:domainId/analytics')
  async getDomainAnalytics(
    @Param('domainId') domainId: string,
    @Query('period') period: string = '7d',
  ): Promise<any> {
    try {
      return await this.gaiaDomainService.getDomainAnalytics(domainId, period);
    } catch (error) {
      throw new HttpException(
        {
          error: {
            message: error.message,
            type: 'analytics_error',
          },
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Health check
   */
  // Public: health check
  @Get('health')
  async healthCheck(): Promise<{ status: string; services: any }> {
    try {
      const gaiaHealth = await this.gaiaService.healthCheck();
      const config = this.gaiaService.getConfig();

      return {
        status: gaiaHealth ? 'healthy' : 'unhealthy',
        services: {
          gaia: gaiaHealth,
          domain: config.domain,
          knowledgeBase: config.knowledgeBaseId ? 'configured' : 'not_configured',
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        services: {
          gaia: false,
          error: error.message,
        },
      };
    }
  }

  /**
   * Public anonymous chat sessions (in-memory).
   * Generates a random anonymous userId and sessionId.
   */
  @Post('public/chat/sessions')
  async startPublicChatSession(
    @Body() data: StartSessionDto,
  ): Promise<{ sessionId: string }> {
    try {
      const anonUserId = `anon_${Math.random().toString(36).slice(2, 10)}`;
      const sessionId = await this.gaiaChatService.startChatSession(
        anonUserId,
        data.agentType,
        data.context,
      );
      return { sessionId };
    } catch (error) {
      throw new HttpException(
        {
          error: {
            message: error.message,
            type: 'session_error',
          },
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('public/chat/sessions/:sessionId/messages')
  async sendPublicMessage(
    @Param('sessionId') sessionId: string,
    @Body() data: ChatRequestDto,
  ): Promise<GaiaChatResponse> {
    try {
      return await this.gaiaChatService.sendMessage(
        sessionId,
        data.message,
        data.context,
      );
    } catch (error) {
      throw new HttpException(
        {
          error: {
            message: error.message,
            type: 'message_error',
          },
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('public/chat/sessions/:sessionId/history')
  async getPublicSessionHistory(
    @Param('sessionId') sessionId: string,
  ): Promise<{ messages: any[] }> {
    try {
      const messages = await this.gaiaChatService.getSessionHistory(sessionId);
      return { messages };
    } catch (error) {
      throw new HttpException(
        {
          error: {
            message: error.message,
            type: 'history_error',
          },
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Delete('public/chat/sessions/:sessionId')
  async endPublicSession(
    @Param('sessionId') sessionId: string,
  ): Promise<{ success: boolean }> {
    try {
      await this.gaiaChatService.endSession(sessionId);
      return { success: true };
    } catch (error) {
      throw new HttpException(
        {
          error: {
            message: error.message,
            type: 'session_error',
          },
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
} 