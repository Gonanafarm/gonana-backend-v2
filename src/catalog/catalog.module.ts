import { Module } from "@nestjs/common";
import { ProductController } from "../product/product.controller";
import setupSwagger from "./catalog.swagger";
import { ProductModule } from "../product/product.module";
import { TaxonomyModule } from "../collection/taxonomy.module";
import { TaxonomyController } from "../collection/taxonomy.controller";
import { PostModule } from "../post/post.module";
import { PostController } from "../post/post.controller";
import { JwtModule } from "@nestjs/jwt";
import config from "../config";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { EventModel } from "../events/events.model";
import { EventController } from "../events/events.controller";
import { EventModule } from "../events/events.module";

@Module({
  controllers: [ProductController, TaxonomyController, PostController, EventController],
  imports: [ProductModule, TaxonomyModule, PostModule, JwtModule.register({
    secret: "joshua",
    signOptions: { expiresIn: config.auth.jwtTokenExpireInSec },
  }), JwtAuthGuard, EventModule]
})
export class CatalogModule { }

setupSwagger(CatalogModule)