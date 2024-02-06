/* eslint-disable no-useless-catch */
import {
  BadRequestException,
  Controller,
  Injectable,
  NotFoundException,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import {Model} from "mongoose";
import {Order, OrderDocument} from "./order.schema";
import {GenericService} from "../generic/generic.service";
import {CartItem} from "../cart/schema";
import {Post, PostDocument} from "../post/post.schema";
import {User, UserDocument} from "../user/user.schema";
import axios from "axios";

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
  ) {}

  async createOrder(
    customerId: string,
    productId: string,
    payment_method: string,
    quantity: number,
  ) {
    const customer = await this.userModel.findById(customerId);
    if (!customer) {
      throw new BadRequestException("User not found");
    }

    const product = await this.productModel.findById(productId);
    if (!product) return;

    const order = await this.orderModel.create({
      customer_id: customer.id,
      product_name: product.title,
      quantity: quantity,
      payment_method: payment_method,
      image: product.images,
      product_id: product.id,
      amount: product.amount,
    });
    console.log(order);
    return order;
  }

  async getOrders(customerId: string) {
    try {
      const customer = await this.userModel.findById(customerId);
      if (!customer) {
        throw new BadRequestException("User not found");
      }

      const orders = await this.orderModel.find({
        customerId: customer.id,
      }).sort({ created_at: -1 }); // Add this line to sort in LIFO order


      if (orders.length < 1) {
        throw new BadRequestException("No orders placed");
      }
      return {
        orders: orders,
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          status: error.status,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
