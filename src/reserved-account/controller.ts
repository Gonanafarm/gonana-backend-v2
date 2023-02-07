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
import {IsString, IsNotEmpty} from "class-validator";
import {ReservedAccountService} from "./service";
import {ReservedAccount as ReservedAccountModel} from "./schema";
import {ApiBearerAuth} from "@nestjs/swagger";
import {JwtAuthGuard} from "../auth/jwt-auth.guard";
import {Request} from "express";

@ApiTags("ReservedAccounts")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller("api/catalog/ReservedAccounts")
export class ReservedAccountController {
  constructor(private readonly dataService: ReservedAccountService) {}

  @Get("")
  @ApiResponse({
    status: 200,
    description: "Return user ReservedAccounts",
    type: ReservedAccountModel,
  })
  get(@Req() req: Request) {
    let publisher_id = "";
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    publisher_id = req.user?.sub ?? "";
    return this.dataService.dataModel.findOne({user_id: publisher_id});
  }

  @Get(":item")
  @ApiResponse({
    status: 200,
    description: "Returns item by id",
    isArray: false,
    type: ReservedAccountModel,
  })
  async getById(@Param("item") item: string) {
    return await this.dataService.getItem(item);
  }
}
