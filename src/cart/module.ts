import {Module, forwardRef} from "@nestjs/common";
import {OrderModule} from "../order/order.module";
import {} from "./controller";
import {CartItemModel} from "./model";
import {CartItemService} from "./service";
import {PostModule} from "../post/post.module";
import {PostModel} from "../post/post.model";
import {UserModule} from "../user/user.module";
import {UserModel} from "../user/user.model";
import {UserService} from "../user/user.service";

@Module({
  providers: [CartItemService,PostModule ],
  imports: [
    CartItemModel,
    OrderModule,
    PostModel,
    UserModel,
    forwardRef(() => UserModule),
  ],
  exports: [CartItemModel, CartItemService],
})
export class CartItemModule {}
