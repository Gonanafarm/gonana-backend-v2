import {forwardRef, Module} from "@nestjs/common";
import {MessageController} from "./message.controller";
import {MessageService} from "./message.service";
import {MessageModel} from "./message.model";
import {OrderModule} from "../order/order.module";
import {UserModel} from "../user/user.model";
import { OrderService } from "../order/order.service";

@Module({
  controllers: [MessageController],
  providers: [MessageService],
  imports: [MessageModel, UserModel, forwardRef(() => OrderModule)],
  exports: [MessageService, MessageModel],
})
export class MessageModule {}
