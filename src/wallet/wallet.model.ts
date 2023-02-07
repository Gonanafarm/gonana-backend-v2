import { MongooseModule } from "@nestjs/mongoose";
import { Wallet, WalletDocument, WalletSchema } from "./wallet.schema";

export const WalletModel = MongooseModule.forFeature([
  { name: Wallet.name, schema: WalletSchema }
]);
