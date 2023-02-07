import {Prop, Schema, raw, SchemaFactory} from "@nestjs/mongoose";
import {ApiProperty} from "@nestjs/swagger";
import * as mongoose from "mongoose";
import {Document} from "mongoose";
import {MFDestinationAccount, MFPaymentSource} from "src/monify/interface";
export type TransactionDocument = Transaction & Document;

@Schema({
  timestamps: {
    createdAt: "created_at", // Use `created_at` to store the created date
    updatedAt: "updated_at", // and `updated_at` to store the last updated date
  },
})
export class Transaction {
  @Prop({type: mongoose.SchemaTypes.String})
  user_id: string;

  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.String})
  source: string; //wallet, monify

  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.String})
  transactionReference: string;
  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.String})
  paymentReference: string;

  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.String})
  paidOn: string;

  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.String})
  paymentDescription: string;

  @ApiProperty({isArray: true, type: MFPaymentSource})
  @Prop({type: mongoose.SchemaTypes.Array})
  paymentSourceInformation: any[];

  @ApiProperty({type: MFDestinationAccount})
  @Prop({type: mongoose.SchemaTypes.Map})
  destinationAccountInformation: MFDestinationAccount;

  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.String})
  amountPaid: string;

  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.String})
  totalPayable: string;

  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.String})
  paymentMethod: string;

  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.String})
  currency: string;

  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.String})
  settlementAmount: string;
  paymentStatus: string;
  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.String})
  amount: string;

  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.String})
  created_at: string;

  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.String})
  updated_at: string;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
