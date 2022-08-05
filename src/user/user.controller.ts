import {
  Controller,
  Get,
  Post,
  Req,
  Param,
  UseGuards,
  Body,
} from "@nestjs/common";
import { Request } from "express";
import { ApiBearerAuth, ApiResponse, ApiTags } from "@nestjs/swagger";
import { AttachAccountDto } from "../organisation/organisation.dto";
import { UserService } from "./user.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@ApiTags("account")
@ApiBearerAuth()
@Controller("api/account")
@UseGuards(JwtAuthGuard)
export class UserController {

  constructor(private readonly userService: UserService) { }

  @Get("me/subscribe/:plan_code")
  @ApiResponse({})
  subscribeToPlan(@Req() req: Request, @Param("plan_code") plan_code: string) {
    //@ts-ignore
    return this.userService.setupSubscriptiion(req.user?.email ?? "", plan_code);
  }


  @Get("me/profile")
  @ApiResponse({})
  async getProfile(@Req() req: Request) {
    //@ts-ignore
    let profileDoc = await this.userService.findById(req.user.id);
    return profileDoc.getPublicData();
  }

  @Post("me/attach-bankaccount")
  @ApiResponse({})
  attachBankAccount(@Req() req: Request, @Body() body: AttachAccountDto) {
    //@ts-ignore
    return this.userService.attachBankAccount(body, req.user?.id ?? "")
  }

}
