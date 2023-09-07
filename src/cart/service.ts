/* eslint-disable no-useless-catch */
import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import {Model} from "mongoose";
import {CartItem, CartItemDocument} from "./schema";
import {GenericService} from "../generic/generic.service";
import {OrderService} from "../order/order.service";
import {Post, PostDocument} from "../post/post.schema";
import {publish} from "rxjs";
import {User, UserDocument} from "src/user/user.schema";

@Injectable()
export class CartItemService extends GenericService<CartItemDocument> {
  constructor(
    //@ts-ignore
    @InjectModel(CartItem.name) private cartItemsModel: Model<CartItemDocument>,
    //@ts-ignore
    @InjectModel(Post.name) private productModel: Model<PostDocument>,
    //@ts-ignore
    @InjectModel("User") private userModel: Model<UserDocument>,
    private readonly orderService: OrderService,
  ) {
    super(cartItemsModel);
  }

  async createCartItem(publisher_id: string, product_id: string) {
    try {
      const product = await this.productModel.findById(product_id);
      if (!product) {
        throw new NotFoundException("Product not found");
      }

      const user_id = product.publisher_id;

      const user = await this.userModel.findById(user_id);
      if (!user) {
        throw new NotFoundException(
          "The Owner of the Product may have deleted their account",
        );
      }
      const firstname = user.first_name;
      const lastname = user.last_name;

      const productOwner = `${firstname} ${lastname}`;
      // if (product.quantity < 1) {
      //   return { success: false, message: "Product is out of stock"};
      // }
      const itemExists = await this.cartItemsModel.findOne({
        product_id: product_id,
      });
      if (itemExists) {
        // itemExists.quantity += 1;
        // await itemExists.save();
        throw new BadRequestException("Item is already in cart");
      }

      const cartItem = await this.cartItemsModel.create({
        publisher_id: publisher_id,
        product_id: product_id,
        productOwner: productOwner,
      });
      return {
        success: true,
        productOwner: `${firstname} ${lastname}`,
        message: "Cart item created",
        cartItem: cartItem,
        product: product,
      };
    } catch (error: any) {
      console.error(error);
      return {message: error.message};
    }
  }

  async reomoveCartItem(publisher_id: string, product_id: string) {
    try {
      const product = await this.productModel.findById(product_id);
      if (!product) {
        throw new NotFoundException(`Product not found`);
      }
      const cartItem = await this.cartItemsModel.findOne({
        product_id: product_id,
      });
      if (!cartItem) {
        throw new NotFoundException("Product not in cart");
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

      await cartItem.deleteOne({product_id: product_id});
      return {success: true, message: "cart item removed"};
    } catch (error: any) {
      console.error(error);
      return {success: false, message: error.message};
    }
  }

  async getCartItems(publisher_id: string) {
    try {
      const items = await this.retrieveItems({publisher_id});
      const productIds = items.map(item => item.product_id);
      const cartItemsPromise = productIds.map(async id => {
        const product = await this.productModel.findById(id);
        const user_id = product?.publisher_id;
        const user = await this.userModel.findById(user_id);
        const firstname = user?.first_name;
        const lastname = user?.last_name;

        const productOwner = `${firstname}${lastname}`;
        if (product) {
          return {
            title: product.title,
            amount: product.amount,
            body: product.body,
            images: product.images,
            id: product.id,
            productOwner: productOwner,
          };
        } else return null;
      });
      const productsInCart = (await Promise.all(cartItemsPromise)).filter(
        Boolean,
      );
      return productsInCart;
    } catch (error: any) {
      console.error(error);
      return {error: error.message};
    }
  }

  // async placeOrder(publisher_id: string) {
  //   let items = await this.retrieveItems({publisher_id: publisher_id});

  //   let uniqueFarmsMap: {[key: string]: any[]} = {};

  //   items.forEach(element => {
  //     //@ts-ignore
  //     if (uniqueFarmsMap[element.farmer_id] == undefined) {
  //       //@ts-ignore
  //       uniqueFarmsMap[element.farmer_id] = [];
  //     }

  //     //@ts-ignore
  //     uniqueFarmsMap[element.farmer_id].push(element);
  //   });

  //   let orders = [];

  //   for (const [farmer_id, items] of Object.entries(uniqueFarmsMap)) {
  //     let res = await this.orderService.createOrder(
  //       publisher_id,
  //       items,
  //       farmer_id,
  //     );

  //     orders.push(res);
  //   }

  //   this.dataModel.deleteMany({publisher_id: publisher_id}).exec();

  //   return orders;
  // }
}
