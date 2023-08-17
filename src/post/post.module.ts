import {Module} from "@nestjs/common";
import {} from "./post.controller";
import {PostModel} from "./post.model";
import {DiscountModel} from "./discount.model";
import {PostService} from "./post.service";
import {CloudinaryService} from "./cloudinary.service";
import {PostEventHandlers} from "./post.event-handler";
@Module({
  providers: [PostService, CloudinaryService, PostEventHandlers],
  imports: [PostModel, DiscountModel],
  exports: [PostModel, DiscountModel, PostService, CloudinaryService],
})
export class PostModule {}
