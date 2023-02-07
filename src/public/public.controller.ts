import {
  Body,
  Controller,
  Post,
} from "@nestjs/common";
import { OrderService } from "../order/order.service";
import { SubscriptionService } from "../organisation/subscription.service";
import {paystackActions} from "../common/paystack/paystack.service";
import {UserService} from "../user/user.service";
import {
  TSubscriptionDisabled,
  TSubscriptionNotRenewing,
  TTransactionCharge,
} from "./paystack.events.interface";

@Controller("public/")
export class PublicController {
  constructor(private readonly userService: UserService,private readonly orderService: OrderService,
    private readonly subscriptionService:SubscriptionService) {}
  

  @Post('paystack-hook')
  async paystackEventHandler(@Body() body: any) {
    console.log(body);
    if (body.event == 'charge.success') {
      const parsedBody: TTransactionCharge = body;
      this.handlePaystackChargeEvents(parsedBody);
    }

    if (body.event == 'subscription.not_renew') {
      const parsedBody: TSubscriptionNotRenewing = body;
      // disable user plan
      try {
        let transactionObj = { ...parsedBody.data };
        transactionObj.authorization = undefined;
        this.subscriptionService.disableSubscription(
          transactionObj.customer.email,
        );
      } catch (e) {
        console.log(e);
      }
    }

    if (body.event == 'subscription.disable') {
      const parsedBody: TSubscriptionDisabled = body;
      try {
        let transactionObj = { ...parsedBody.data };
        // disable active subscription
      } catch (e) {
        console.log(e);
      }
    }

    if (body.event == 'subscription.create') {
      const parsedBody: TSubscriptionDisabled = body;
      try {
        let transactionObj = { ...parsedBody.data };

        this.subscriptionService.setupSubscription({
          email: transactionObj.customer.email,
          email_token: transactionObj.email_token,
          subscription_code: transactionObj.subscription_code,
          plan: transactionObj.plan.plan_code,
        });
      } catch (e) {
        console.log(e);
      }
    }

    return 'positive';
  }

  async handlePaystackChargeEvents(payload: TTransactionCharge) {
    let reference = payload.data.reference;
    try {
      let check = await paystackActions.verifyTransaction(reference);
      // continue to activate value
      if (check) {
        // either its a payment for an event  or  a payment for suscription
        let payment_for = reference.split('-')[0];

        // match charge for order
        if (payment_for == 'ORDER') {
          this.orderService.updateItem(reference.split('-')[1], {
            payment_status: 'completed',
          });
          return;
        }

        // match charge for subscription
        if (payload.data.plan.plan_code) {
          // captured subscription payment
          let transactionObj = { ...payload.data };
          transactionObj.authorization = undefined;
          this.subscriptionService.activateSubscription({
            email: transactionObj.customer.email,
            plan: transactionObj.plan.plan_code,
            interval: transactionObj.plan.interval,
            amount: transactionObj.amount
          });
          return;
        }
        // continue for event registeration
      }
    } catch (e) {
      console.log(e);
    }
  }
}
