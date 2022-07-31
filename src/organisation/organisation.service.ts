/* eslint-disable no-useless-catch */
import { Controller, Injectable, Module } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { } from "./organisation.dto";
import { OrganizationDocument, Organization } from "./organisation.schema";
import { paramCase } from "param-case";
import { GenericService } from "../generic/generic.service";


@Injectable()
export class OrganizationService extends GenericService<OrganizationDocument> {
  constructor(@InjectModel(Organization.name) private orgModel: Model<OrganizationDocument>) {
    super(orgModel);
  }
  updateItem = (publisher_id: string, updateDoc: any): Promise<any> => {
    return this.orgModel.updateOne({ publisher_id: publisher_id }, { ...updateDoc }, { upsert: true, new: true, setDefaultsOnInsert: true }).exec()
  }
}
