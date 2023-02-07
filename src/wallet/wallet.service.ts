/* eslint-disable no-useless-catch */
import {Controller, Injectable} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import {Model} from "mongoose";
import {WalletSchema, Wallet, WalletDocument} from "./wallet.schema";
import {GenericService} from "../generic/generic.service";
import {WalletSendFundDto} from "./wallet.dto";

@Injectable()
export class WalletService extends GenericService<WalletDocument> {
  constructor(
    @InjectModel(Wallet.name) private productModel: Model<WalletDocument>,
  ) {
    super(productModel);
  }

  async sendFundTransaction(publisher_id: string, payload: WalletSendFundDto) {
    let wallet = await this.dataModel.findOne({user_id: publisher_id});


  }
}
