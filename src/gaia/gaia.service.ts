import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { SessionMemoryService } from './session-memory.service';

@Injectable()
export class GaiaService {
  private readonly logger = new Logger(GaiaService.name);
  private readonly apiKey: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly sessionMemory: SessionMemoryService
  ) {
    this.apiKey = this.configService.get<string>('GAIA_API_KEY');
  }

  async chat(sessionId: string, userMessage: string, systemPrompt?: string) {
    try {
      const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [];

      // Add system prompt once at start
      if (systemPrompt && this.sessionMemory.getMessages(sessionId).length === 0) {
        const systemMsg = { role: 'system' as const, content: systemPrompt };
        this.sessionMemory.addMessage(sessionId, systemMsg.role, systemMsg.content);
        messages.push(systemMsg);
      }

      // Add user message (ensure content is always string)
      if (userMessage && userMessage.trim() !== '') {
        const userMsg = { role: 'user' as const, content: userMessage };
        this.sessionMemory.addMessage(sessionId, userMsg.role, userMsg.content);
        messages.push(userMsg);
      }

      // Include history (filter out invalid ones)
      const history = this.sessionMemory.getMessages(sessionId)
        .filter(m => m.content && m.content.trim() !== '')
        .map(m => ({
          role: m.role as 'system' | 'user' | 'assistant',
          content: m.content,
        }));

      const payload = {
        model: 'qwen72b',
        messages: history,
      };

      const response = await firstValueFrom(
        this.httpService.post(
          'https://qwen72b.gaia.domains/v1/chat/completions',
          payload,
          {
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
          },
        ),
      );

      const aiReply = response.data?.choices?.[0]?.message?.content || '';
      if (aiReply.trim() !== '') {
        this.sessionMemory.addMessage(sessionId, 'assistant', aiReply);
      }

      return { sessionId, reply: aiReply };
    } catch (error) {
      this.logger.error(
        'Gaia chat request failed:',
        error.response?.data || error.message,
      );
      throw error;
    }
  }

  async farmingAssistant(sessionId: string, query: string) {
    return this.chat(
      sessionId,
      query,
      'You are the Gonana farming assistant. Give clear, practical crop, livestock, and trading advice for African farmers.'
    );
  }

  async defiAssistant(sessionId: string, query: string) {
    return this.chat(
      sessionId,
      query,
      'You are the Gonana DeFi & marketplace assistant. Explain staking, escrow, and cross-border trade processes clearly and simply.'
    );
  }
}
