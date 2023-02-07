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
} from '@nestjs/common';
import { ApiHeader, ApiResponse, ApiTags } from '@nestjs/swagger';
import { OrderService } from './order.service';
import { Order as OrderModel } from './order.schema';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PublishOrderDto } from './order.dto';

@ApiTags('order-controller')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('api/catalog/order')
// @ApiHeader({ name: 'Bypass-Tunnel-Reminder', required: true })
export class OrderController {
  constructor(private readonly dataService: OrderService) {}
  @Get('')
  @ApiResponse({
    status: 200,
    description: 'Returns list of orders associated with org',
    isArray: true,
    type: OrderModel,
  })
  get(
    @Req() req: any,
    @Query('org_id') org_id: string,
    @Query('branch_id') branch_id: string,
  ) {
    return this.dataService.retrieveItems({ org_id });
  }

  @Get('/customer')
  @ApiResponse({
    status: 200,
    description: 'Returns list of orders associated with customer',
    isArray: true,
    type: OrderModel,
  })
  getCustomerOrders(
    @Req() req: any,
    @Query('org_id') org_id: string,
    @Query('customer_id') customer_id: string,
  ) {
    return this.dataService.retrieveItems({ org_id, customer_id });
  }

  @Get('/staff')
  @ApiResponse({
    status: 200,
    description: 'Returns list of orders associated with staff',
    isArray: true,
    type: OrderModel,
  })
  getStaffSales(
    @Req() req: any,
    @Query('org_id') org_id: string,
    @Query('staff_id') staff_id: string,
  ) {
    return this.dataService.retrieveItems({ org_id, publisher_id: staff_id });
  }

  @Post('')
  @ApiResponse({
    status: 200,
    description: 'Created post successfully',
    isArray: false,
    type: OrderModel,
  })
  async publish(@Body() body: PublishOrderDto, @Req() req: any) {
    let publisher_id = '';
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    publisher_id = req.user?.sub ?? '';
    try {
      let order = await this.dataService.createOrder(publisher_id, body);
      return order;
    } catch (err) {
      throw err;
    }
  }

  @Get(':item')
  @ApiResponse({
    status: 200,
    description: 'Returns item by id',
    isArray: false,
    type: OrderModel,
  })
  async getById(@Param('item') item: string) {
    return await this.dataService.getItem(item);
  }

  @Get(':item/pay')
  @ApiResponse({
    status: 200,
    description: 'Updates item record',
    isArray: false,
    type: OrderModel,
  })
  async pay(@Param('item') item: string, @Body() body: any, @Req() req: any) {
    let publisher_id = '';
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    publisher_id = req.user?.sub ?? '';
    return await this.dataService.pay(publisher_id, item);
  }
}
