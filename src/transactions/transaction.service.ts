/* eslint-disable no-useless-catch */
import { Controller, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import {  Transaction,  TransactionDocument } from "./transaction.schema";
import { GenericService } from "../generic/generic.service";


@Injectable()
export class TransactionService extends GenericService< TransactionDocument> {
  constructor(@InjectModel( Transaction.name) private model: Model< TransactionDocument>) {
    super(model);
  }
  createTransaction(){
    
  }
}
