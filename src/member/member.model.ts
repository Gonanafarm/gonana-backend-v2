import { MongooseModule } from "@nestjs/mongoose";
import { Member, MemberDocument, MemberSchema } from "./member.schema";

export const MemberModel = MongooseModule.forFeature([
  { name: Member.name, schema: MemberSchema }
]);
