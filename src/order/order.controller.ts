import {Body, Controller, Get, Post, Req, UseGuards} from "@nestjs/common";
import {Request} from "express";
import {ApiTags} from "@nestjs/swagger";
import {OrderService} from "./order.service";
import {ApiBearerAuth} from "@nestjs/swagger";
import {JwtAuthGuard} from "../auth/jwt-auth.guard";
import {Complaint} from "./order.dto";

@ApiTags("order-controller")
@ApiBearerAuth()
@Controller("api/catalog/orders")
// @ApiHeader({ name: 'Bypass-Tunnel-Reminder', required: true })
export class OrderController {
  constructor(private readonly dataService: OrderService) {}

  @Get("incoming")
  @UseGuards(JwtAuthGuard)
  async getIncomingOrders(@Req() req: Request) {
    //@ts-ignore
    const customer_id = req.user.id;
    return await this.dataService.getIncomingOrders(customer_id);
  }

  @Get("outgoing")
  @UseGuards(JwtAuthGuard)
  async getOutgoingOrders(@Req() req: Request) {
    //@ts-ignore
    const customer_id = req.user.id;
    return await this.dataService.getOutgoingOrders(customer_id);
  }

  @Post("/webhook")
  async handleWebhook(@Body() payload: any) {
    return await this.dataService.handleWebhook(payload);
  }

  @Post("/confirm-sent")
  @UseGuards(JwtAuthGuard)
  async confirmSent(@Body("orderId") data: string, @Req() req: Request) {
    //@ts-ignore
    const farmerId = req.user?.id;
    return await this.dataService.confirmOutgoingOrderSent(data, farmerId);
  }

  @Post("/confirm-received")
  @UseGuards(JwtAuthGuard)
  async confirmReceived(@Body("orderId") data: string, @Req() req: Request) {
    //@ts-ignore
    const customerId = req.user?.id;
    return await this.dataService.confirmIncomingOrderReceived(
      data,
      customerId,
    );
  }

  @Post("/complaint")
  @UseGuards(JwtAuthGuard)
  async complaint(@Body() data: Complaint, @Req() req: Request) {
    //@ts-ignore
    const userId = req.user?.id;
    return await this.dataService.complaint(data.orderId, userId);
  }
}
