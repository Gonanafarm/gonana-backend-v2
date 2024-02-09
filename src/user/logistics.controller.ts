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
import {UserService} from "./user.service";
import {JwtAuthGuard} from "../auth/jwt-auth.guard";
import {AuthGuard} from "@nestjs/passport";
import {LogisticsService} from "./logistics.service";
import {ShipmentData, ValidatePostAdress} from "./user.dto";

@Controller("api/logistics")
export class LogisticsController {
  constructor(
    private readonly userService: UserService,
    private readonly logisticsService: LogisticsService,
  ) {}

  @Get("/get-couriers")
  @UseGuards(JwtAuthGuard)
  async getCouriers() {
    return this.logisticsService.getAvailableCouriers();
  }

  @Post("/create-shipment")
  @UseGuards(JwtAuthGuard)
  async createShipment(@Body() body: ShipmentData) {
    return await this.logisticsService.createShipment(
      body.request_token,
      body.service_code,
      body.courier_id,
      body.insurance_code,
    );
  }
  @Post("/validate-user-address")
  @UseGuards(JwtAuthGuard)
  async validateAddress(@Body("address") body: string, @Req() req: Request) {
    //@ts-ignore
    const email = req.user.email;
    //@ts-ignore
    const phone = req.user.phone;
    //@ts-ignore
    const name = `${req.user.last_name} ${req.user.first_name}`;
    return this.logisticsService.validateUserAddress(name, email, phone, body);
  }

  @Post("/validate-post-address")
  @UseGuards(JwtAuthGuard)
  async validatePostAddress(
    @Body() body: ValidatePostAdress,
    @Req() req: Request,
  ) {
    //@ts-ignore
    const user_id = req.user.id;

    return this.logisticsService.validatePostAddress(
      body.address,
      body.productId,
      user_id,
    );
  }

  @Patch("update-user-address")
  @UseGuards(JwtAuthGuard)
  async updateUserAddress(@Body("address") body: string, @Req() req: Request) {
    //@ts-ignore
    const user_id = req.user.id;
    return this.logisticsService.updateUserAddress(user_id, body);
  }

  @Patch("update-post-address")
  @UseGuards(JwtAuthGuard)
  async updatePostAddress(@Body() body: any) {
    return this.logisticsService.updatePostAddress(body.address, body.id);
  }


}
