import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import {ApiResponse, ApiTags, ApiHeader} from "@nestjs/swagger";
import {WalletService} from "./wallet.service";
import {Wallet as WalletModel} from "./wallet.schema";
import {ApiBearerAuth} from "@nestjs/swagger";
import {JwtAuthGuard} from "../auth/jwt-auth.guard";
import {Request} from "express";
import { } from "./wallet.dto";

@ApiTags("wallets")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller("api/catalog/wallets")
export class WalletController {
  constructor(private readonly dataService: WalletService) {}
  @Get("")
  @ApiResponse({
    status: 200,
    description: "Returns list of Wallets",
    type: WalletModel,
  })
  get(@Req() req: Request) {
    let publisher_id = "";
    //@ts-ignore
    publisher_id = req.user?.sub ?? "";
    return this.dataService.dataModel.findOne({user_id: publisher_id});
  }
}
