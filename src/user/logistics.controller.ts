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
@UseGuards(JwtAuthGuard)
export class LogisticsController {
  constructor(
    private readonly userService: UserService,
    private readonly logisticsService: LogisticsService,
  ) {}
  @Get("/get-couriers")
  async getCouriers() {
    return this.logisticsService.getAvailableCouriers();
  }

  @Post("/create-shipment")
  async createShipment(@Body() body: ShipmentData) {
    return await this.logisticsService.createShipment(
      body.request_token,
      body.service_code,
      body.courier_id,
      body.insurance_code,
    );
  }
  @Post("/validate-user-address")
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
  async updateUserAddress(@Body("address") body: string, @Req() req: Request) {
    //@ts-ignore
    const user_id = req.user.id;
    return this.logisticsService.updateUserAddress(user_id, body);
  }

  @Patch("update-post-address")
  async updatePostAddress(@Body() body: any, @Req() req: Request) {
    return this.logisticsService.updatePostAddress(body.address, body.id);
  }
}
