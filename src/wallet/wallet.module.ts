import { Module } from "@nestjs/common";
import { } from "./wallet.controller";
import { WalletModel } from "./wallet.model";
import { WalletService } from "./wallet.service";

@Module({
  providers: [WalletService],
  imports: [WalletModel],
  exports: [WalletModel, WalletService],
})
export class WalletModule { }
