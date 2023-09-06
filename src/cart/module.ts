import { Module } from '@nestjs/common';
import { OrderModule } from '../order/order.module';
import {} from './controller';
import { CartItemModel } from './model';
import { CartItemService } from './service';
import { PostModule } from '../post/post.module';
import { PostModel } from '../post/post.model';

@Module({
  providers: [CartItemService, PostModule],
  imports: [CartItemModel, OrderModule, PostModel],
  exports: [CartItemModel, CartItemService],
})
export class CartItemModule {}
