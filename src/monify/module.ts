import {Module} from "@nestjs/common";
import { WalletModule } from "../wallet/wallet.module";
import { ReservedAccountModule } from "../reserved-account/module";
import {MonifyService} from "./service";

@Module({
  providers: [MonifyService],
  imports: [ReservedAccountModule, WalletModule],
  exports: [MonifyService],
})
export class MonifyModule {

}
