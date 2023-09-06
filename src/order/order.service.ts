/* eslint-disable no-useless-catch */
import {BadRequestException, Controller, Injectable} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import {Model} from "mongoose";
import {Order, OrderDocument} from "./order.schema";
import {GenericService} from "../generic/generic.service";
import {CartItem} from "src/cart/schema";

@Injectable()
export class OrderService extends GenericService<OrderDocument> {
  constructor(@InjectModel(Order.name) private model: Model<OrderDocument>) {
    super(model);
  }

  // async createOrder(
  //   publisher_id: string,
  //   items: CartItem[],
  //   farmer_id: string,
  // ) {
  //   let order_sum = items.reduce((c, e) => {
  //     return c + (e.quantity ?? 1) * e.amount ?? 0;
  //   }, 0);

  //   let newOrder = await this.create(publisher_id, {
  //     items: items,
  //     sum_total: order_sum,
  //     farmer_id: farmer_id,
  //     customer_id: publisher_id,
  //     payment_method: "wallet",
  //     payment_status: "pending",
  //   });
  //   return newOrder;
  // }
}
