import {Body, Controller, Post} from "@nestjs/common";
import {OrderService} from "../order/order.service";
import {paystackActions} from "../common/paystack/paystack.service";
import {UserService} from "../user/user.service";

@Controller("")
export class PublicController {
  constructor() {}


  @Post("/approve-hook")
  approveHook(@Body() body: any) {
    console.log(JSON.stringify(body), "hook");
  }
}
