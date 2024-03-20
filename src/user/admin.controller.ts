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
import {ApiBearerAuth, ApiHeader, ApiResponse, ApiTags} from "@nestjs/swagger";
import {UserService} from "./user.service";
import {JwtAuthGuard} from "../auth/jwt-auth.guard";
import {User} from "./user.schema";
import {UpdateAccountStatus, UpdateDriverAccountStatus} from "./user.dto";
import {AccountType} from "src/common/enums";

@ApiTags("admin-user-controller")
@ApiBearerAuth()
@ApiHeader({name: "X-API-KEY"})
@Controller("api/catalog/admin/user")
@UseGuards(JwtAuthGuard)
export class AdminUserController {
  constructor(private readonly userService: UserService) {}

  @Get("/drivers")
  @ApiResponse({type: User, isArray: true})
  getDrivers() {
    return this.userService.retrieveItems({account_type: AccountType.DRIVER});
  }

  @Get("/individuals")
  @ApiResponse({type: User, isArray: true})
  getUsers() {
    return this.userService.retrieveItems({
      account_type: AccountType.INDIVIDUAL,
    });
  }

  @Get("/admins")
  @ApiResponse({type: User, isArray: true})
  getAdmins() {
    return this.userService.retrieveItems({account_type: AccountType.ADMIN});
  }

  @Post("/admin/account/:id/status")
  @ApiResponse({type: User})
  updateAccountStatus(
    @Req() req: Request,
    @Param("id") id: string,
    @Body() body: UpdateAccountStatus,
  ) {
    return this.userService.updateItem(id, body);
  }

  @Post("/admin/account/:id/promote-user")
  @ApiResponse({type: User})
  makeAdmin(
    @Req() req: Request,
    @Param("id") id: string,
    @Body() body: UpdateAccountStatus,
  ) {
    return this.userService.updateItem(id, {account_type: AccountType.ADMIN});
  }

  @Post("/admin/account/:id/driver-status")
  @ApiResponse({type: User})
  updateDriverAccountStatus(
    @Req() req: Request,
    @Param("id") id: string,
    @Body() body: UpdateDriverAccountStatus,
  ) {
    return this.userService.updateItem(id, body);
  }
}
