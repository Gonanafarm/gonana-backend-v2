import {Injectable} from "@nestjs/common";
import {OnEvent} from "@nestjs/event-emitter";
import {PostService} from "./post.service";
import {InjectModel} from "@nestjs/mongoose";
import {Post, PostDocument} from "./post.schema";
import {Model} from "mongoose";
import {UserDocument, User} from "../user/user.schema";
import {db} from "../main";
import axios from "axios";
import * as admin from "firebase-admin";

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
  @OnEvent("Like")
  async handleLikeEvent(payload: any) {
    const post = db.collection("Post");
    const postQuery = post.where(`postId`, "==", `${payload.postId}`);
    const querySnapshot = await postQuery.get();
    const data = {
      postId: payload.postId,
      userId: [payload.userId],
      likes: payload.likes,
    };
    const results = querySnapshot.docs.map(doc => ({
      id: doc.id,
      data: doc.data(),
    }));
    console.log(results);
    if (results.length < 1) {
      await post.add(data);
    } else {
      // Get the first matching document
      const doc = results[0];
      // Check if the userId in the payload exists in the userId array in the document
      if (!doc.data.userId.includes(payload.userId)) {
        // If it doesn't exist, add the userId to the array and increment the likes count
        await post.doc(doc.id).update({
          userId: admin.firestore.FieldValue.arrayUnion(payload.userId),
          likes: admin.firestore.FieldValue.increment(1),
        });
      }
    }
  }
  @OnEvent("PostCreated")
  async handleCreatePostEvent(payload:any){
    
  const data = payload;
  const res = await axios.post("https://gonana-market.onrender.com/product/list", data);
  console.log(res.data);
  
  
  }
  @OnEvent("Unlike")
  async handleUnlikeEvent(payload: any) {
    const post = db.collection("Post");
    const postQuery = post.where(`postId`, "==", `${payload.postId}`);
    const querySnapshot = await postQuery.get();

    const results = querySnapshot.docs.map(doc => ({
      id: doc.id,
      data: doc.data(),
    }));
    console.log(results);
    if (results.length < 1) {
      return;
    }
    const doc = results[0];
    if (doc.data.userId.includes(payload.userId)) {
      await post.doc(doc.id).update({
        userId: admin.firestore.FieldValue.arrayRemove(payload.userId),
        likes: payload.likes,
      });
    }
  }
}
