import { Module } from '@nestjs/common';
import { OrganizationModule } from '../organisation/organisation.module';
import {} from './order.controller';
import { OrderModel } from './order.model';
import { OrderService } from './order.service';

@Module({
  providers: [OrderService],
  imports: [OrderModel,OrganizationModule],
  exports: [OrderModel, OrderService],
})
export class OrderModule {}
