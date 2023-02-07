import { Module } from "@nestjs/common";
import setupSwagger from "./catalog.swagger";
import { PostModule } from "../post/post.module";
import { PostController } from "../post/post.controller";
import { JwtModule } from "@nestjs/jwt";
import config from "../config";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { ReservedAccountModule } from "../reserved-account/module";
import { OrderModule } from "../order/order.module";
import { OrderController } from "../order/order.controller";
import { ReservedAccountController } from "../reserved-account/controller";
import { TaxonomyController } from "../taxonomy/taxonomy.controller";
import { TaxonomyModule } from "../taxonomy/taxonomy.module";

@Module({
  controllers: [ PostController, OrderController, ReservedAccountController, TaxonomyController],
  imports: [ TaxonomyModule, ReservedAccountModule, OrderModule,  PostModule, JwtModule.register({
    secret: config.auth.secret,
    signOptions: { expiresIn: config.auth.jwtTokenExpireInSec },
  }), JwtAuthGuard]
})
export class CatalogModule { }

setupSwagger(CatalogModule)