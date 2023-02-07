/* eslint-disable no-useless-catch */
import { Controller, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { ReservedAccountSchema, ReservedAccount, ReservedAccountDocument } from "./schema";
import { GenericService } from "../generic/generic.service";

@Injectable()
export class ReservedAccountService extends GenericService<ReservedAccountDocument> {
  constructor(@InjectModel(ReservedAccount.name) private productModel: Model<ReservedAccountDocument>) {
    super(productModel);
  }
}
