import { Module } from "@nestjs/common";
import { OrgController } from "./organisation.controller";
import { OrganizationModel } from "./organisation.model";
import { OrganizationService } from "./organisation.service";

@Module({
  providers: [OrganizationService],
  imports: [OrganizationModel],
  exports: [OrganizationModel, OrganizationService]
})
export class OrganizationModule { }
