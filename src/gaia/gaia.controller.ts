import { Controller, Post, Body } from '@nestjs/common';
import { GaiaService } from './gaia.service';
import { SessionMemoryService } from './session-memory.service';

@Controller('api/gaia')
export class GaiaController {
  constructor(
    private readonly gaiaService: GaiaService,
    private readonly sessionMemory: SessionMemoryService
  ) {}

  @Post('session')
  createSession() {
    return { sessionId: this.sessionMemory.createSession() };
  }

  @Post('chat')
  async chat(@Body() body: { sessionId: string; message: string }) {
    return this.gaiaService.chat(body.sessionId, body.message);
  }

  @Post('farming')
  async farming(@Body() body: { sessionId: string; query: string }) {
    return this.gaiaService.farmingAssistant(body.sessionId, body.query);
  }

  @Post('defi')
  async defi(@Body() body: { sessionId: string; query: string }) {
    return this.gaiaService.defiAssistant(body.sessionId, body.query);
  }
}
