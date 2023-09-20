/* eslint-disable no-useless-catch */
import {
  BadRequestException,
  Controller,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import {Model} from "mongoose";
import {Order, OrderDocument} from "./order.schema";
import {GenericService} from "../generic/generic.service";
import {CartItem} from "../cart/schema";
import {Post, PostDocument} from "../post/post.schema";
import {User, UserDocument} from "../user/user.schema";
import axios from "axios";

const key = process.env.SHIPBUBBLE_API_KEY;
const base_url = process.env.SHIPBUBBLE_BASE_URL;
const Headers = {
  Authorization: `Bearer ${key}`,
  "Content-Type": "application/json",
};
@Injectable()
export class OrderService {
  //@ts-ignore
  constructor(
    //@ts-ignore
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    //@ts-ignore
    @InjectModel(Post.name) private productModel: Model<PostDocument>,
    //@ts-ignore
    @InjectModel("User") private userModel: Model<UserDocument>,
  );

  async getAvailableCouriers() {
    const url = `${base_url}/shipping/couriers`;

    try {
      const res = await axios.get(url, {headers: Headers});

      if (res.data.status !== "success") {
        return {success: false, message: "Request failed"};
      }

      const couriers = res.data.data;

      // Filter the data array to get names and pin_images of couriers with id 24032950 and status "operational"
      const filteredCouriers = couriers
        .filter(
          (courier: any) =>
            courier.package_categories.some(
              (category: any) => category.id === 24032950,
            ) && courier.status === "operational",
        )
        .map((courier: any) => ({
          name: courier.name,
          pin_image: courier.pin_image,
          service_code: courier.service_code,
        }));

      return {success: true, couriers: filteredCouriers};
    } catch (error) {
      console.error(error);
      return {success: false, message: "An error occurred"};
    }
  }

}
