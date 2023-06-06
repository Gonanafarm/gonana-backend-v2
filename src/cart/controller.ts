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
import {CartItemService} from "./service";
import {CartItem, CartItem as CartItemModel} from "./schema";
import {ApiBearerAuth} from "@nestjs/swagger";
import {JwtAuthGuard} from "../auth/jwt-auth.guard";
import {UpdateCartItemDto} from "./dto";
import {Order} from "../order/order.schema";

@ApiTags("cart-controller")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller("api/catalog/cart")
// @ApiHeader({ name: 'Bypass-Tunnel-Reminder', required: true })
export class CartItemController {
  constructor(private readonly dataService: CartItemService) {}
  @Get("")
  @ApiResponse({
    status: 200,
    description: "Returns list of cart-items associated with account",
    isArray: true,
    type: CartItemModel,
  })
  get(@Req() req: any) {
    let publisher_id = "";
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    publisher_id = req.user?.sub ?? "";
    return this.dataService.retrieveItems({publisher_id});
  }

  @Post("")
  @ApiResponse({
    status: 200,
    description: "Add cart item successfully",
    isArray: false,
    type: CartItemModel,
  })
  async publish(@Body() body: CartItem, @Req() req: any) {
    let publisher_id = "";
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    publisher_id = req.user?.sub ?? "";
    try {
      let item = await this.dataService.createCartItem(publisher_id, body);
      return item;
    } catch (err) {
      throw err;
    }
  }

  @Get(":item")
  @ApiResponse({
    status: 200,
    description: "Returns item by id",
    isArray: false,
    type: CartItemModel,
  })
  async getById(@Param("item") item: string) {
    return await this.dataService.getItem(item);
  }

  @Put(":item/update-price")
  @ApiResponse({
    status: 200,
    description: "Update cart quantity",
    isArray: false,
    type: CartItemModel,
  })
  async updateQuantity(
    @Param("item") item: string,
    @Body() body: UpdateCartItemDto,
  ) {
    return await this.dataService.updateItem(item, body);
  }

  @Post("place-order")
  @ApiResponse({
    status: 200,
    description: "Update cart quantity",
    isArray: true,
    type: Order,
  })
  async placeOrder(@Req() req: any) {
    let publisher_id = "";
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    publisher_id = req.user?.sub ?? "";

    return this.dataService.placeOrder(publisher_id);
  }
}
