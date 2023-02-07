/* eslint-disable no-useless-catch */
import {
  ConflictException,
  Controller,
  forwardRef,
  Injectable,
  Inject,
  Module,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { paystackActions } from '../common/paystack/paystack.service';
import { Organization, OrganizationDocument } from './organisation.schema';

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectModel(Organization.name)
    private orgModel: Model<OrganizationDocument>,
  ) {}

  setupSubscription = (payload: {
    email: string;
    plan: string;
    subscription_code: string;
    email_token: string;
  }): Promise<any> => {
    return this.orgModel
      .updateOne(
        { business_email: payload.email },
        {
          subscription_code: payload.subscription_code,
          subscription_plan: payload.plan,
          email_token: payload.email_token,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      )
      .exec();
  };

  activateSubscription = (payload: {
    email: string;
    plan: string;
    interval: string;
    amount: number;
  }): Promise<any> => {
    return this.orgModel
      .updateOne(
        { business_email: payload.email },
        {
          subscription_status: 'activated',
          subscription_plan: payload.plan,
          subscription_fee: payload.amount,
          subscription_interval: payload.interval,
          subscription_activated_on: new Date() + '',
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      )
      .exec();
  };

  disableSubscription = (email: string): Promise<any> => {
    return this.orgModel
      .updateOne(
        { business_email: email},
        { subscription_status: 'deactivated' },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      )
      .exec();
  };

  subscribeToPlan = async (business_id: string, plan_code: string) => {
    let business = await this.orgModel.findById(business_id);

    let payload = await paystackActions.initSubscriptionTransaction({
      amount: 100,
      email: business?.business_email??"",
      plan: plan_code,
    });

    return  payload
  };

  cancelSubscription = async (business_id: string) => {
    let business = await this.orgModel.findById(business_id);
    return await paystackActions.disableSubscriptionTransaction({
      code: business?.subscription_code??"",
      email_token: business?.email_token??"",
    });
  };
}
