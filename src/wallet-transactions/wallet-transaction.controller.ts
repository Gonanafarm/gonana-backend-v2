import {Body, Controller, Get, Param, Post, Query, Req, UseGuards} from "@nestjs/common";
import {ApiResponse, ApiTags, ApiHeader} from "@nestjs/swagger";
import {IsString, IsNotEmpty} from "class-validator";
import {WalletTransactionService} from "./wallet-transaction.service";
import {WalletTransaction as WalletTransactionModel} from "./wallet-transaction.schema";
import {ApiBearerAuth} from "@nestjs/swagger";
import {JwtAuthGuard} from "../auth/jwt-auth.guard";
import {Request} from "express";
import {WalletSendFundDto} from "./dto";

@ApiTags("wallet-transactions")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller("api/catalog/wallet-transactions")
export class WalletTransactionController {
  constructor(private readonly dataService: WalletTransactionService) {}
  @Get("")
  @ApiResponse({
    status: 200,
    description: "Wallet transaction history",
    isArray: true,
    type: WalletTransactionModel,
  })
  get(@Req() req: Request, @Query("account_number") account_number: string) {
    return this.dataService.retrieveItems({account_number});
  }

  @Post("/transfer")
  @ApiResponse({
    status: 200,
    description: "Returns item by id",
    isArray: false,
    type: WalletTransactionModel,
  })
  async transfer(@Req() req: any, @Body() body: WalletSendFundDto) {
    let publisher_id = "";
    //@ts-ignore
    publisher_id = req.user?.sub ?? "";


    return this.dataService.onWalletTransferInternally(publisher_id, body)
  }
}
