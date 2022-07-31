import { MongooseModule } from "@nestjs/mongoose";
import { Organization, OrganizationSchema } from "./organisation.schema";

export const OrganizationModel = MongooseModule.forFeature([
  { name:  Organization.name, schema: OrganizationSchema }
]);
