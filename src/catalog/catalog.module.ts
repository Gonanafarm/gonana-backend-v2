import { Module } from "@nestjs/common";
import { ProductController } from "../product/product.controller";
import setupSwagger from "./catalog.swagger";
import { ProductModule } from "../product/product.module";
import { PostModule } from "../post/post.module";
import { PostController } from "../post/post.controller";
import { JwtModule } from "@nestjs/jwt";
import config from "../config";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { EventController } from "../events/events.controller";
import { EventModule } from "../events/events.module";
import { OrganizationModule } from "../organisation/organisation.module";
import { OrgController } from "../organisation/organisation.controller";


@Module({
  controllers: [ProductController, PostController, EventController, OrgController],
  imports: [ProductModule,  PostModule, JwtModule.register({
    secret: config.auth.secret,
    signOptions: { expiresIn: config.auth.jwtTokenExpireInSec },
  }), JwtAuthGuard, EventModule, OrganizationModule]
})
export class CatalogModule { }

setupSwagger(CatalogModule)