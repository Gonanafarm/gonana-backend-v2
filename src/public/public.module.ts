import { CacheModule, Module } from "@nestjs/common";
import { WalletTransactionModule } from "../wallet-transactions/wallet-transaction.module";
import { OrderModule } from "../order/order.module";
import { UserModule } from "../user/user.module";
import { PublicController } from "./public.controller";

@Module({
  controllers: [PublicController],
  imports: [UserModule, OrderModule, WalletTransactionModule]
})
export class PublicModule {

}
