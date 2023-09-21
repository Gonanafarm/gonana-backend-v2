import {Module} from "@nestjs/common";
import {} from "./post.controller";
import {PostModel} from "./post.model";
import {DiscountModel} from "./discount.model";
import {PostService} from "./post.service";
import {CloudinaryService} from "./cloudinary.service";
import {PostEventHandlers} from "./post.event-handler";
import { UserModel } from "../user/user.model";
import { UserModule } from "../user/user.module";
@Module({
  providers: [PostService, CloudinaryService, PostEventHandlers, UserModule],
  imports: [PostModel, DiscountModel, UserModel],
  exports: [PostModel, DiscountModel, PostService, CloudinaryService],
})
export class PostModule {}
