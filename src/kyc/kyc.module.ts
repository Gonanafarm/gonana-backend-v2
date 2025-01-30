import {Module} from "@nestjs/common";
import {KycModel} from "./kyc.model";

@Module({
  controllers: [],
  providers: [],
  exports: [KycModel],
  imports:[KycModel]
})
export class KycModule {}
