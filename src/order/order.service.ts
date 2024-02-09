/* eslint-disable no-useless-catch */
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import {Model} from "mongoose";
import {OrderDocument} from "./outgoing.order.schema";
import {Post, PostDocument} from "../post/post.schema";
import {UserDocument} from "../user/user.schema";
import {IncomingOrderDocument} from "./incoming.order.schema";

@Injectable()
export class OrderService {
  //@ts-ignore
  constructor(
    //@ts-ignore
    @InjectModel("OUTGOING_ORDERS")
    private outgoingOrderModel: Model<OrderDocument>,
    //@ts-ignore
    @InjectModel(Post.name) private productModel: Model<PostDocument>,
    //@ts-ignore
    @InjectModel("User") private userModel: Model<UserDocument>,
    //@ts-ignore
    @InjectModel("INCOMING_ORDERS")
    private incomingOrderModel: Model<IncomingOrderDocument>,
  ) {}

  async createOutgoingOrder(
    product_id: string,
    farmer_id: string,
    quantity: number,
    shipbubble_id: string,
    payment_method: "WEB2" | "WEB3",
  ) {
    const farmer = await this.userModel.findById(farmer_id);
    if (!farmer) {
      throw new BadRequestException("User not found");
    }

    const product = await this.productModel.findById(product_id);
    if (!product) return;

    const order = await this.outgoingOrderModel.create({
      farmer_id: farmer.id,
      product_name: product.title,
      quantity: quantity,
      payment_method: payment_method,
      image: product.images,
      product_id: product.id,
      product_amount: product.amount,
      shipbubble_id: shipbubble_id,
      product_description: product.body,
    });
    console.log(order);
    return order;
  }

  async createIncomingOrder(
    product_id: string,
    customer_id: string,
    quantity: number,
    shipbubble_id: string,
    payment_method: "WEB2" | "WEB3",
  ) {
    const customer = await this.userModel.findById(customer_id);
    if (!customer) {
      throw new BadRequestException("User not found");
    }

    const product = await this.productModel.findById(product_id);
    if (!product) return;

    const order = await this.incomingOrderModel.create({
      customer_id: customer.id,
      product_name: product.title,
      quantity: quantity,
      payment_method: payment_method,
      image: product.images,
      product_id: product.id,
      product_amount: product.amount,
      shipbubble_id: shipbubble_id,
      product_description: product.body,
    });
    console.log(order);
    return order;
  }

  async getIncomingOrders(customerId: string) {
    try {
      const customer = await this.userModel.findById(customerId);
      if (!customer) {
        throw new BadRequestException("User not found");
      }

      const orders = await this.incomingOrderModel
        .find({
          customer_id: customer.id,
        })
        .sort({created_at: -1}); // Add this line to sort in LIFO order

      if (orders.length < 1) {
        throw new BadRequestException("No incoming orders found");
      }
      return {
        success: true,
        data: orders,
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

  async getOutgoingOrders(customerId: string) {
    try {
      const customer = await this.userModel.findById(customerId);
      if (!customer) {
        throw new BadRequestException("User not found");
      }

      const orders = await this.outgoingOrderModel
        .find({
          farmer_id: customer.id,
        })
        .sort({created_at: -1}); // Add this line to sort in LIFO order

      if (orders.length < 1) {
        throw new BadRequestException("No outgoing orders found");
      }
      return {
        success: true,
        data: orders,
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
  // async handleWebhook(payload: any) {
  //   if (payload.status !== "completed") {
  //     return;
  //   }

  //   const farmerEmail = payload.ship_from.email;
  //   //const farmer = (await this.userService.findByEmail(farmerEmail)).user;

  //   const customerEmail = payload.ship_to.email;
  // //  const customer = (await this.userService.findByEmail(customerEmail)).user;

  //   if (payload.event === "shipment.cancelled") {
  //     this.userMailerService.orderCancelledCustomerMail(
  //       customerEmail,
  //       payload.ship_from.name,
  //       payload.ship_from.address,
  //       payload.ship_from.phone,
  //     );
  //     this.userMailerService.orderCancelledFarmerMail(
  //       farmerEmail,
  //       payload.ship_to.name,
  //       payload.ship_to.address,
  //       payload.ship_to.phone,
  //     );
  //   }
  //  }
}
