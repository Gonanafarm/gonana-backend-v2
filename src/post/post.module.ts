import { Module } from "@nestjs/common";
import { } from "./post.controller";
import { PostModel } from "./post.model";
import { PostService } from "./post.service";
import { CloudinaryService } from "./cloudinary.service";

@Module({
  providers: [PostService,  CloudinaryService],
  imports: [PostModel],
  exports: [PostModel, PostService,  CloudinaryService],
})
export class PostModule { }
