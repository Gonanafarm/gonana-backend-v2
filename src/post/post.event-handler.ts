import {Injectable} from "@nestjs/common";
import {OnEvent} from "@nestjs/event-emitter";
import {PostService} from "./post.service";
import {InjectModel} from "@nestjs/mongoose";
import {Post, PostDocument} from "./post.schema";
import {Model} from "mongoose";
import {UserDocument, User} from "../user/user.schema";

@Injectable()
export class PostEventHandlers {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Post.name) private productModel: Model<PostDocument>,
    private postService: PostService,
  ) {}
  @OnEvent("discount trigger")
  async handleDiscountEvent(payload: any) {
    await this.postService.createDiscount(payload);
    console.log("discount model created");
  }
  @OnEvent("delete discount")
  async handleDeleteDiscount(payload: any) {
    await this.postService.deleteDiscount(payload);
    console.log("discount deleted");
  }

}
