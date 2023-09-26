import {
  Body,
  Controller,
  Delete,
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
import {log} from "console";

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
    return this.dataService.getCartItems(publisher_id);
  }

  @Post("")
  @ApiResponse({
    status: 200,
    description: "Add cart item successfully",
    isArray: false,
    type: CartItemModel,
  })
  async publish(@Body("product_id") body: string, @Req() req: any) {
    let publisher_id = "";
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    publisher_id = req.user?.sub ?? "";

    return this.dataService.createCartItem(publisher_id, body);
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

  @Delete("")
  async removeCartItem(@Body("product_id") body: string, @Req() req: any) {
    let publisher_id = "";
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    publisher_id = req.user?.sub ?? "";
    return this.dataService.reomoveCartItem(publisher_id, body);
  }

  @Post("place-order")
  @ApiResponse({
    status: 200,
    description: "Update cart quantity",
    isArray: true,
    type: Order,
  })
  async placeOrder(
    @Req() req: any,
    @Body("orders")
    body: {
      id: string;
      units: number;
    }[],
  ) {
    let publisher_id = "";
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    publisher_id = req.user?.sub ?? "";

  //  return this.dataService.placeOrder(body, publisher_id);
  }
}
