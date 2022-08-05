import { Body, CacheInterceptor, Controller, Delete, Get, Headers, Inject, Module, Param, Post, Put, Query, Req, UseGuards, UseInterceptors } from "@nestjs/common";
import { ApiTags, ApiResponse, ApiBearerAuth, ApiHeader } from "@nestjs/swagger";
import { paystackActions } from "../common/paystack/paystack.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { UserService } from "../user/user.service";
import { TSubscriptionDisabled, TSubscriptionNotRenewing, TTransactionCharge } from "./paystack.events.interface";


@Controller("public/")
export class PublicController {

  constructor(private readonly userService: UserService,
  ) {

  }

  @Post("paystack-hook")
  async paystackEventHandler(@Body() body: any) {
    if (body.event == "charge.success") {

      const parsedBody: TTransactionCharge = body;
      let reference = parsedBody.data.reference;
      try {
        let check = await paystackActions.verifyTransaction(
          reference
        );
        // continue to activate value
        if (check) {
          // either its a payment for an event  or  a payment for suscription
          if (parsedBody.data.plan.plan_code) {
            // captured subscription payment
            let transactionObj = { ...parsedBody.data };
            transactionObj.authorization = undefined;
            this.userService.enableAccountSubscriptionStatus(parsedBody.data.customer.email, parsedBody.data.plan.plan_code, transactionObj);
            return
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
        let transactionObj = { ...parsedBody.data };
        transactionObj.authorization = undefined;
        this.userService.disableAccountSubscriptionStatus(parsedBody.data.customer.email, transactionObj);
      } catch (e) {
        console.log(e);
      }
    }

    if (body.event == "subscription.disable") {
      const parsedBody: TSubscriptionDisabled = body;
      try {
        let transactionObj = { ...parsedBody.data };
        transactionObj.authorization = undefined;
        this.userService.disableAccountSubscriptionStatus(parsedBody.data.customer.email, transactionObj);
      } catch (e) {
        console.log(e);
      }
    }

    return "positive"

  }

}
