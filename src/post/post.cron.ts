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
  @Cron(CronExpression.EVERY_12_HOURS)
  async UpdateUsdPriceCron() {
    const products = await this.productModel.find({type: "product"});
    const oneNgnInUsd = parseFloat(await this.userService.convertNgntoUsd("1"));
    const oneNgnInCcd = parseFloat(await this.userService.convertNgntoCcd("1"));
    const oneNgnInEth = parseFloat(await this.userService.convertNgntoEth("1"));

    // Update the USD price of each product in the database
    const newProductsPromises = products.map(async (product: PostDocument) => {
      const usd_price = product.amount * oneNgnInUsd;
      const ccd_price = product.amount * oneNgnInCcd;
      const eth_price = product.amount * oneNgnInEth;

      product.ccd_price = ccd_price;
      product.eth_price = eth_price.toString();
      product.usd_price = usd_price;
      await product.save();
      return product;
    });

    const newProducts = await Promise.all(newProductsPromises);
    return newProducts;
  }
}
