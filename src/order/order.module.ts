import { Module } from '@nestjs/common';
import {} from './order.controller';
import { OrderModel } from './order.model';
import { OrderService } from './order.service';
import { PostModule } from '../post/post.module';
import { PostModel } from '../post/post.model';
import { UserModule } from '../user/user.module';
import { UserModel } from '../user/user.model';
import { UserService } from '../user/user.service';


@Module({
  providers: [OrderService, PostModule, UserModule],
  imports: [OrderModel, PostModel, UserModel],
  exports: [OrderModel, OrderService],
})
export class OrderModule {}
