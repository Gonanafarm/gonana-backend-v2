import { MongooseModule } from "@nestjs/mongoose";
import {  Transaction,  TransactionDocument,  TransactionSchema } from "./transaction.schema";

export const  TransactionModel = MongooseModule.forFeature([
  { name:  Transaction.name, schema:  TransactionSchema }
]);
