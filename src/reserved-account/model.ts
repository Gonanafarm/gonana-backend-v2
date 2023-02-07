import { MongooseModule } from "@nestjs/mongoose";
import { ReservedAccount, ReservedAccountDocument, ReservedAccountSchema } from "./schema";

export const ReservedAccountModel = MongooseModule.forFeature([
  { name: ReservedAccount.name, schema: ReservedAccountSchema }
]);
