import { MongooseModule } from "@nestjs/mongoose";
import { WalletTransaction, WalletTransactionDocument, WalletTransactionSchema } from "./wallet-transaction.schema";

export const WalletTransactionModel = MongooseModule.forFeature([
  { name: WalletTransaction.name, schema: WalletTransactionSchema }
]);
