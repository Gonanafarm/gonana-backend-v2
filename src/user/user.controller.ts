import {
  Controller,
  Get,
  Req,
  Param,
  UseGuards,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
  Patch,
  Query,
} from "@nestjs/common";
import {Request} from "express";
import {ApiBearerAuth, ApiHeader, ApiResponse, ApiTags} from "@nestjs/swagger";
import {UserService} from "./user.service";
import {JwtAuthGuard} from "../auth/jwt-auth.guard";
import {User} from "./user.schema";
import {AuthGuard} from "@nestjs/passport";
import {FileInterceptor} from "@nestjs/platform-express";
import {LogisticsService} from "./logistics.service";

@ApiTags("user-controller")
@ApiBearerAuth()
@Controller("api/user")
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly logisticsService: LogisticsService,
  ) {}

  @Get("/find-by-email/:email")
  findAccountByEmail(@Req() req: Request, @Param("email") email: string) {
    return this.userService.findByEmail(email);
  }
  @Get("/get-by-email/:email")
  getByEmail(@Param("email") email: string) {
    return this.userService.getByEmail(email);
  }

  @Get("/find-by-id/:id")
  @ApiResponse({type: User})
  findAccountById(@Req() req: Request, @Param("id") id: string) {
    console.log(id, "find by id");
    return this.userService.getItem(id);
  }

  
  @Get("/:id/customers")
  getCustomers(@Param("id") id: string) {
    return this.userService.getCustomers(id);
  }

  @Patch("update-image")
  @UseInterceptors(FileInterceptor("file"))
  uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Body("email") email: string,
  ) {
    return this.userService.updateImage(email, file);
  }

  @Post("/verify-transaction")
  verifyTransaction(@Body() body: any) {
    return this.userService.verifyTransaction(body);
  }
}
