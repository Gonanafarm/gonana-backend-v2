import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from "@nestjs/common";
import {ApiResponse, ApiTags} from "@nestjs/swagger";
import {CartItemService} from "./service";
import {CartItem as CartItemModel} from "./schema";
import {Request} from "express";
import {ApiBearerAuth} from "@nestjs/swagger";
import {JwtAuthGuard} from "../auth/jwt-auth.guard";
import {ConcordiumService} from "../user/concordium.service";
import {AddToCartDto, PlaceOrderDto, UpdateCartItemDto} from "./dto";
import {Order} from "../order/outgoing.order.schema";

@ApiTags("cart-controller")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller("api/catalog/cart")
// @ApiHeader({ name: 'Bypass-Tunnel-Reminder', required: true })
export class CartItemController {
  constructor(
    private readonly dataService: CartItemService,
    private readonly concordiumService: ConcordiumService,
  ) {}
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

  @Post("get-rates")
  @ApiResponse({
    status: 200,
    description: "Update cart quantity",
    isArray: true,
    type: Order,
  })
  async getRates(
    @Req() req: any,
    @Body()
    body: AddToCartDto,
  ) {
    let publisher_id = "";
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    publisher_id = req.user?.sub ?? "";
    return this.dataService.getRates(
      body.orders,
      publisher_id,
      body.service_code,
    );
  }

  @Post("place-order")
  async placeOrder(@Body() body: PlaceOrderDto, @Req() req: Request) {
    //@ts-ignore
    const user_id = req.user?.id;
    return this.dataService.placeOrder(body.orders, user_id, body.service_code);
  }
  @Post("pay-with-eth")
  async placeOrderEth(@Body() body: PlaceOrderDto, @Req() req: Request) {
    //@ts-ignore
    const user_id = req.user?.id;
    return this.dataService.payWithCCd(body.orders, user_id, body.service_code);
  }
  @Post("pay-with-ccd")
  async placeOrdedCcd(@Req() req: Request, body: any) {
    //@ts-ignore
    const user_id = req.user?.id;
    return this.dataService.payWithCCd(body.orders, user_id, body.service_code);
  }

  @Post("validate-user-address-by-cart")
  async validateUserAddressForItemsInCart(
    @Req() req: Request,
    @Body("address") address: string,
  ) {
    //@ts-ignore
    const email = req.user.email;
    //@ts-ignore
    const phone = req.user.phone;
    //@ts-ignore
    const name = `${req.user.last_name} ${req.user.first_name}`;
    //@ts-ignore
    const user_id = req.user?.id;
    return this.dataService.validateUserAddressForItemsInCart(
      name,
      email,
      phone,
      address,
      user_id,
    );
  }
}
