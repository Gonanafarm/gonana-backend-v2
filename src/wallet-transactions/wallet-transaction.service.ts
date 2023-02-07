/* eslint-disable no-useless-catch */
import { Controller, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { WalletTransaction, WalletTransactionDocument } from "./wallet-transaction.schema";
import { GenericService } from "../generic/generic.service";


@Injectable()
export class WalletTransactionService extends GenericService<WalletTransactionDocument> {
  constructor(@InjectModel(WalletTransaction.name) private productModel: Model<WalletTransactionDocument>) {
    super(productModel);
  }
}
