import {
  Controller,
  Req,
  UseGuards,
  Body,
  Put,
  Post,
  Get,
  UseInterceptors,
  UploadedFile,
  HttpCode,
} from "@nestjs/common";
import {Request} from "express";
import {ApiBearerAuth, ApiHeader, ApiResponse, ApiTags} from "@nestjs/swagger";
import {UserService} from "./user.service";
import {JwtAuthGuard} from "../auth/jwt-auth.guard";
import {User} from "./user.schema";
import {UpdateTransferReceipient, UpdateUserDto} from "./user.dto";
import {FileInterceptor} from "@nestjs/platform-express";

@ApiTags("profile-controller")
@ApiBearerAuth()
@Controller("api/profile")
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly userService: UserService) {}

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

  @Get("/user-data")
  getUserData(@Req() req: Request) {
    //@ts-ignore
    const id = req?.user?.id;
    return this.userService.getUserData(id);
  }

  @Post("/test")
  virtualAccount(@Req() req: Request, @Body("bvn") bvn: string) {
    //@ts-ignore
    const name = req?.user?.first_name;
    return this.userService.virtualAccount(name, bvn);
  }
}
