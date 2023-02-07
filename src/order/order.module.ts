import { Module } from '@nestjs/common';
import {} from './order.controller';
import { OrderModel } from './order.model';
import { OrderService } from './order.service';

@Module({
  providers: [OrderService],
  imports: [OrderModel],
  exports: [OrderModel, OrderService],
})
export class OrderModule {}
