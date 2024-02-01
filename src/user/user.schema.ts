import {Prop, Schema, SchemaFactory} from "@nestjs/mongoose";
import {ApiProperty} from "@nestjs/swagger";
import * as mongoose from "mongoose";
import {Document} from "mongoose";
import {UserPublicData} from "./user.dto";
import {AccountStatus, AccountType} from "../common/enums";
import { UserService } from "./user.service";
import {OtpDocument} from "./otp.schema";

export type UserMethods = {
  getPublicData: () => UserPublicData | any
};

export type UserDocument = User & Document & UserMethods & OtpDocument;

@Schema({
  timestamps: {
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
})
export class User {
  @ApiProperty()
  id: string;

  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.String, required: true, unique: true})
  email: string;

  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.Boolean, default: false})
  email_activated: boolean;

  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.String, required: true, unique: true})
  phone: string;

  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.String})
  first_name: string;

  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.String})
  last_name: string;

  @Prop({type: mongoose.SchemaTypes.Mixed})
  @ApiProperty({type: Object})
  location: object;

  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.String, enum: AccountType})
  account_type: string;

  @ApiProperty()
  @Prop({
    type: mongoose.SchemaTypes.String,
    default: AccountStatus.ACTIVE,
    enum: AccountStatus,
  })
  account_status: string;

  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.String, required: true})
  password: string;

  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.String})
  passwordResetToken: string;

  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.Date})
  passwordResetExpires: Date;

  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.String})
  activationToken: string;

  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.String})
  activationExpires: Date;

  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.String, default: ""})
  profile_photo: string;

  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.String, default: ""})
  cover_photo: string;

  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.String, default: ""})
  bio: string;

  @Prop({type: mongoose.SchemaTypes.String, default: "n/a"})
  technical_skill: string;

  @Prop({type: mongoose.SchemaTypes.String, default: ""})
  passcode: string;

  @Prop({type: mongoose.SchemaTypes.String, default: 0})
  balance: number;

  @Prop({type: mongoose.SchemaTypes.String, default: undefined})
  bvn: string;

  @Prop({type: mongoose.SchemaTypes.String, default: undefined})
  virtual_account_number: string;

  @Prop({type: mongoose.SchemaTypes.String, default: undefined})
  virtual_account_bank_name: string;

  @Prop({type: mongoose.SchemaTypes.String, default: "Gonana"})
  virtual_account_name: string;

  @Prop({type: mongoose.SchemaTypes.Array})
  address: Array<Record<string, any>>;

  @Prop({type: mongoose.SchemaTypes.Array})
  transactions: Array<Record<string, any>>;

  @Prop({type: mongoose.SchemaTypes.Array})
  account_details: Array<Record<string, any>>;

  @Prop({type: mongoose.SchemaTypes.Array})
  likedPosts: string[];

  @Prop({type: mongoose.SchemaTypes.String})
  country: string;

  @Prop({type: mongoose.SchemaTypes.String})
  wallet: string;

  @Prop({type: mongoose.SchemaTypes.String})
  cryptoWalletBalanceInNgn: string;

  @Prop({type: mongoose.SchemaTypes.String})
  wallet_address: string;

  @Prop({type:mongoose.SchemaTypes.String})
  privateKey: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

/**
 * Methods.
 */
UserSchema.methods.getPublicData = function () {
  const {
    id,
    email,
    first_name,
    last_name,
    profile_photo,
    cover_photo,
    account_type,
    account_status,
    bio,
    phone,
    email_activated,
    virtual_account_number,
    virtual_account_bank_name,
    virtual_account_name,
    address,
    wallet,
    cryptoWalletBalanceInNgn,
    wallet_address,
    country,
  } = this;
  const publicData = {
    id,
    email,
    first_name,
    last_name,
    profile_photo,
    cover_photo,
    account_type,
    account_status,
    bio,
    phone,
    email_activated,
    virtual_account_number,
    virtual_account_bank_name,
    virtual_account_name,
    address,
    wallet,
    cryptoWalletBalanceInNgn,
    wallet_address,
    country,
  };
  return publicData;
};

UserSchema.virtual("id").get(function () {
  //@ts-ignore
  return this._id.toHexString();
});

// Ensure virtual fields are serialised.
UserSchema.set("toJSON", {
  virtuals: true,
});
