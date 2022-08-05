import { CacheModule, Module } from "@nestjs/common";
import { UserModule } from "../user/user.module";
import { PublicController } from "./public.controller";

@Module({
  controllers: [PublicController],
  imports: [UserModule]
})
export class PublicModule { }
