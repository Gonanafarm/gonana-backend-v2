import {MongooseModule} from "@nestjs/mongoose";
import {KycSchema} from "./kyc.schema";
export const KycModel = MongooseModule.forFeature([
  {name: "Kyc", schema: KycSchema},
]);
