/* eslint-disable no-useless-catch */
import { BadRequestException, Controller, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from './order.schema';
import { GenericService } from '../generic/generic.service';
import { PublishOrderDto } from './order.dto';
import { paystackActions } from '../common/paystack/paystack.service';
import { typography } from 'native-base/lib/typescript/theme/styled-system';
import { AxiosError } from 'axios';
import { OrganizationService } from '../organisation/organisation.service';

@Injectable()
export class OrderService extends GenericService<OrderDocument> {
  constructor(
    @InjectModel(Order.name) private model: Model<OrderDocument>,
    private businessService: OrganizationService,
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

  async pay(publisher_id: string, order_id: string) {
    let order =await this.dataModel.findById(order_id) as unknown as Order;
    
    //@ts-ignore
    if (order.payment_url) {
      //@ts-ignore
      return order.payment_url;
    }

    // get business sub account
    const business = await this.businessService.getItem(order.org_id);

    if (!business.paystack_int) {
      throw new BadRequestException(
        'Payout account has not been configured. Configure payout account to accept digital payments.',
      );
    }

    try {
      let res = await paystackActions.initPaymentTransaction({
        subaccount: business.paystack_int.subaccount_code,
        amount: order.sum_total * 100,
        //use customer email later
        email: 'joshuanwafor01@gmail.com',
        //@ts-ignore
        reference: `PAYMENT-${order?._id}`,
        meta: {
          business_id: order.org_id,
          //@ts-ignore
          order_id: order?._id,
        },
      });

      // update order payment url
      this.model
        .findOneAndUpdate(
          {
            _id: order_id,
          },
          {
            //@ts-ignore
            payment_url: res.authorization_url,
            payment_status: 'awaiting-payment',
          },
        )
        .exec();
      return res.authorization_url;
    } catch (err) {
      let axiosError: AxiosError = err as AxiosError;

      console.log(axiosError.response);
      throw err;
    }
  }
}
