/* eslint-disable no-useless-catch */
import {ConflictException, Injectable} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import {Model} from "mongoose";
import {OrganizationDocument, Organization} from "./organisation.schema";
import {GenericService} from "../generic/generic.service";
import {paystackActions} from "../common/paystack/paystack.service";
import {AttachAccountDto, PublishOrgDto} from "./organisation.dto";
import {UserService} from "../user/user.service";
import {MemberService} from "../member/member.service";

@Injectable()
export class OrganizationService extends GenericService<OrganizationDocument> {
  constructor(
    @InjectModel(Organization.name)
    private orgModel: Model<OrganizationDocument>,
    private userService: UserService,
    private memberService: MemberService,
  ) {
    super(orgModel);
  }

  registerOrg = async (
    publisher_id: string,
    payload: PublishOrgDto,
  ): Promise<any> => {
    // find org by id
    let _org = await this.orgModel.findOne({
      preferred_domain: payload.preferred_domain,
    });

    if (_org) {
      throw new ConflictException("Handle already in use. ");
    }

    let user = await this.userService.findById(publisher_id);

    // register org
    let org = await this.orgModel.create({
      publisher_id,
      ...payload,
    });

    // create initial member
    await this.memberService.create(publisher_id, {
      publisher_id,
      user_id: publisher_id,
      org_id: org._id,
      fullname: `${user.first_name} ${user.last_name}`,
      email: user.email,
      phone: user.phone,
      user_level: 1,
      user_role: "super-admin",
      status: "active",
    });
  };

  updateItem = (org_id: string, updateDoc: any): Promise<any> => {
    return this.orgModel
      .findOneAndUpdate(
        {_id: org_id},
        {...updateDoc},
        {new: true, setDefaultsOnInsert: true},
      )
      .exec();
  };

  activateBusiness = (publisher_id: string): Promise<any> => {
    return this.orgModel
      .updateOne(
        {publisher_id: publisher_id},
        {status: "activated"},
        {upsert: true, new: true, setDefaultsOnInsert: true},
      )
      .exec();
  };

  disableBusiness = (publisher_id: string): Promise<any> => {
    return this.orgModel
      .updateOne(
        {publisher_id: publisher_id},
        {status: "deactivated"},
        {upsert: true, new: true, setDefaultsOnInsert: true},
      )
      .exec();
  };

  async attachBankAccount(dto: AttachAccountDto, org_id: string): Promise<any> {
    try {
      let paystackAddSubaccountResponse = await paystackActions.addSubaccount(
        dto,
      );
      await this.orgModel.findOneAndUpdate(
        {_id: org_id},
        {paystack_int: paystackAddSubaccountResponse.data},
      );
      return "Attached bank account to profile";
    } catch (err) {
      throw err;
    }
  }
}
