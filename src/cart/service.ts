/* eslint-disable no-useless-catch */
import {
  BadRequestException,
  ConflictException,
  Controller,
  ForbiddenException,
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
      console.log(user_id);

      const user = await this.userModel.findById(user_id);
      console.log(user);

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
      const itemExists = await this.cartItemsModel.find({
        product_id: product_id,
        publisher_id: publisher_id,
      });
      console.log(itemExists);

      if (itemExists.length > 0) {
        // itemExists.quantity += 1;
        // await itemExists.save();
        throw new ConflictException("Item is already in cart");
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
      let productsInCart: {
        title: string;
        amount: number;
        body: string;
        images: string[];
        id: any;
        productOwner: string;
      }[] = [];

      if (Array.isArray(await Promise.all(cartItemsPromise))) {
        productsInCart = (await Promise.all(cartItemsPromise)).filter(
          Boolean,
        ) as {
          title: string;
          amount: number;
          body: string;
          images: string[];
          id: any;
          productOwner: string;
        }[];
      }

      return productsInCart;
    } catch (error: any) {
      console.error(error);
      return {error: error.message};
    }
  }
  async placeOrder(orderItems: { id: string; units: number }[], user_id: string) {
    if (!orderItems || orderItems.length === 0) {
      return { success: false, message: "No order items provided" };
    }
  
    let cartItems = await this.getCartItems(user_id);
    const user = await this.userModel.findById(user_id);
    if (!user) {
      throw new NotFoundException("User Not Logged in");
    }
    if (!user.bvn || user.bvn === "") {
      return { success: false, message: "Must have a BVN" };
    }
  
    if (!user.virtual_account_number || user.virtual_account_number === "") {
      await this.userService.virtualAccount(user.first_name, user.bvn);
    }
  
    try {
      if (Array.isArray(cartItems) && cartItems.length < 1) {
        return { success: false, message: "No item in cart" };
      }
  
      //@ts-ignore
      cartItems = cartItems.filter((product: any) =>
        orderItems.map((item) => item.id).includes(product.id)
      );
  
      if (Array.isArray(cartItems) && cartItems.length < 1) {
        return { success: false, message: "No item in cart" };
      }
  
      if (Array.isArray(cartItems)) {
        // Calculate the total amount based on order items
        const totalAmount = cartItems.reduce((accumulator, currentItem) => {
          // Find the corresponding order item
          const orderItem = orderItems.find((item) => item.id === currentItem.id);
          if (orderItem) {
            return accumulator + (currentItem.amount * orderItem.units);
          } else {
            return accumulator;
          }
        }, 0);
  
        return {
          accountNumber: user.virtual_account_number,
          bankName: user.virtual_account_bank_name,
          amountToPay: totalAmount,
        };
      }
    } catch (error: any) {
      console.error(error);
      return { success: false, error: error.message };
    }
  }
  
}
