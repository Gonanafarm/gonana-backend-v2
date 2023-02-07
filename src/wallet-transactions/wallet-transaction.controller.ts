import { Body, Controller, Delete, Get, Param, Put, Query, Req, UseGuards } from "@nestjs/common";
import { ApiResponse, ApiTags, ApiHeader } from "@nestjs/swagger";
import { IsString, IsNotEmpty } from "class-validator";
import { WalletTransactionService } from "./wallet-transaction.service";
import { WalletTransaction as WalletTransactionModel } from "./wallet-transaction.schema"
import { ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Request } from "express";



@ApiTags("wallet-transactions")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller("api/catalog/wallet-transactions")
export class WalletTransactionController {

  constructor(private readonly dataService: WalletTransactionService) { }
  @Get("")
  @ApiResponse({ status: 200, description: 'Returns list of WalletTransactions', isArray: true, type: WalletTransactionModel })
  get(@Req() req: Request) {
    let publisher_id="";
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    publisher_id= req.user?.sub??"";
    return this.dataService.retrieveItems({ publisher_id: publisher_id })
  }

  @Get(":item")
  @ApiResponse({ status: 200, description: 'Returns item by id', isArray: false, type: WalletTransactionModel })
  async getById(@Param("item") item: string) {
    return await this.dataService.getItem(item);
  }
}
