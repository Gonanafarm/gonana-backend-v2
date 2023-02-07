import { Module } from "@nestjs/common";
import { MemberModule } from "../member/member.module";
import { UserModule } from "../user/user.module";
import { OrgController } from "./organisation.controller";
import { OrganizationModel } from "./organisation.model";
import { OrganizationService } from "./organisation.service";
import { SubscriptionService } from "./subscription.service";

@Module({
  providers: [OrganizationService,  SubscriptionService],
  imports: [OrganizationModel, MemberModule, UserModule],
  exports: [OrganizationModel, OrganizationService, SubscriptionService]
})
export class OrganizationModule { }
