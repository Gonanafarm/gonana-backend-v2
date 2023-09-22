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

@Controller("api/logistics")
export class LogisticsController {
  constructor(
    private readonly userService: UserService,
    private readonly logisticsService: LogisticsService,
  ) {}
  @Get("/get-couriers")
  async getCouriers() {
    return this.logisticsService.getAvailableCouriers();
  }
//   @Get("/get-shipping-rates")
//   async getShippingRates(@Query("service_code") body: string) {
//     return this.logisticsService.getShippingRates(body);
//   }
}
