import { Module } from "@nestjs/common";
import { } from "./member.controller";
import { MemberModel } from "./member.model";
import { MemberService } from "./member.service";

@Module({
  providers: [MemberService],
  imports: [MemberModel],
  exports: [MemberModel, MemberService],
})
export class MemberModule { }
