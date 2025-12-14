import { Module } from '@nestjs/common';
import { GaiaService } from './gaia.service';
import { SessionMemoryService } from './session-memory.service';
import { GaiaController } from './gaia.controller';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [GaiaService, SessionMemoryService],
  controllers: [GaiaController],
})
export class GaiaModule {}