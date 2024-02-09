import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import {Request} from "express";
import {ApiHeader, ApiResponse, ApiTags} from "@nestjs/swagger";
import {OrderService} from "./order.service";
import {Order as OrderModel} from "./outgoing.order.schema";
import {ApiBearerAuth} from "@nestjs/swagger";
import {JwtAuthGuard} from "../auth/jwt-auth.guard";

@ApiTags("order-controller")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller("api/catalog/orders")
// @ApiHeader({ name: 'Bypass-Tunnel-Reminder', required: true })
export class OrderController {
  constructor(private readonly dataService: OrderService) {}

  @Get("incoming")
  async getIncomingOrders(@Req() req: Request) {
    //@ts-ignore
    const customer_id = req.user.id;
    return await this.dataService.getIncomingOrders(customer_id);
  }

  @Get("outgoing")
  async getOutgoingOrders(@Req() req: Request) {
    //@ts-ignore
    const customer_id = req.user.id;
    return await this.dataService.getOutgoingOrders(customer_id);
  }
}
