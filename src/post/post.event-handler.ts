import {Injectable} from "@nestjs/common";
import {OnEvent} from "@nestjs/event-emitter";
import {PostService} from "./post.service";

@Injectable()
export class PostEventHandlers {
  constructor(private postService: PostService) {}
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
