import {
  Controller,
  Req,
  UseGuards,
  Body,
  Put,
  Post,
  Get,
  UseInterceptors,
  HttpCode,
} from "@nestjs/common";
import {Request} from "express";
import {ApiBearerAuth, ApiResponse, ApiTags} from "@nestjs/swagger";
import {UserService} from "./user.service";
import {JwtAuthGuard} from "../auth/jwt-auth.guard";
import {User} from "./user.schema";
import {
  UpdateUserDto,
  VerifyPasscodeOtpDto,
} from "./user.dto";
import {FileInterceptor} from "@nestjs/platform-express";
import {LogisticsService} from "./logistics.service";

@ApiTags("profile-controller")
@ApiBearerAuth()
@Controller("api/profile")
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(
    private readonly userService: UserService,
    private readonly logisticsService: LogisticsService,
  ) {}

  @Put("/update-profile")
  @UseInterceptors(FileInterceptor("image"))
  @ApiResponse({type: User})
  updateProfile(@Req() req: Request, @Body() updateDoc: UpdateUserDto) {
    //@ts-ignore
    const publisher_id = req?.user?.id;
    return this.userService.updateUserDetails(publisher_id, updateDoc);
  }

  @Post("/create-passcode")
  createPasscode(@Req() req: Request, @Body("passcode") passcode: string) {
    //@ts-ignore
    const id = req?.user?.id;
    return this.userService.updatePasscode(id, passcode);
  }

  @Post("/verify-passcode")
  @HttpCode(200)
  verifyPasscode(@Req() req: Request, @Body("passcode") passcode: string) {
    //@ts-ignore
    const email = req?.user?.email;
    return this.userService.verifyPasscode(email, passcode);
  }
  @Get("/reset-passcode")
  @HttpCode(200)
  resetPasscode(@Req() req: Request) {
    //@ts-ignore
    const id = req?.user?.id;
    return this.userService.resetPasscode(id);
  }

  @Post("/verify-passcode-otp")
  @HttpCode(200)
  verifyPasscodeOtp(@Body() body: VerifyPasscodeOtpDto) {
    return this.userService.verifyPasscodeOtp(body.otp, body.passcode);
  }
  @Get("/user-data")
  getUserData(@Req() req: Request) {
    //@ts-ignore
    const id = req?.user?.id;
    return this.userService.getUserData(id);
  }
}
