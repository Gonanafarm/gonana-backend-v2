/* eslint-disable no-useless-catch */
import {
  BadRequestException,
  Controller,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import {Model} from "mongoose";
import {Order, OrderDocument} from "./order.schema";
import {GenericService} from "../generic/generic.service";
import {CartItem} from "../cart/schema";
import {Post, PostDocument} from "../post/post.schema";
import {User, UserDocument} from "../user/user.schema";
import axios from "axios";

@Injectable()
export class OrderService {
  //@ts-ignore
  constructor(
    //@ts-ignore
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    //@ts-ignore
    @InjectModel(Post.name) private productModel: Model<PostDocument>,
    //@ts-ignore
    @InjectModel(User.name) private UserModel: Model<UserDocument>,
  ) 
  async createOrder(product_id: string) {
    const product = await this.productModel.findById(product_id);
    if (!product) {
      throw new NotFoundException(`Product Not Found`);
    }
    const user_id = product?.publisher_id;
    const user = await this.UserModel.findById(user_id);
    if (!user) {
      throw new NotFoundException("User Not Found");
    }
    if (user?.bvn === undefined) {
      return {success: false, message: `Must have a bvn`};
    }

    if (user?.virtual_account_number === undefined) {
      const virtual_account = await this.virtualAccount(
        user.first_name,
        user.bvn,
      );
      user.virtual_account_number = virtual_account.data.accountNumber;
      await user.save();
      return {
        account_number: virtual_account.data.accountNumber,
        account_name: virtual_account.data.accountName,
        bank_name: virtual_account.data.bankName,
      };
    }
    const base_url = process.env.MINTYN_BASE_URL;
    const id = process.env.MERCHANT_ID;
    const secret = process.env.MINTYN_SECRET;
    const tokenUrl = `${base_url}/api/v1/authorization/generate-token/${id}`;
    const tokenHeaders = {
      "secret-key": secret,
    };

    try {
      const response = await axios.get(tokenUrl, {headers: tokenHeaders});

      const token = response.data.data.token;
      const accountHeaders = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };
      const accountDetailsUrl = `${base_url}/api/v1/merchant/virtual-account/accounts?bvn=${user.bvn}&page=0&size=100`;
      const accountResponse = await axios.get(accountDetailsUrl, {
        headers: accountHeaders,
      });
      console.log(accountResponse.data);

      const res = accountResponse.data.data.records[0];
      return {res, amount: product.amount};
    } catch (error: any) {
      console.error(error);
      return {success: false, error: error.message};
    }
  }
  async virtualAccount(name: string, bvn: string) {
    const base_url = process.env.MINTYN_BASE_URL;
    const id = process.env.MERCHANT_ID;
    const secret = process.env.MINTYN_SECRET;
    const tokenUrl = `${base_url}/api/v1/authorization/generate-token/${id}`;
    const tokenHeaders = {
      "secret-key": process.env.MINTYN_SECRET,
    };

    try {
      const response = await axios.get(tokenUrl, {headers: tokenHeaders});

      const token = response.data.data.token;

      const accountHeaders = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };
      const data = {
        customerFirstName: name,
        customerBVN: bvn,
      };
      const accountUrl = `${base_url}/api/v1/merchant/virtual-account/reserved-account`;
      const createAccount = await axios.post(accountUrl, data, {
        headers: accountHeaders,
      });

      return createAccount.data;
    } catch (error: any) {
      throw new Error("Error fetching data: " + error.message);
    }
  }
}
