import { Controller, Get, Req, Param, UseGuards } from "@nestjs/common";
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
import { UpdateUserDto } from "./user.dto";
import { AuthGuard } from "@nestjs/passport";

@ApiTags("user-controller")
@ApiBearerAuth()
@Controller("api/user")
export class UserController {
  constructor(private readonly userService: UserService) {}
  @Get("/find-by-email/:email")
  @ApiResponse({ type: User })
  findAccountByEmail(@Req() req: Request, @Param("email") email: string) {
    return this.userService.findByEmail(email);
  }

  @Get("/find-by-id/:id")
  @ApiResponse({ type: User })
  findAccountById(@Req() req: Request, @Param("id") id: string) {
    console.log(id, "find by id");
    return this.userService.getItem(id);
  }
}
