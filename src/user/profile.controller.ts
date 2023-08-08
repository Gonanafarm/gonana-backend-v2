import {Controller, Req, UseGuards, Body, Put, Post} from "@nestjs/common";
import {Request} from "express";
import {ApiBearerAuth, ApiHeader, ApiResponse, ApiTags} from "@nestjs/swagger";
import {UserService} from "./user.service";
import {JwtAuthGuard} from "../auth/jwt-auth.guard";
import {User} from "./user.schema";
import {UpdateTransferReceipient, UpdateUserDto} from "./user.dto";

@ApiTags("profile-controller")
@ApiBearerAuth()
@Controller("api/profile")
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly userService: UserService) {}

  @Put("/update-profile")
  @ApiResponse({type: User})
  updateProfile(@Req() req: Request, @Body() body: UpdateUserDto) {
    //@ts-ignore
    let publisher_id = req?.user?.id;
    return this.userService.updateItem(publisher_id, body);
  }

  @Put("/update-passcode")
  updatePasscode(@Req() req: Request, @Body("passcode") passcode: string) {
    //@ts-ignore
    const id = req?.user?.id;
    return this.userService.updatePasscode(id, passcode);
  }

  @Post("/verify-passcode")
  verifyPasscode(@Req() req: Request, @Body("passcode") passcode: string) {
    //@ts-ignore
    const id = req?.user?.id;
    return this.userService.verifyPasscode(id, passcode);
  }
}
