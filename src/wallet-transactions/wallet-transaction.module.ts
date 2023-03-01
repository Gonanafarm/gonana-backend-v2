import { Module } from "@nestjs/common";
import { WalletModule } from "../wallet/wallet.module";
import { } from "./wallet-transaction.controller";
import { WalletTransactionModel } from "./wallet-transaction.model";
import { WalletTransactionService } from "./wallet-transaction.service";

@Module({
  providers: [WalletTransactionService],
  imports: [WalletTransactionModel, WalletModule],
  exports: [WalletTransactionModel, WalletTransactionService],
})
export class WalletTransactionModule { }
