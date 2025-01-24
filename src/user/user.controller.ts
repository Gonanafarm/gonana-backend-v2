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
} from "@nestjs/common";
import {Request} from "express";
import {ApiBearerAuth, ApiResponse, ApiTags} from "@nestjs/swagger";
import {UserService} from "./user.service";
import {JwtAuthGuard} from "../auth/jwt-auth.guard";
import {User} from "./user.schema";
import {FileInterceptor} from "@nestjs/platform-express";
import {LogisticsService} from "./logistics.service";
import {sendNotificationDto} from "./user.dto";

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
  @Get("/generate-token/:email")
  generate(@Param("email") email: string) {
    return this.userService.generateTokenByEmail(email);
  }

  @Get("/find-by-id/:id")
  @ApiResponse({type: User})
  findAccountById(@Req() req: Request, @Param("id") id: string) {
    console.log(id, "find by id");
    return this.userService.getItem(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get("/:id/customers")
  getCustomers(@Param("id") id: string) {
    return this.userService.getCustomers(id);
  }

  @Post("send-notification")
  sendNotification(@Body("data") data: string[]) {
    return this.userService.sendTestNotificationToDevice(data);
  }

  @UseGuards(JwtAuthGuard)
  @Post("send-notification-to-devices")
  sendNotifications(@Body() data: sendNotificationDto) {
    console.log(data);

    return this.userService.sendNotificationToDevices(data.body, data.title);
  }

  @Get("notifications")
  @UseGuards(JwtAuthGuard)
  getNotifications(@Req() req: Request) {
    //@ts-ignore
    const userId = req.user?.id;
    return this.userService.getNotifications(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get("/referred-users")
  async getReferredUsers(@Req() req: Request) {
    //@ts-ignore
    const userId = req.user?.id;
    console.log(userId);
    return await this.userService.getUsersIreferred(userId);
  }

  @Get("/:id")
  test(@Param("id") id: string) {
    return this.userService.isPlayerIdValid(id);
  }

  @Patch("update-image")
  @UseInterceptors(FileInterceptor("file"))
  uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Body("email") email: string,
  ) {
    return this.userService.updateImage(email, file);
  }

  // @Post("/verify-transaction")
  // verifyTransaction(@Body() body: any) {
  //   return this.userService.verifyTransaction(body);
  // }

  @UseGuards(JwtAuthGuard)
  @Post("/update-player-id")
  update(@Req() req: Request) {
    //@ts-ignore
    const userId = req.user?.id;
    const playerId = req.body.id;
    return this.userService.updateOneSignalId(userId, playerId);
  }
}
