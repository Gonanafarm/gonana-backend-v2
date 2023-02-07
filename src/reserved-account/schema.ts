import {Prop, Schema, raw, SchemaFactory} from "@nestjs/mongoose";
import {ApiProperty} from "@nestjs/swagger";
import * as mongoose from "mongoose";
import {Document} from "mongoose";
export type ReservedAccountDocument = ReservedAccount & Document;

@Schema({
  timestamps: {
    createdAt: "created_at", // Use `created_at` to store the created date
    updatedAt: "updated_at", // and `updated_at` to store the last updated date
  },
})
export class ReservedAccount {
  @Prop({type: mongoose.SchemaTypes.String})
  user_id: string;

  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.String})
  status: string;

  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.String})
  accountNumber: string;
  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.String})
  bankCode: string;
  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.String})
  bankName: string;
  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.String})
  accountName: string;
  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.String})
  accountReference: string;
  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.String})
  currencyCode: string;
  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.String})
  contractCode: string;
  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.String})
  customerName: string;
  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.String})
  customerEmail: string;

  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.Array})
  incomeSplitConfig: any[];
}

export const ReservedAccountSchema =
  SchemaFactory.createForClass(ReservedAccount);
