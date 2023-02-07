import { Module } from "@nestjs/common";
import { } from "./transaction.controller";
import { TransactionModel } from "./transaction.model";
import {  TransactionService } from "./transaction.service";

@Module({
  providers: [ TransactionService],
  imports: [ TransactionModel],
  exports: [ TransactionModel,  TransactionService],
})
export class  TransactionModule { }
