import {Injectable} from "@nestjs/common";
import {OnEvent} from "@nestjs/event-emitter";
import {PostService} from "./post.service";
import {InjectModel} from "@nestjs/mongoose";
import {Post, PostDocument} from "./post.schema";
import {Model} from "mongoose";
import {UserDocument, User} from "../user/user.schema";
import {db} from "../main";
import axios from "axios";
// import * as admin from "firebase-admin";
const abi = require("../../abi.json");
import {ethers, providers} from "ethers";
import {UserService} from "../user/user.service";

@Injectable()
export class PostEventHandlers {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Post.name) private productModel: Model<PostDocument>,
    private userService: UserService,
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
  // @OnEvent("Like")
  // async handleLikeEvent(payload: any) {
  //   const post = db.collection("Post");
  //   const postQuery = post.where(`postId`, "==", `${payload.postId}`);
  //   const querySnapshot = await postQuery.get();
  //   const data = {
  //     postId: payload.postId,
  //     userId: [payload.userId],
  //     likes: payload.likes,
  //   };
  //   const results = querySnapshot.docs.map(doc => ({
  //     id: doc.id,
  //     data: doc.data(),
  //   }));
  //   console.log(results);
  //   if (results.length < 1) {
  //     await post.add(data);
  //   } else {
  //     // Get the first matching document
  //     const doc = results[0];
  //     // Check if the userId in the payload exists in the userId array in the document
  //     if (!doc.data.userId.includes(payload.userId)) {
  //       // If it doesn't exist, add the userId to the array and increment the likes count
  //       await post.doc(doc.id).update({
  //         userId: admin.firestore.FieldValue.arrayUnion(payload.userId),
  //         likes: admin.firestore.FieldValue.increment(1),
  //       });
  //     }
  //   }
  // }
  @OnEvent("PostCreated")
  async handleCreatePostEvent(payload: any) {
    const farmer = (await this.userModel.findById(payload.farmer_id)) as User;
    const message = {
      app_id: process.env.ONESIGNAL_APP_ID,
      contents: {en: "Test push notification"},
      included_segments: ["include_player_ids"],
      include_player_ids: farmer.patrons,
      content_available: true,
      onesignal_notification_accent_color: "FF00FF00",
      big_picture: payload.images[0],
      large_icon: payload.images[0],
      data: {
        PushTitle: `Products Posted`,
      },
      headings: {
        en: `${farmer.first_name} ${farmer.last_name} posted some products`,
      },
    };
    if (farmer.patrons.length > 1) {
      await this.userService.sendNotificationToDevice(message);
    }

    const provider = new providers.JsonRpcProvider(
      "https://rpc.ankr.com/blast_testnet_sepolia",
    );

    //wallet instance of the contract admin
    const admin = new ethers.Wallet(
      "b72cb42b3319abb30fc17f7e20ea58165a84de90c9afd90fcb80382062e01382",
      provider,
    );
    const marketplaceAddr = "0x686690ef4a57F11A4980e0053E2D1EdD69782F35";
    const contract = new ethers.Contract(marketplaceAddr, abi, admin);

    const list_product = await contract.createProduct(
      payload.product_id,
      payload.amount,
      payload.farmer_id,
      farmer.wallet_address,
    );

    console.log(payload);
    console.log(farmer);

    const tx = await list_product.wait();
    console.log(list_product);
    console.log(tx);
  }
  // @OnEvent("Unlike")
  // async handleUnlikeEvent(payload: any) {
  //   const post = db.collection("Post");
  //   const postQuery = post.where(`postId`, "==", `${payload.postId}`);
  //   const querySnapshot = await postQuery.get();

  //   const results = querySnapshot.docs.map(doc => ({
  //     id: doc.id,
  //     data: doc.data(),
  //   }));
  //   console.log(results);
  //   if (results.length < 1) {
  //     return;
  //   }
  //   const doc = results[0];
  //   if (doc.data.userId.includes(payload.userId)) {
  //     await post.doc(doc.id).update({
  //       userId: admin.firestore.FieldValue.arrayRemove(payload.userId),
  //       likes: payload.likes,
  //     });
  //   }
  // }
}
