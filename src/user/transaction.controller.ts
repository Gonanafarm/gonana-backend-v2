import {
  Controller,
  Get,
  Req,
  Param,
  UseGuards,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
  Patch,
  Query,
} from "@nestjs/common";
import {Request} from "express";
import {UserService} from "./user.service";
import {JwtAuthGuard} from "../auth/jwt-auth.guard";
import {AuthGuard} from "@nestjs/passport";
import {
  ResolveAccountNumber,
  UpdateUserDto,
  TransferFundsDto,
  UserPublicData,
} from "./user.dto";

@Controller("api/transaction")
@UseGuards(JwtAuthGuard)
export class TransactionController {
  constructor(private readonly userService: UserService) {}

  @Post("/create-virtual-account")
  virtualAccount(@Req() req: Request, @Body("bvn") bvn: string) {
    //@ts-ignore
    const user_id = req.user?.id;

    return this.userService.virtualAccount("Gonana", bvn, user_id);
  }
  @Get("/resolve-account-number")
  getBanks(@Query() body: ResolveAccountNumber) {
    return this.userService.resolveAccountNumber(
      body.account_number,
      body.bank,
    );
  }
  @Post("/save-account-number")
  saveAccountNumber(@Body() body: ResolveAccountNumber, @Req() req: Request) {
    //@ts-ignore
    const user_id = req.user?.id;
    return this.userService.saveAccountNumber(
      body.account_number,
      body.bank,
      user_id,
    );
  }
  @Get("bank-details")
  getBankDetails() {
    return this.userService.getBanks();
  }

  @Post("/transfer")
  transfer(@Body() body: TransferFundsDto) {
    return this.userService.transferFunds(body);
  }
  @Post("/verify-transaction")
  verifyTransaction(@Body() body: any) {
    return this.userService.verifyTransaction(body);
  }
  @Get("/user-balance")
  getUserBalance(@Req() req: Request) {
    //@ts-ignore
    const user_id = req.user?.id;
    return this.userService.getUserBalance(user_id);
  }
  @Get("/user-transactions")
  getUserTransactions(@Req() req: Request) {
    //@ts-ignore
    const user_id = req.user?.id;
    return this.userService.getUserTransactions(user_id);
  }
}
