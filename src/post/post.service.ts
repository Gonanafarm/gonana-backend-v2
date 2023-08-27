/* eslint-disable no-useless-catch */
import {Controller, Injectable} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import {Model} from "mongoose";
import {PostSchema, Post, PostDocument} from "./post.schema";
import {GenericService} from "../generic/generic.service";
import {EventEmitter2} from "@nestjs/event-emitter";
import {DiscountDocument} from "./discount.schema";
import {DeletionException} from "../common/exceptions";

@Injectable()
export class PostService extends GenericService<PostDocument> {
  constructor(
    @InjectModel(Post.name) private productModel: Model<PostDocument>,
    @InjectModel("Discounts") private discountModel: Model<DiscountDocument>,
    private eventEmmiter: EventEmitter2,
  ) {
    super(productModel);
  }
  async updatePrice(id: string, price: number) {
    try {
      const product = await this.productModel.findById(id);
      if (!product) {
        return {success: false, message: "Product not found"};
      }

      if (price < product.amount) {
        const productid = product.id;
        this.eventEmmiter.emit("discount trigger", productid);
      }

      if (price > product.amount) {
        const productid = product.id;
        this.eventEmmiter.emit("delete discount", productid);
      }

      product.amount = price;
      const updatedProduct = await product.save();
      return updatedProduct;
    } catch (error: any) {
      console.error(error);
      throw new Error("Error updating price");
    }
  }

  async createDiscount(productid: string) {
    const exists = await this.discountModel.findOne({productid: productid});
    if (exists) return;
    const discount = await this.discountModel.create({productid: productid});
    return discount;
  }

  async deleteDiscount(productid: string) {
    const exists = await this.discountModel.findOne({productid: productid});
    if (!exists) {
      console.log("discount model does not exist");
      return;
    }
    const deleteProduct = await this.discountModel.deleteOne({
      productid: productid,
    });
    if (!deleteProduct) {
      throw DeletionException();
    }
    return true;
  }

  async discountedProducts() {
    const products = await this.discountModel.find();
    if (products.length < 1) {
      return {message: "No products found"};
    }
    const ids = products.map(product => product.productid);
    const discountedProductsPromises = ids.map(async id =>
      this.productModel.findOne({_id: id}),
    );
    const discountedProducts = await Promise.all(discountedProductsPromises);

    return {success: true, data: discountedProducts};
  }

  async getByPublisherId(id: string, type?: string) {
    try {
      const query: Record<string, unknown> = {publisher_id: id};

      if (type !== undefined) {
        query.type = type;
      }
      const products = await this.productModel.find(query);
      if (products.length < 1) {
        return {
          success: false,
          message: "No posts with these parameters were found",
        };
      }
      return {
        success: true,
        data: products,
      };
    } catch (error: any) {
      console.error(error);
      throw new Error(`${error.message}`);
    }
  }
  async get(type: string) {
    try {
      const query: Record<string, unknown> = {};
      if (type !== undefined) {
        query.type = type;
      }
      const products = await this.productModel.find(query);
      if (products.length < 1) {
        return {
          success: false,
          message: "No posts with these parameters were found",
        };
      }
      return {success: true, data: products};
    } catch (error: any) {
      console.error(error);
      throw new Error(`${error.message}`);
    }
  }
}
