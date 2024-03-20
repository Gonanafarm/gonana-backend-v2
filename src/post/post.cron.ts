import {Injectable} from "@nestjs/common";
import {Cron, CronExpression} from "@nestjs/schedule";
import {UserService} from "../user/user.service";
import {PostDocument, Post} from "./post.schema";
import {InjectModel} from "@nestjs/mongoose";
import {Model} from "mongoose";

@Injectable()
export class ProductCronJob {
  constructor(
    private userService: UserService,
    @InjectModel(Post.name) private productModel: Model<PostDocument>,
  ) {}
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async UpdateUsdPriceCron() {
    const products = await this.productModel.find({type: "product"});
    const newProductsPromises = products.map(async (product: PostDocument) => {
      const usd_price = parseFloat(
        await this.userService.convertNgntoUsd(product.amount.toString()),
      );
      product.usd_price = usd_price;
      await product.save();
      return product;
    });

    const newProducts = await Promise.all(newProductsPromises);
    return newProducts;
  }
}
