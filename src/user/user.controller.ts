import {
  Controller,
  Get,
  Post,
  Req,
  Param,
  UseGuards,
  Body,
  Put,
} from "@nestjs/common";
import {Request} from "express";
import {ApiBearerAuth, ApiResponse, ApiTags} from "@nestjs/swagger";
import {UserService} from "./user.service";
import {JwtAuthGuard} from "../auth/jwt-auth.guard";
import {User} from "./user.schema";
import {UpdateUserDto} from "./user.dto";

@ApiTags("user-controller")
@ApiBearerAuth()
@Controller("api/user")
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Put("/")
  @ApiResponse({type: User,description:"Updates user profile"})

  updateUser(
    @Req() req: Request,
    @Body() body: UpdateUserDto,
  ) {
    let publisher_id = "";
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    publisher_id = req.user?.sub ?? "";
    return this.userService.updateItem(publisher_id, body);
  }

  @Post("/find-by-email/:email")
  @ApiResponse({type: User})
  findAccountByEmail(@Req() req: Request, @Param("email") email: string) {
    return this.userService.findByEmail(email);
  }

  @Post("/find-by-id/:id")
  @ApiResponse({type: User})
  findAccountById(@Req() req: Request, @Param("id") id: string) {
    return this.userService.findById(id);
  }
}
