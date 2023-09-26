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
  @OnEvent("created post")
  async handleCreatePost(payload: any) {
    const id = payload._id.toString();
    console.log(id);
    const product = await this.productModel.findById(id);
    if (!product) {
      console.log("Product not found");
      return;
    }
    const userId = product?.publisher_id;
    const user = await this.userModel.findById(userId);
    if (!user) {
      console.log("User not found");
      return;
    }
    const userAddress = user.address[0];
    console.log(userAddress);
    product.address.push(userAddress);
    await product.save();
    console.log("product address updated");
  }
}
