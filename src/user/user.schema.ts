import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ApiProperty } from "@nestjs/swagger";
import * as mongoose from "mongoose";
import { Document } from "mongoose"

import { PaystackBankIntegrationSchema } from "./user.interface";

export type UserPublicData = Readonly<{
  id: string;
  email: string;
  isActive: boolean;
}>;

export type UserMethods = {
  getPublicData: () => UserPublicData;
};

export type UserDocument = User & Document & UserMethods;


const paystackIntSchema = SchemaFactory.createForClass(PaystackBankIntegrationSchema);


@Schema({
  timestamps: {
    createdAt: "created_at",
    updatedAt: "updated_at"
  }
})
export class User {
  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String, required: true, unique: true })
  email: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String, required: true, })
  password: string
  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  passwordResetToken: string;
  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.Date })
  passwordResetExpires: Date;
  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.Boolean })
  isActive: boolean;
  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  activationToken: string
  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  activationExpires: Date;
  @ApiProperty({ type: PaystackBankIntegrationSchema })
  @Prop({ type: mongoose.SchemaTypes.Map })
  paystack_int: PaystackBankIntegrationSchema;
  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  subscription_plan: string;
  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  subscription_status: String;
  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.Map })
  subscription_transaction: any
}


export const UserSchema = SchemaFactory.createForClass(User);


/**
 * Methods.
 */
UserSchema.methods.getPublicData = function () {
  const { id, email, isActive, paystack_int } = this;
  return { id, email, isActive, paystack_int };
};
