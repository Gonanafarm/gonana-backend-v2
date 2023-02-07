import { CacheModule, Module } from "@nestjs/common";
import setupSwagger from "./catalog.swagger";
import { ProductModule } from "../product/product.module";
import { PostModule } from "../post/post.module";
import { JwtModule } from "@nestjs/jwt";
import config from "../config";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { EventModule } from "../events/events.module";
import { OrganizationModule } from "../organisation/organisation.module";
import { OrgController } from "../organisation/organisation.controller";
import { SiteController } from "./catalog.controller";
import { TaxonomyModule } from "src/taxonomy/taxonomy.module";

@Module({
  controllers: [SiteController],
  imports: [CacheModule.register(), ProductModule, TaxonomyModule, PostModule, JwtModule.register({
    secret: config.auth.secret,
    signOptions: { expiresIn: config.auth.jwtTokenExpireInSec },
  }), JwtAuthGuard, EventModule, OrganizationModule]
})
export class SiteCatalogModule { }

setupSwagger(SiteCatalogModule)