/* eslint-disable no-useless-catch */
import {
  BadRequestException,
  Controller,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import {Model} from "mongoose";
import {KYCApplication, KYCApplicationDocument} from "./schema";
import {GenericService} from "../generic/generic.service";
import {CartItem} from "src/cart/schema";
import {EnrollKYCDto} from "./dto";
import {UserService} from "../user/user.service";
import axios from "axios";
import config from "../config";

@Injectable()
export class KYCApplicationService extends GenericService<KYCApplicationDocument> {
  constructor(
    @InjectModel(KYCApplication.name)
    private model: Model<KYCApplicationDocument>,
    private userService: UserService,
  ) {
    super(model);
  }

  async kycEnroll(publisher_id: string, payload: EnrollKYCDto) {
    let data = {
      first_name: payload.first_name,
      last_name: payload.last_name,
      middle_name: payload.middle_name,
      phone_number: payload.phone_number,
      date_of_birth: payload.date_of_birth,
      gender: payload.gender,
    };
    if (payload.identity_means == "virtual_nin") {
      //@ts-ignore
      data.vnin = payload.identity_no;
    } else {
      //@ts-ignore
      data.id = payload.identity_no;
    }

    try {
      let response = axios.post(
        `https://api.appruve.co/v1/verifications/ng/${payload.identity_means}`,
        JSON.stringify(data),
        {
          headers: {
            Authorization: `Bearer ${config.appruv_token}`,
            "Content-Type": "application/json",
          },
        },
      );

      console.log((await response).data);

      let doc = await this.create(publisher_id, {
        ...payload,
        status: "pending",
      });

      return doc;
    } catch (err) {
      //@ts-ignore
      console.log(err.response);
      console.log("failed to send verification request");
      throw new InternalServerErrorException();
    }
  }

  async verifyKYC(publisher_id: string, payload: EnrollKYCDto) {}
}
