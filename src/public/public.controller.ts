import {Body, Controller, Post} from "@nestjs/common";
import {OrderService} from "../order/order.service";
import {paystackActions} from "../common/paystack/paystack.service";
import {UserService} from "../user/user.service";
import {MonifyTransactionEventPayload} from "./monify.event.interface";
import {WalletTransactionService} from "../wallet-transactions/wallet-transaction.service";

@Controller("")
export class PublicController {
  constructor(private readonly walletTransaction: WalletTransactionService) {}

  @Post("/monify-hook")
  monifyHook(@Body() body: any) {
    let payload: MonifyTransactionEventPayload = body;
    console.log(JSON.stringify(body), "hook");
    if (payload.eventType == "SUCCESSFUL_TRANSACTION") {
      this.walletTransaction.onBankAccountFundedExternally(payload);
    }
  }

  @Post("/approve-hook")
  approveHook(@Body() body: any) {
    console.log(JSON.stringify(body), "hook");
  }
}
