import {
  Controller,
  Get,
  Post,
  Req,
  Param,
  UseGuards,
  Body,
  Res,
  Response,
  HttpStatus,
  Put,
  Header,
  Delete,
  HttpCode,
} from "@nestjs/common";
import {AuthGuard} from "@nestjs/passport";
import {Request} from "express";

import {
  ActivateParams,
  ForgottenPasswordDto,
  ResetPasswordDto,
  SignUpDto,
  LoginDto,
  AuthenticatedUser,
  UserProfileResponse,
  OtpDto,
  DeleteUserDto,
} from "./auth.interface";
import {AuthService} from "./auth.service";
import {getOriginHeader} from "../common/auth";
import {
  ApiBearerAuth,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import {AppRequest} from "../generic/generic.interface";
import {UserService} from "../user/user.service";
import {User} from "../user/user.schema";
import {UpdateUserDto} from "../user/user.dto";
import {JwtAuthGuard} from "./jwt-auth.guard";

@ApiTags("auth")
@ApiBearerAuth()
@Controller("api/auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Get("activate/:userId/:activationToken")
  activate(@Param() params: ActivateParams) {
    return this.authService.activate(params);
  }

  @UseGuards(AuthGuard("local"))
  @Post("login")
  @ApiResponse({type: AuthenticatedUser})
  login(@Req() req: AppRequest, @Body() loginDto: LoginDto) {
    return this.authService.login(req?.user);
  }

  @UseGuards(AuthGuard("local"))
  @Post("login-admin")
  @ApiResponse({type: AuthenticatedUser})
  loginAdmin(@Req() req: AppRequest, @Body() loginDto: LoginDto) {
    return this.authService.loginAdmin(req?.user);
  }

  @Post("signup")
  @ApiResponse({type: AuthenticatedUser})
  async signup(@Body() signUpDto: SignUpDto, @Req() req: Request) {
    return this.authService.signUpUser(signUpDto, getOriginHeader(req));
  }

  @Post("verify-otp")
  @HttpCode(200)
  async verifyOtp(@Body() otp: OtpDto) {
    return this.userService.verifyOTP(otp.otp);
  }

  @Post("resend-otp")
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async resendOtp(@Req() req: Request) {
    //@ts-ignore
    const email = req.user?.email;
    return this.userService.resendOtp(email);
  }

  @UseGuards(AuthGuard())
  @Get("me")
  @ApiResponse({type: UserProfileResponse})
  async getProfile(@Req() req: Request): Promise<UserProfileResponse> {
    //@ts-ignore
    let profileDoc = await this.userService.findById(req.user?.id);
    return {
      user: profileDoc.getPublicData(),
    };
  }

  @Put("update-profile")
  @ApiResponse({type: User})
  updateUser(@Req() req: Request, @Body() body: UpdateUserDto) {
    //@ts-ignore
    let publisher_id = req?.user?.id;

    return this.userService.updateItem(publisher_id, body);
  }

  @Post("forgotten-password")
  @HttpCode(200)
  forgottenPassword(@Body() body: ForgottenPasswordDto) {
    return this.authService.forgottenPassword(body.email);
  }

  @Post("VerifyPasswordOtp")
  @HttpCode(200)
  verifyPasswordOtp(@Body("otp") body: string){
    return this.authService.verifyOtp(body);
  }

  @Post("reset-password")
  @HttpCode(200)
  resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body.email, body.password);
  }

  @UseGuards(AuthGuard())
  @Post("resend-activation-credentials")
  resendActivationToken(@Req() req: Request) {
    //@ts-ignore
    let user_id = req.user?.id ?? "";
    console.log(user_id, "user id");
    this.userService.resendActivation(user_id, getOriginHeader(req));
  }

  @Delete("delete")
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async deleteUser(@Body("passcode") passcode: string, @Req() req: Request) {
    //@ts-ignore
    const email = req?.user?.email;
    return await this.userService.deleteUser(email, passcode);
  }
}
