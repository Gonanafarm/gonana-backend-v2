import {Module} from "@nestjs/common";
import setupSwagger from "./catalog.swagger";
import {PostModule} from "../post/post.module";
import {PostController} from "../post/post.controller";
import {JwtModule} from "@nestjs/jwt";
import config from "../config";
import {JwtAuthGuard} from "../auth/jwt-auth.guard";
import {OrderModule} from "../order/order.module";
import {OrderController} from "../order/order.controller";
import {TaxonomyController} from "../taxonomy/taxonomy.controller";
import {TaxonomyModule} from "../taxonomy/taxonomy.module";
import {KYCApplicationModule} from "../kyc/module";
import {KYCApplicationController} from "../kyc/controller";

import {CartItemModule} from "../cart/module";
import {CartItemController} from "../cart/controller";
import {EventEmitterModule} from "@nestjs/event-emitter";

@Module({
  controllers: [
    PostController,
    OrderController,
    TaxonomyController,
    KYCApplicationController,
    CartItemController,
  ],
  imports: [
    EventEmitterModule.forRoot(),
    TaxonomyModule,
    OrderModule,
    KYCApplicationModule,
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
