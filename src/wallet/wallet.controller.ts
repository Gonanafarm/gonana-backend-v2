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
import { WalletSendFundDto } from "./wallet.dto";

@ApiTags("wallets")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller("api/catalog/Wallets")
export class WalletController {
  constructor(private readonly dataService: WalletService) {}
  @Get("")
  @ApiResponse({
    status: 200,
    description: "Returns list of Wallets",
    isArray: true,
    type: WalletModel,
  })
  get(@Req() req: Request) {
    let publisher_id = "";
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    publisher_id = req.user?.sub ?? "";
    return this.dataService.retrieveItems({publisher_id: publisher_id});
  }

  @Post("/transfer")
  @ApiResponse({status: 200, description: "", isArray: true, type: WalletModel})
  transfer(@Req() req: Request, @Body() body: WalletSendFundDto) {
    let publisher_id = "";
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    publisher_id = req.user?.sub ?? "";
    
  }

  @Get(":item")
  @ApiResponse({
    status: 200,
    description: "Returns item by id",
    isArray: false,
    type: WalletModel,
  })
  async getById(@Param("item") item: string) {
    return await this.dataService.getItem(item);
  }
}
