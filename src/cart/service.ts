/* eslint-disable no-useless-catch */
import {
  BadRequestException,
  ConflictException,
  Controller,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import {Model} from "mongoose";
import {CartItem, CartItemDocument} from "./schema";
import {GenericService} from "../generic/generic.service";
import {Post, PostDocument} from "../post/post.schema";
import {User, UserDocument} from "../user/user.schema";
import {UserService} from "../user/user.service";
import {UserMailerService} from "../user/user.mailer.service";
import {
  LogisticsService,
  showObjectProperties,
} from "../user/logistics.service";
import axios from "axios";

@Injectable()
export class CartItemService extends GenericService<CartItemDocument> {
  constructor(
    //@ts-ignore
    @InjectModel(CartItem.name) private cartItemsModel: Model<CartItemDocument>,
    //@ts-ignore
    @InjectModel(Post.name) private productModel: Model<PostDocument>,
    //@ts-ignore
    @InjectModel("User") private userModel: Model<UserDocument>,
    private readonly userService: UserService,
    private readonly logisticsService: LogisticsService,
    private readonly userMailerService: UserMailerService,
  ) {
    super(cartItemsModel);
  }

  async createCartItem(publisher_id: string, product_id: string) {
    try {
      const product = await this.productModel.findById(product_id);
      if (!product) {
        throw new NotFoundException("Product not found");
      }
      console.log(product);

      const user_id = product.publisher_id;

      const user = await this.userModel.findById(user_id);

      if (!user) {
        throw new NotFoundException(
          "The Owner of the Product may have deleted their account",
        );
      }
      // const firstname = user.first_name;
      // const lastname = user.last_name;

      // const productOwner = `${firstname} ${lastname}`;
      // if (product.quantity < 1) {
      //   return { success: false, message: "Product is out of stock"};
      // }
      const cartModel = await this.cartItemsModel.findOne({
        publisher_id: publisher_id,
      });
      console.log(cartModel);

      if (!cartModel) {
        const cart = await this.cartItemsModel.create({
          publisher_id: publisher_id,
          product_id: [product_id],
          //          productOwner: productOwner,
        });
        console.log("DNE");
        console.log(cart);

        return {success: true, data: cart};
      }
      const productexists = cartModel.product_id.includes(product_id);
      if (productexists) {
        throw new ConflictException("Product already exists in cart");
      }
      cartModel.product_id.push(product_id);
      await cartModel.save();

      return {
        success: true,
        //        productOwner: productOwner,
        message: "Cart item created",
        cart: cartModel,
        product: product,
      };
    } catch (error: any) {
      console.error(error);
      return {message: error.message};
    }
  }

  async reomoveCartItem(publisher_id: string, product_id: string) {
    try {
      if (!publisher_id) {
        throw new BadRequestException("Login and try again");
      }

      const cartItem = await this.cartItemsModel.findOne({
        publisher_id: publisher_id,
      });
      const user = await this.userModel.findById(publisher_id);
      const firstname = user?.first_name;
      const lastname = user?.last_name;

      const productOwner = `${firstname} ${lastname}`;

      if (!cartItem) {
        await this.cartItemsModel.create({
          publisher_id: publisher_id,
          product_id: [],
          productOwner: productOwner,
        });
        throw new NotFoundException("Item is not in cart");
      }
      if (publisher_id !== cartItem.publisher_id) {
        throw new ForbiddenException("You did not add this item to the cart");
      }
      // if (cartItem.quantity === 1) {
      //   await cartItem.deleteOne({product_id: product_id});
      //   return {success: true, message: "removed item from cart"};
      // }
      // if (cartItem.quantity > 1) {
      //   cartItem.quantity -= 1;
      //   await cartItem.save();
      //   return {
      //     meaasge: "Quantity Reduced",
      //     success: true,
      //     cartItem: cartItem,
      //     product: product,
      //   };
      // }
      const productArray = cartItem.product_id;

      const index = productArray.indexOf(product_id);
      if (index !== -1) {
        // String found in the array, remove it
        productArray.splice(index, 1);
        await cartItem.save();
        console.log("here");

        return {
          success: true,
          cartItems: productArray,
          message: "Item removed",
        };
      } else {
        throw new NotFoundException("product not in cart");
      }
    } catch (error: any) {
      console.error(error);
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        error.status,
      );
    }
  }

  async getCartItems(publisher_id: string) {
    try {
      const cartItems = await this.cartItemsModel.findOne({
        publisher_id: publisher_id,
      });
      if (!cartItems) {
        throw new NotFoundException(`No items in cart`);
      }
      const productIds = cartItems.product_id;
      if (productIds.length < 1) {
        throw new NotFoundException(`No items in cart`);
      }

      // Filter out invalid productIds that don't return a product
      const validProductIds = [];
      for (const productId of productIds) {
        const product = await this.productModel.findById(productId);
        if (product) {
          validProductIds.push(productId);
        } else {
          await this.reomoveCartItem(publisher_id, productId);
        }
      }

      // Update cartItems with validProductIds
      cartItems.product_id = validProductIds;
      await cartItems.save();

      const productPromises = validProductIds.map(async productId => {
        const product = await this.productModel.findById(productId);
        const user_id = product?.publisher_id;
        const user = await this.userModel.findById(user_id);

        if (product && user)
          return {
            id: product?.id,
            Title: product?.title,
            Amount: product?.amount,
            body: product?.body,
            From: `${user?.first_name} ${user?.last_name}`,
            image: product?.images,
          };
      });

      const products = await Promise.all(productPromises);

      const foundProducts = products.filter(product => !!product);
      if (foundProducts.length < 1) {
        return {success: true, message: "No items in cart"};
      }

      return {success: true, products: foundProducts};
    } catch (error: any) {
      console.error(error);
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        error.status,
      );
    }
  }

  async getRates(
    orderItems: Array<Record<string, any>>,
    user_id: string,
    service_code: string,
  ) {
    try {
      if (!orderItems || orderItems.length === 0) {
        throw new BadRequestException(`No order items selected`);
      }

      const cartItems = await this.getCartItems(user_id);

      if (!cartItems.products) {
        throw new NotFoundException(`No cart items found`);
      }
      const prodId1 = orderItems[0].id;
      const product1 = await this.productModel.findById(prodId1);
      if (!product1) {
        throw new NotFoundException(`No product found`);
      }

      const itemsToShipPromises = cartItems.products.map(async (item: any) => {
        const productId = item.id;
        const product = await this.productModel.findById(productId);
        return {
          name: product?.title,
          description: product?.body,
          unit_weight: product?.weight,
          unit_amount: product?.amount,
          quantity: product?.quantity,
        };
      });

      const packageItems = await Promise.all(itemsToShipPromises);
      const user = await this.userModel.findById(user_id);
      if (!user) {
        throw new NotFoundException("User Not Logged in");
      }
      console.log("here");

      const sender_address_code = product1.address[0].code || undefined;
      console.log(sender_address_code);

      if (sender_address_code === undefined) {
        throw new BadRequestException("product does not have a valid address");
      }
      const receiver_address_code = user.address[0].code || undefined;

      if (receiver_address_code === undefined) {
        throw new BadRequestException("user does not have a valid address");
      }

      const shippingRates = await this.logisticsService.getShippingRates(
        service_code,
        sender_address_code,
        receiver_address_code,
        packageItems,
      );

      if (!user.bvn || user.bvn === "") {
        return {success: false, message: "Must have a BVN"};
      }

      if (
        !user.virtual_account_number ||
        user.virtual_account_number === "" ||
        user.virtual_account_number === undefined
      ) {
        await this.userService.virtualAccount("Gonana", user.bvn, user.id);
      }
      const cartItemMap = new Map(
        cartItems.products.map(item => [item?.id, item]),
      );

      // Calculate the total amount
      const totalAmount = orderItems.reduce((sum, orderItem) => {
        const cartItem = cartItemMap.get(orderItem.id);
        if (cartItem) {
          //@ts-ignore
          return sum + orderItem.units * cartItem.Amount;
        }
        return sum;
      }, 0);

      // this.logisticsService.createShipment(
      //   shippingRates.data.request_token,
      //   shippingRates.data.couriers[0].service_code,
      //   shippingRates.data.couriers[0].courier_id,
      // );
      console.log(shippingRates.data);
      
      return {
        accountNumber: user.virtual_account_number,
        bankName: user.virtual_account_bank_name,
        accountName: user.virtual_account_name,
        product_cost: totalAmount,
        shipping_req_token: shippingRates.data.request_token,
        courier_id: shippingRates.data.couriers[0].courier_id,
        courier_name: shippingRates.data.couriers[0].courier_name,
        courier_image: shippingRates.data.couriers[0].courier_image,
        service_code: shippingRates.data.couriers[0].service_code,
        total_shipping_cost: shippingRates.data.couriers[0].total,
        checkout_data: shippingRates.data.checkout_data,
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          status: error.status,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async placeOrder(
    orderItems: Array<Record<string, any>>,
    user_id: string,
    service_code: string,
  ) {
    try {
      const rates = await this.getRates(orderItems, user_id, service_code);
      const totalCost =
      //@ts-ignore
      parseInt(rates.total_shipping_cost) + rates.product_cost;
      const user = await this.userModel.findById(user_id);
      if (!user) {
        throw new BadRequestException(`User Not found`);
      }
      //@ts-ignore
      const balance = parseInt(user.balance);
      if (balance < totalCost) {
        throw new BadRequestException(
          `Insufficient balance fund wallet and try again`,
        );
      }
      const newBalance = balance - totalCost;
      user.balance = newBalance;
      await user.save();
      const shipment = await this.logisticsService.createShipment(
        rates.shipping_req_token,
        rates.service_code,
        rates.courier_id,
      );
      
      this.userMailerService.trackingUrlMail(
        user.email,
        shipment.data.tracking_url,
      );
      return {success: true, data: shipment};
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          status: error.status,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
