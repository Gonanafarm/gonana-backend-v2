import {Module} from "@nestjs/common";
import {PostModule} from "../post/post.module";
import {OrderModule} from "../order/order.module";
import {UserModule} from "../user/user.module";
import {PublicController} from "./controller";
import {TaxonomyModule} from "../taxonomy/taxonomy.module";
import setupSwagger from "./catalog.swagger";
import config from "../config";
import {JwtModule} from "@nestjs/jwt";
import {JwtAuthGuard} from "../auth/jwt-auth.guard";

@Module({
  controllers: [PublicController],
  imports: [
    UserModule,
    OrderModule,
    PostModule,
    TaxonomyModule,
    JwtModule.register({
      secret: config.auth.secret,
      signOptions: {expiresIn: config.auth.jwtTokenExpireInSec},
    }),
    JwtAuthGuard,
  ],
})
export class UserCatalogModule {}

setupSwagger(UserCatalogModule);
