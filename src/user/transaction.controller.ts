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
  CreateVirtualAccount,
  GetUserTransactonsDto,
  KycVerification,
  ResolveAccountNumber,
  TransferEthDto,
  TransferFundsDto,
  TransferToUser,
} from "./user.dto";
import {ConcordiumService} from "./concordium.service";

@Controller("api/transaction")
export class TransactionController {
  constructor(
    private readonly userService: UserService,
    private readonly ccdService: ConcordiumService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post("/create-virtual-account")
  virtualAccount(@Req() req: Request, @Body() data: CreateVirtualAccount) {
    //@ts-ignore
    const user_id = req.user?.id;
    return this.userService.virtualAccount(
      user_id,
      data.gender,
      data.bvn,
      data.dob,
      data.address,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get("/resolve-account-number")
  getBanks(@Query() body: ResolveAccountNumber) {
    return this.userService.resolveAccountNumber(
      body.account_number,
      body.bank,
    );
  }

  @Post("/webhook")
  async handleWebhook(@Query("event") event: string, @Body() data: any) {
    console.log("event:", event);
    console.log("data:", data);

    return this.userService.handleWebhook(event, data);
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
  // @UseGuards(JwtAuthGuard)
  // @Post("recover-virtual-account")
  // recoverVirtualAccount(@Body("bvn") bvn: string, @Req() req: Request) {
  //   //@ts-ignore
  //   const user_id = req.user?.id;
  //   return this.userService.recoverVirtualAccount(bvn, user_id);
  // }

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

  // @Post("/verify-transaction")
  // verifyTransaction(@Body() body: any) {
  //   return this.userService.verifyTransaction(body);
  // }

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

  // @UseGuards(JwtAuthGuard)
  // @Post("/kyc")
  // verify(@Req() req: Request, @Body() data: KycVerification) {
  //   //@ts-ignore
  //   const user_id = req.user?.id;
  //   return this.userService.kycVerification(user_id, data.dob, data.bvn);
  // }

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
  sendEth(@Req() req: Request, @Body() data: any) {
    //@ts-ignore
    const user_id = req.user?.id;
    console.log(user_id, data.amount, data.recipientId);
    return this.userService.sendEth(user_id, data.amount, data.recipientId);
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
  @Get("/gonatoken-balance")
  getGonaTokenBalance(@Req() req: Request) {
    //@ts-ignore
    const user_id = req.user.id;
    return this.userService.getGonaTokenBalance(user_id);
  }
  @UseGuards(JwtAuthGuard)
  @Post("/transfer-gona")
  transferGona(@Req() req: Request, @Body() data: any) {
    //@ts-ignore
    const user_id = req.user.id;
    console.log(data);

    return this.userService.transferGonaToken(
      user_id,
      data.amount,
      data.recipient,
    );
  }
  @UseGuards(JwtAuthGuard)
  @Post("/withdraw-gona")
  withdrawGona(@Req() req: Request, @Body() data: any) {
    //@ts-ignore
    const user_id = req.user.id;
    return this.userService.withdrawGona(user_id, data.amount, data.recipient);
  }
  @UseGuards(JwtAuthGuard)
  @Post("/ngn-usd")
  ngnToUsd(@Body("ngn") data: string) {
    return this.userService.convertNgntoUsd(data);
  }

  @UseGuards(JwtAuthGuard)
  @Post("/deposit-gona")
  deposit(@Req() req: Request, @Body("amount") amount: number) {
    //@ts-ignore
    const user_id = req.user.id;
    return this.userService.depositGona(user_id, amount);
  }

  @UseGuards(JwtAuthGuard)
  @Post("/deposit-ccd")
  depositCcd(@Req() req: Request, @Body("amount") amount: number) {
    //@ts-ignore
    const user_id = req.user.id;
    return this.ccdService.deposit(amount, user_id);
  }

  @UseGuards(JwtAuthGuard)
  @Post("/send-gona")
  sendGona(@Req() req: Request, @Body() data: any) {
    //@ts-ignore
    const user_id = req.user.id;
    return this.userService.sendGona(user_id, data.amount, data.recipient);
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

  @Post("/eth-usd")
  ethToUsd(@Body("eth") data: string) {
    return this.userService.convertEthToUsd(data);
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
  @Get("ccd")
  getCcdTransactions(@Req() req: Request) {
    //@ts-ignore
    const user_id = req.user?.id;
    return this.userService.getCcdTransactions(user_id);
  }

  // @Post("test")
  // test(@Body() data: any) {
  //   return this.ccdService.withdrawFromEscrow(data.id)
  // }

  // @Post("airdrop")
  // async createToken() {
  //   return this.userService.airdropTokens();
  // }

  // @Post("simbuy")
  // async simbuy(@Body() data: any) {
  //   return this.userService.simulateBuy();
  // }
}
