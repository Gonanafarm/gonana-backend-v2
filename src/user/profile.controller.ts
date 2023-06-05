import {
  Controller,
  Req,
  UseGuards,
  Body,
  Put,
} from "@nestjs/common";
import { Request } from "express";
import {
  ApiBearerAuth,
  ApiHeader,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { UserService } from "./user.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { User } from "./user.schema";
import { UpdateTransferReceipient, UpdateUserDto } from "./user.dto";

@ApiTags("profile-controller")
@ApiBearerAuth()
@ApiHeader({ name: "X-API-KEY" })
@Controller("api/profile")
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly userService: UserService) {}

  @Put("/update-profile")
  @ApiResponse({ type: User })
  updateProfile(@Req() req: Request, @Body() body: UpdateUserDto) {
    //@ts-ignore
    let publisher_id = req?.user?.id;
    return this.userService.updateItem(publisher_id, body);
  }
}
