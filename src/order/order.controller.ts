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
import {Order as OrderModel} from "./order.schema";
import {ApiBearerAuth} from "@nestjs/swagger";
import {JwtAuthGuard} from "../auth/jwt-auth.guard";

@ApiTags("order-controller")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller("api/catalog/order")
// @ApiHeader({ name: 'Bypass-Tunnel-Reminder', required: true })
export class OrderController {
  constructor(private readonly dataService: OrderService) {}



}
