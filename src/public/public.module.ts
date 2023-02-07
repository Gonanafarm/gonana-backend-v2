import { CacheModule, Module } from "@nestjs/common";
import { OrderModule } from "../order/order.module";
import { OrganizationModule } from "../organisation/organisation.module";
import { UserModule } from "../user/user.module";
import { PublicController } from "./public.controller";

@Module({
  controllers: [PublicController],
  imports: [UserModule, OrganizationModule, OrderModule]
})
export class PublicModule {

}
