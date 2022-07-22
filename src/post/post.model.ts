import { MongooseModule } from "@nestjs/mongoose";
import { Post, PostDocument, PostSchema } from "./post.schema";

export const PostModel = MongooseModule.forFeature([
  { name: Post.name, schema: PostSchema }
]);
