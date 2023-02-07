import {
  Body,
  CacheInterceptor,
  Controller,

  Post,

} from "@nestjs/common";
import {ApiTags, ApiResponse, ApiBearerAuth, ApiHeader} from "@nestjs/swagger";
import {paystackActions} from "../common/paystack/paystack.service";
import {UserService} from "../user/user.service";
import {
  TSubscriptionDisabled,
  TSubscriptionNotRenewing,
  TTransactionCharge,
} from "./paystack.events.interface";

@Controller("public/")
export class PublicController {
  constructor(private readonly userService: UserService) {}

  @Post("paystack-hook")
  async paystackEventHandler(@Body() body: any) {
    if (body.event == "charge.success") {
      const parsedBody: TTransactionCharge = body;
      let reference = parsedBody.data.reference;
      try {
        let check = await paystackActions.verifyTransaction(reference);
        // continue to activate value
        if (check) {
          // either its a payment for an event  or  a payment for suscription
          if (parsedBody.data.plan.plan_code) {
            // captured subscription payment
            let transactionObj = {...parsedBody.data};
            transactionObj.authorization = undefined;
            let customer_email = parsedBody.data.customer.email;
            //  this.userService.enableAccountSubscriptionStatus(, parsedBody.data.plan.plan_code, transactionObj);
            return;
          }
          // continue for event registeration
        }
      } catch (e) {
        console.log(e);
      }
    }

    if (body.event == "subscription.not_renew") {
      const parsedBody: TSubscriptionNotRenewing = body;
      // disable user plan
      try {
        let transactionObj = {...parsedBody.data};
        transactionObj.authorization = undefined;
      
      } catch (e) {
        console.log(e);
      }
    }

    if (body.event == "subscription.disable") {
      const parsedBody: TSubscriptionDisabled = body;
      try {
        let transactionObj = {...parsedBody.data};
        transactionObj.authorization = undefined;
       
      } catch (e) {
        console.log(e);
      }
    }

    return "positive";
  }
}
