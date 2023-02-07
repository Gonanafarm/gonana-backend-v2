/* eslint-disable no-useless-catch */
import {Controller, Injectable} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import {Model} from "mongoose";
import {MemberSchema, Member, MemberDocument} from "./member.schema";
import {GenericService} from "../generic/generic.service";
import {GenericOrgService} from "../generic/generic.org.service";
import {PublishMemberDto} from "./member.dto";

@Injectable()
export class MemberService extends GenericOrgService<MemberDocument> {
  constructor(@InjectModel(Member.name) private model: Model<MemberDocument>) {
    super(model);
  }

  //returns list of all member accounts on orgs
  async getAuthUserMemberList(user_id: string) {
    return await this.retrieveItems({user_id});
  }

  async createMember(publisher_id: string, payload: PublishMemberDto): Promise<any> {
    return await this.dataModel
      .updateOne(
        {user_id: payload.user_id},
        {
          ...payload,
          ...{publisher_id: publisher_id},
        },
        {new: true, upsert: true},
      )
      .exec();
  }
}
