import { Schema } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type UserPublicData = Readonly<{
  id: string;
  email: string;
  isActive: boolean;
}>;

export type UserMethods = {
  getPublicData: () => UserPublicData;
};

export type User = Readonly<{
  email: string;
  password: string;
  subscription_plan?: string;
  subscription_status?: string;
  passwordResetToken: string;
  passwordResetExpires: string;
  isActive: boolean;
  activationExpires: string;
  activationToken: string;
  paystack_int: PaystackBankIntegrationSchema,
  subscription_transaction: { [key: string]: any }
}> &
  UserMethods &
  Document;




@Schema({})
export class PaystackBankIntegrationSchema {

  business_name: string;

  account_number: string;

  percentage_charge: Number;

  settlement_bank: string;

  currency: string;

  bank: Number;

  integration: Number;

  domain: string;

  subaccount_code: string;

  is_verified: boolean;

  settlement_schedule: string;

  active: boolean;

  migrate: boolean;

  id: Number;
}













