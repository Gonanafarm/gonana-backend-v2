import { Module } from '@nestjs/common';
import {} from './order.controller';
import { OutgoingOrderModel } from './outgoing.order.model';
import { OrderService } from './order.service';
import { PostModule } from '../post/post.module';
import { PostModel } from '../post/post.model';
import { UserModule } from '../user/user.module';
import { UserModel } from '../user/user.model';
import { UserService } from '../user/user.service';
import { IncomingOrderModel } from './incoming.order.model';


@Module({
  providers: [OrderService, PostModule, UserModule],
  imports: [OutgoingOrderModel, PostModel, UserModel, IncomingOrderModel],
  exports: [OutgoingOrderModel, OrderService, IncomingOrderModel],
})
export class OrderModule {}
