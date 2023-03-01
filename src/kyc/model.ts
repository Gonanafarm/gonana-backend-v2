import { MongooseModule } from "@nestjs/mongoose";
import { KYCApplication, KYCApplicationDocument, KYCApplicationSchema } from "./schema";

export const KYCApplicationModel = MongooseModule.forFeature([
  { name: KYCApplication.name, schema: KYCApplicationSchema }
]);
