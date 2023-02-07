import { Module } from "@nestjs/common";
import { } from "./controller";
import { ReservedAccountModel } from "./model";
import { ReservedAccountService } from "./service";

@Module({
  providers: [ReservedAccountService],
  imports: [ReservedAccountModel],
  exports: [ReservedAccountModel, ReservedAccountService],
})
export class ReservedAccountModule { }
