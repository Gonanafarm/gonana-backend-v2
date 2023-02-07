import { Body, Controller, Delete, Get, Param, Put, Query, Req, UseGuards } from "@nestjs/common";
import { ApiResponse, ApiTags, ApiHeader } from "@nestjs/swagger";
import { IsString, IsNotEmpty } from "class-validator";
import {  TransactionService } from "./transaction.service";
import {  Transaction as  TransactionModel } from "./transaction.schema"
import { ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Request } from "express";

@ApiTags("transactions")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller("api/catalog/transactions")
export class  TransactionController {

  constructor(private readonly dataService:  TransactionService) { }
  @Get("")
  @ApiResponse({ status: 200, description: 'Returns list of  Transactions', isArray: true, type:  TransactionModel })
  get(@Req() req: Request) {
    let publisher_id="";
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    publisher_id= req.user?.sub??"";
    return this.dataService.retrieveItems({ publisher_id: publisher_id })
  }

  @Get(":item")
  @ApiResponse({ status: 200, description: 'Returns item by id', isArray: false, type:  TransactionModel })
  async getById(@Param("item") item: string) {
    return await this.dataService.getItem(item);
  }
}
