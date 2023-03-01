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
  @Get("")
  @ApiResponse({
    status: 200,
    description: "Returns list of orders associated with org",
    isArray: true,
    type: OrderModel,
  })
  get(@Req() req: any) {
    let publisher_id = "";
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    publisher_id = req.user?.sub ?? "";
    return this.dataService.retrieveItems({publisher_id});
  }

  @Get(":item")
  @ApiResponse({
    status: 200,
    description: "Returns item by id",
    isArray: false,
    type: OrderModel,
  })
  async getById(@Param("item") item: string) {
    return await this.dataService.getItem(item);
  }
}
