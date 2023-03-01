import { Module } from '@nestjs/common';
import { OrderModule } from '../order/order.module';
import {} from './controller';
import { CartItemModel } from './model';
import { CartItemService } from './service';

@Module({
  providers: [CartItemService],
  imports: [CartItemModel, OrderModule],
  exports: [CartItemModel, CartItemService],
})
export class CartItemModule {}
