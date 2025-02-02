import * as mongoose from "mongoose";
import {Prop, SchemaFactory} from "@nestjs/mongoose";

export class Kyc {
  @Prop({required: true})
  userId: string;

  @Prop({required: true, unique: true})
  accountNumber: string;

  @Prop({required: true, unique: true})
  bvn: string;

  @Prop({required: true, unique: true})
  nin: string;

  @Prop({required: true})
  accountName: string;

  @Prop({required: true})
  phoneNumber: string;

  @Prop({required: true})
  tier: string;

  @Prop({required: true, unique: true})
  email: string;

  @Prop({required: true})
  userPhoto: string;

  @Prop({required: true})
  idType: string;

  @Prop({required: true})
  idNumber: string;

  @Prop({required: true})
  idIssueDate: string;

  @Prop({type: mongoose.SchemaTypes.String})
  idExpiryDate: string;

  @Prop({required: true})
  idCardFront: string;

  @Prop({type: mongoose.SchemaTypes.String})
  placeOfBirth: string;

  @Prop({type: mongoose.SchemaTypes.String})
  idCardBack: string;

  @Prop({required: true})
  houseNumber: string;

  @Prop({required: true})
  streetName: string;

  @Prop({required: true})
  state: string;

  @Prop({required: true})
  city: string;

  @Prop({required: true})
  localGovernment: string;

  @Prop({required: true})
  pep: string;

  @Prop({required: true})
  customerSignature: string;

  @Prop({required: true})
  utilityBill: string;

  @Prop({required: true})
  nearestLandmark: string;

  @Prop({type: mongoose.SchemaTypes.String})
  proofOfAddressVerification: string;
}

export const KycSchema = SchemaFactory.createForClass(Kyc);
