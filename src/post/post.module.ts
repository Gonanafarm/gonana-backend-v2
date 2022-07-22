import { Module } from "@nestjs/common";
import { } from "./post.controller";
import { PostModel } from "./post.model";
import { PostService } from "./post.service";

@Module({
  providers: [PostService],
  imports: [PostModel],
  exports: [PostModel, PostService],
})
export class PostModule { }
