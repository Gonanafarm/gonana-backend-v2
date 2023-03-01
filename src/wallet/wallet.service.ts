/* eslint-disable no-useless-catch */
import {Controller, Injectable} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import {Model} from "mongoose";
import {Wallet, WalletDocument} from "./wallet.schema";
import {GenericService} from "../generic/generic.service";

@Injectable()
export class WalletService extends GenericService<WalletDocument> {
  constructor(
    @InjectModel(Wallet.name) private productModel: Model<WalletDocument>,
  ) {
    super(productModel);
  }

  async updateBalance(account_number: string, amount: number) {
    console.log("updating balance")
    let wallet = await this.dataModel.findOne({account_number});
    if(wallet==undefined)return
    let balance = wallet.balance + amount;
    console.log(balance)
    await this.dataModel.findByIdAndUpdate(wallet?._id, {balance}).exec();
  }
}
