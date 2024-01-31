import {
  Controller,
  Get,
  Req,
  Param,
  UseGuards,
  Post,
  Body,
  HttpCode,
  Patch,
  Query,
} from "@nestjs/common";
import {Request} from "express";
import {UserService} from "./user.service";
import {JwtAuthGuard} from "../auth/jwt-auth.guard";
import {
  GetUserTransactonsDto,
  ResolveAccountNumber,
  TransferEthDto,
  TransferFundsDto,
  TransferToUser,
} from "./user.dto";

@Controller("api/transaction")
@UseGuards(JwtAuthGuard)
export class TransactionController {
  constructor(private readonly userService: UserService) {}

  @Post("/create-virtual-account")
  virtualAccount(@Req() req: Request, @Body("bvn") bvn: string) {
    //@ts-ignore
    const user_id = req.user?.id;

    return this.userService.virtualAccount(bvn, user_id);
  }
  @Get("/resolve-account-number")
  getBanks(@Query() body: ResolveAccountNumber) {
    return this.userService.resolveAccountNumber(
      body.account_number,
      body.bank,
    );
  }

  @Post("/transfer-to-user")
  @HttpCode(200)
  transferToUser(@Body() body: TransferToUser, @Req() req: Request) {
    //@ts-ignore
    const user_id = req.user?.id;
    return this.userService.transferToUser(
      user_id,
      body.email,
      body.amount,
      body.narration,
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
  transfer(@Body() body: TransferFundsDto, @Req() req: Request) {
    //@ts-ignore
    const user_id = req.user?.id;

    return this.userService.transfer(
      user_id,
      body.accountNumber,
      body.bankName,
      body.amount,
      body?.narration,
    );
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
  getUserTransactions(
    @Req() req: Request,
    @Query() body: GetUserTransactonsDto,
  ) {
    //@ts-ignore
    const user_id = req.user?.id;
    return this.userService.getUserTransactions(user_id, body.page, body.limit);
  }
  @Get("/crypto-balance")
  getCryptoWalletBalance(@Req() req: Request) {
    //@ts-ignore
    const user_id = req.user?.id;
    return this.userService.getCryptoWalletBalance(user_id);
  }

  @Post("/send-eth")
  sendEth(@Req() req: Request, @Body() data: TransferEthDto) {
    //@ts-ignore
    const user_id = req.user?.id;
    return this.userService.sendEth(user_id, data.amount, data.address);
  }

  @Post("/eth-ngn")
  ethToNgn(@Body("eth") data: string) {
    return this.userService.convertEthToNgn(data);
  }
  @Post("/ngn-eth")
  ngnToEth(@Body("ngn") data: string) {
    return this.userService.convertNgntoEth(data);
  }
}
