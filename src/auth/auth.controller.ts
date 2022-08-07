import {
  Controller,
  Get,
  Post,
  Req,
  Param,
  UseGuards,
  Body,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Request } from "express";

import {
  ActivateParams,
  ForgottenPasswordDto,
  ResetPasswordDto,
  SignUpDto,
  LoginDto,
  AuthenticatedUser,
} from "./auth.interface";
import { AuthService } from "./auth.service";
import { getOriginHeader } from "../common/auth";
import { ApiBearerAuth, ApiResponse, ApiTags } from "@nestjs/swagger";
import { AppRequest } from "../generic/generic.interface";
import { UserService } from "../user/user.service";
import { UserPublicData } from "../user/user.dto";

@ApiTags("auth")
@ApiBearerAuth()
@Controller("api/auth")
export class AuthController {

  constructor(private readonly authService: AuthService, private readonly userService: UserService) { }

  @Get("activate/:userId/:activationToken")
  activate(@Param() params: ActivateParams) {
    return this.authService.activate(params);
  }

  @UseGuards(AuthGuard("local"))
  @Post("login")
  @ApiResponse({ type: AuthenticatedUser })
  login(@Req() req: AppRequest, @Body() loginDto: LoginDto) {
    return this.authService.login(req?.user);
  }

  @Post("signup")
  @ApiResponse({ type: AuthenticatedUser })
  async signup(@Body() signUpDto: SignUpDto, @Req() req: Request) {
    return this.authService.signUpUser(signUpDto, getOriginHeader(req));
  }

  @UseGuards(AuthGuard())
  @Get("me")
  @ApiResponse({type:UserPublicData})
  async getProfile(@Req() req: Request) {
    //@ts-ignore
    let profileDoc = await this.userService.findById(req.user.id);
    return profileDoc.getPublicData();
  }

  @UseGuards(AuthGuard())
  @Get("relogin")
  relogin(@Req() req: AppRequest) {
    return this.authService.login(req.user);
  }

  @Post("forgotten-password")
  forgottenPassword(@Body() body: ForgottenPasswordDto, @Req() req: Request) {
    return this.authService.forgottenPassword(body, getOriginHeader(req));
  }

  @Post("reset-password")
  resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body);
  }
}
