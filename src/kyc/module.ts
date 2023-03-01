import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import {} from './controller';
import { KYCApplicationModel } from './model';
import { KYCApplicationService } from './service';

@Module({
  providers: [KYCApplicationService],
  imports: [KYCApplicationModel, UserModule],
  exports: [KYCApplicationModel, KYCApplicationService],
})
export class KYCApplicationModule {
  
}
