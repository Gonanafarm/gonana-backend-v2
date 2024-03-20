import {Module, forwardRef} from "@nestjs/common";
import {} from "./post.controller";
import {PostModel} from "./post.model";
import {DiscountModel} from "./discount.model";
import {PostService} from "./post.service";
import {CloudinaryService} from "./cloudinary.service";
import {PostEventHandlers} from "./post.event-handler";
import {UserModel} from "../user/user.model";
import {UserModule} from "../user/user.module";
import {GeocodeModule} from "../geocoder/module";
import {ScheduleModule} from "@nestjs/schedule";
import { ProductCronJob } from "./post.cron";

@Module({
  providers: [PostService, CloudinaryService, PostEventHandlers, ProductCronJob],
  imports: [
    PostModel,
    DiscountModel,
    UserModel,
    GeocodeModule,
    forwardRef(() => UserModule),
    ScheduleModule.forRoot(),
  ],
  exports: [PostModel, PostService, CloudinaryService],
})
export class PostModule {}
