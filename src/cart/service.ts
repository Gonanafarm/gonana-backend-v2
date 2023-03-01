/* eslint-disable no-useless-catch */
import {BadRequestException, Controller, Injectable} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import {Model} from "mongoose";
import {CartItem, CartItemDocument} from "./schema";
import {GenericService} from "../generic/generic.service";
import {OrderService} from "../order/order.service";

@Injectable()
export class CartItemService extends GenericService<CartItemDocument> {
  constructor(
    @InjectModel(CartItem.name) private model: Model<CartItemDocument>,
    private readonly orderService: OrderService,
  ) {
    super(model);
  }

  async createCartItem(publisher_id: string, payload: CartItem) {
    let doc = await this.dataModel
      .findOneAndUpdate(
        {
          publisher_id,
          product_id: payload.product_id,
        },
        {
          ...payload,
          publisher_id: publisher_id,
        },
        {
          upsert: true,
          new: true,
        },
      )
      .exec();
    return doc;
  }

  async placeOrder(publisher_id: string) {
    let items = await this.retrieveItems({publisher_id: publisher_id});

    let uniqueFarmsMap: {[key: string]: any[]} = {};

    items.forEach(element => {
      //@ts-ignore
      if (uniqueFarmsMap[element.farmer_id] == undefined) {
        //@ts-ignore
        uniqueFarmsMap[element.farmer_id] = [];
      }

      //@ts-ignore
      uniqueFarmsMap[element.farmer_id].push(element);
    });

    let orders = [];

    for (const [farmer_id, items] of Object.entries(uniqueFarmsMap)) {
      let res = await this.orderService.createOrder(
        publisher_id,
        items,
        farmer_id,
      );

      orders.push(res);
    }

    this.dataModel.deleteMany({publisher_id: publisher_id}).exec();

    return orders;
  }
}
