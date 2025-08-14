import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { UserModule } from '../user/user.module';
import { OrderModule } from '../order/order.module';
import { MessageModule } from '../message/message.module';
import { AuthModule } from '../auth/auth.module';
import { GaiaKnowledgeService } from './gaia-knowledge.service';
import { GaiaDomainService } from './gaia-domain.service';
import { GaiaChatService } from './gaia-chat.service';
import { GaiaIntegrationService } from './gaia-integration.service';
import { GaiaController } from './gaia.controller';
import { GaiaService } from './gaia.service';

@Module({
  imports: [
    HttpModule,
    UserModule,
    OrderModule,
    MessageModule,
    AuthModule,
  ],
  providers: [
    GaiaService,
    GaiaKnowledgeService,
    GaiaDomainService,
    GaiaChatService,
    GaiaIntegrationService,
  ],
  controllers: [GaiaController],
  exports: [
    GaiaService,
    GaiaKnowledgeService,
    GaiaDomainService,
    GaiaChatService,
    GaiaIntegrationService,
  ],
})
export class GaiaModule {} 