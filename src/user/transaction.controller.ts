import {
  Controller,
  Get,
  Req,
  UseGuards,
  Post,
  Body,
  HttpCode,
  Query,
} from "@nestjs/common";
import {Request} from "express";
import {UserService} from "./user.service";
import {JwtAuthGuard} from "../auth/jwt-auth.guard";
import {
  GetUserTransactonsDto,
  KycVerification,
  ResolveAccountNumber,
  TransferEthDto,
  TransferFundsDto,
  TransferToUser,
} from "./user.dto";

@Controller("api/transaction")
export class TransactionController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Post("/create-virtual-account")
  virtualAccount(@Req() req: Request) {
    //@ts-ignore
    const user_id = req.user?.id;

    return this.userService.virtualAccount(user_id);
  }

  @UseGuards(JwtAuthGuard)
  @Get("/resolve-account-number")
  getBanks(@Query() body: ResolveAccountNumber) {
    return this.userService.resolveAccountNumber(
      body.account_number,
      body.bank,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post("/transferToEscrow")
  sendToEscrow(@Body("amount") amount: string, @Req() req: Request) {
    //@ts-ignore
    const user_id = req.user?.id;
    return this.userService.transferToEscrowFromUser(amount, user_id);
  }
  @UseGuards(JwtAuthGuard)
  @Post("/transferFromEscrow")
  sendFromEscrow(@Body("amount") amount: string, @Req() req: Request) {
    //@ts-ignore
    const user_id = req.user?.id;
    return this.userService.transferFromEscrowToUser(user_id, amount);
  }
  @UseGuards(JwtAuthGuard)
  @Post("recover-virtual-account")
  recoverVirtualAccount(@Body("bvn") bvn: string, @Req() req: Request) {
    //@ts-ignore
    const user_id = req.user?.id;
    return this.userService.recoverVirtualAccount(bvn, user_id);
  }

  @UseGuards(JwtAuthGuard)
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

  @UseGuards(JwtAuthGuard)
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

  @UseGuards(JwtAuthGuard)
  @Get("bank-details")
  getBankDetails() {
    return this.userService.getBanks();
  }

  @UseGuards(JwtAuthGuard)
  @Post("/transfer")
  transfer(@Body() body: TransferFundsDto, @Req() req: Request) {
    //@ts-ignore
    const user_id = req.user?.id;

    return this.userService.transfer(
      user_id,
      body.accountNumber,
      body.bankName,
      body.amount,
      body.accountName,
      body?.narration,
    );
  }

  @Post("/verify-transaction")
  verifyTransaction(@Body() body: any) {
    return this.userService.verifyTransaction(body);
  }

  @UseGuards(JwtAuthGuard)
  @Get("/user-balance")
  getUserBalance(@Req() req: Request) {
    //@ts-ignore
    const user_id = req.user?.id;
    return this.userService.getUserBalance(user_id);
  }

  @UseGuards(JwtAuthGuard)
  @Get("/user-transactions")
  getUserTransactions(
    @Req() req: Request,
    @Query() body: GetUserTransactonsDto,
  ) {
    //@ts-ignore
    const user_id = req.user?.id;
    return this.userService.getUserTransactions(user_id, body.page, body.limit);
  }

  @UseGuards(JwtAuthGuard)
  @Post("/kyc")
  verify(@Req() req: Request, @Body() data: KycVerification) {
    //@ts-ignore
    const user_id = req.user?.id;
    return this.userService.kycVerification(user_id, data.dob, data.bvn);
  }

  @UseGuards(JwtAuthGuard)
  @Get("/ccd-balance")
  getCryptoWalletBalance(@Req() req: Request) {
    //@ts-ignore
    const user_id = req.user?.id;
    return this.userService.getCcdWalletBalance(user_id);
  }

  @UseGuards(JwtAuthGuard)
  @Get("/arbitrum-balance")
  getArbitrumBalance(@Req() req: Request) {
    //@ts-ignore
    const user_id = req.user?.id;
    return this.userService.getArbitrumWalletBalance(user_id);
  }

  @UseGuards(JwtAuthGuard)
  @Post("/send-eth")
  sendEth(@Req() req: Request, @Body() data: TransferEthDto) {
    //@ts-ignore
    const user_id = req.user?.id;
    return this.userService.sendEth(user_id, data.amount, data.address);
  }

  @UseGuards(JwtAuthGuard)
  @Post("/eth-ngn")
  ethToNgn(@Body("eth") data: string) {
    return this.userService.convertEthToNgn(data);
  }

  @UseGuards(JwtAuthGuard)
  @Post("/ngn-eth")
  ngnToEth(@Body("ngn") data: string) {
    return this.userService.convertNgntoEth(data);
  }

  @UseGuards(JwtAuthGuard)
  @Post("/ngn-usd")
  ngnToUsd(@Body("ngn") data: string) {
    return this.userService.convertNgntoUsd(data);
  }

  @Post("/ngn-arb")
  ngnToArb(@Body("ngn") data: string) {
    return this.userService.convertNgntoArb(data);
  }

  @Post("/ngn-ccd")
  ngnToCcd(@Body("ngn") data: string) {
    return this.userService.convertNgntoCcd(data);
  }

  @Post("/ccd-ngn")
  ccdToNgn(@Body("ccd") data: string) {
    return this.userService.convertCcdtoNgn(data);
  }

  @Post("/ccd-usd")
  ccdToUsd(@Body("ccd") data: string) {
    return this.userService.convertCcdtoUsd(data);
  }

  @UseGuards(JwtAuthGuard)
  @Post("/transfer-ccd")
  sendCcd(@Body() data: any, @Req() req: Request) {
    //@ts-ignore
    const user_id = req.user?.id;
    return this.userService.transferCcd(data.amount, data.recipientId, user_id);
  }

  @UseGuards(JwtAuthGuard)
  @Post("/withdraw-ccd")
  withdrawCcd(@Body() data: any, @Req() req: Request) {
    //@ts-ignore
    const user_id = req.user?.id;
    return this.userService.withdrawCcd(data.amount, data.recipient, user_id);
  }

  @UseGuards(JwtAuthGuard)
  @Post("/pay-with-ccd")
  payWithCCd(@Body() data: any, @Req() req: Request) {
    //@ts-ignore
    const user_id = req.user?.id;
    return this.userService.payWithCCd(data.amount, data.recipientId, user_id);
  }
  @Post("test")
  test(@Body() data: any) {
    console.log(data);
    return;
  }
}
