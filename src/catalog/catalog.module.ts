import {Module} from "@nestjs/common";
import setupSwagger from "./catalog.swagger";
import {PostModule} from "../post/post.module";
import {PostController} from "../post/post.controller";
import {JwtModule} from "@nestjs/jwt";
import config from "../config";
import {JwtAuthGuard} from "../auth/jwt-auth.guard";
import {ReservedAccountModule} from "../reserved-account/module";
import {OrderModule} from "../order/order.module";
import {OrderController} from "../order/order.controller";
import {ReservedAccountController} from "../reserved-account/controller";
import {TaxonomyController} from "../taxonomy/taxonomy.controller";
import {TaxonomyModule} from "../taxonomy/taxonomy.module";
import {KYCApplicationModule} from "../kyc/module";
import {KYCApplicationController} from "../kyc/controller";
import {WalletModule} from "../wallet/wallet.module";
import {WalletController} from "../wallet/wallet.controller";
import {WalletTransactionController} from "../wallet-transactions/wallet-transaction.controller";
import {WalletTransactionModule} from "../wallet-transactions/wallet-transaction.module";
import { CartItemModule } from "../cart/module";
import { CartItemController } from "../cart/controller";

@Module({
  controllers: [
    WalletTransactionController,
    PostController,
    OrderController,
    ReservedAccountController,
    TaxonomyController,
    WalletController,
    KYCApplicationController,
    CartItemController
  ],
  imports: [
    WalletTransactionModule,
    TaxonomyModule,
    ReservedAccountModule,
    OrderModule,
    KYCApplicationModule,
    WalletModule,
    PostModule,
    CartItemModule,
    JwtModule.register({
      secret: config.auth.secret,
      signOptions: {expiresIn: config.auth.jwtTokenExpireInSec},
    }),
    JwtAuthGuard,
  ],
})
export class CatalogModule {}

setupSwagger(CatalogModule);
