/* eslint-disable no-useless-catch */
import { BadRequestException, Controller, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from './order.schema';
import { GenericService } from '../generic/generic.service';
import { PublishOrderDto } from './order.dto';


@Injectable()
export class OrderService extends GenericService<OrderDocument> {
  constructor(
    @InjectModel(Order.name) private model: Model<OrderDocument>,
  ) {
    super(model);
  }

  async createOrder(publisher_id: string, payload: PublishOrderDto) {
    let order_sum = payload.items.reduce((c, e) => {
      return c + (e.quantity ?? 1) * e.amount ?? 0;
    }, 0);
    let newOrder = await this.create(publisher_id, {
      ...payload,
      sum_total: order_sum,
    });
    return newOrder;
  }


}
